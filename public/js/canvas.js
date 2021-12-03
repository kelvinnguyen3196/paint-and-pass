import urlInfo from './linkInfo.js';
// waiting modal scripting
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const userName = params.name;
const roomId = params.room;

document.getElementById('modal-playerName').innerHTML = userName;
document.getElementById('room-id').innerHTML = roomId;

/* 
global variable so that both canvas can access them
0 = first canvas
1 = second canvas
*/
let activeCanvas;
// global tool variable so that both sockets on the page can be in sync
let playerTool = 'brush-tool';

let s = sketch => {
    // key codes
    let qKey = 81;
    let wKey = 87;
    let eKey = 69;
    let rKey = 82;

    let height = document.getElementById('canvas-container').offsetHeight;
    let width = document.getElementById('canvas-container').offsetWidth;

    let toolPreviewLayer;
    let layerManager;
    let toolManager;
    // is artist currently accessing tools like the slider?
    let accessingTools;

    const socket = io({
        query: {
            roomId: roomId,
            userName: userName
        }
    });
    /*
    ==================== variables ====================
    */
    // #region individual variables to each socket
    let socketNum;
    let userReady = false;
    let friendReady = false;
    let homeRedirectAlert = false;  // prevent multiple redirect alerts
    let bothReady = false;
    let timerId;                    // for cancelling and restarting timer later

    sketch.setup = () => {
        sketch.createCanvas(width, height);
        // not accessing tools at the start 
        // set up tool preview i.e. brush size slider
        const currentRadius = document.getElementById('brush-size').value;
        const currentOpacity = document.getElementById('brush-opacity').value;
        toolPreviewLayer = new ToolPreview(currentRadius, currentOpacity, width, height, sketch);

        // socket.io
        
        // #endregion
        /*
        ==================== socket.on ====================
        */
        // #region 'room-full' kick player our
        socket.on('room-full', () => {
            // TODO: change alert to custom alert
            alert(`Room ${roomId} is full! Redirecting you back to home page...`);
            window.location.href = `http://${urlInfo.url}:${urlInfo.port}`;
        });
        // #endregion
        // #region 'socket-num' receive socket number
        socket.on('socket-num', num => {
            socketNum = Number(num);
            // #region all sockets get own switch button handler
            document.getElementById('switch-button').addEventListener('click', DEVELOPER_switchButtonHandler);
            // #endregion
            // #region set event listeners for sliders
            document.getElementById('brush-size').addEventListener('input', () => {
                accessingTools = true;
                toolPreviewLayer.radius = document.getElementById('brush-size').value;
            });
            document.getElementById('brush-size').addEventListener('mouseup', () => {
                accessingTools = false;
            });
            document.getElementById('brush-opacity').addEventListener('input', () => {
                accessingTools = true;
                toolPreviewLayer.opacity = document.getElementById('brush-opacity').value;
            });
            document.getElementById('brush-opacity').addEventListener('mouseup', () => {
                accessingTools = false;
            });
            // #endregion
            // #region each socket sets up own tool and layer managers
            toolManager = new ToolManager(layerManager, width, height, sketch, socketNum, socket);
            layerManager = new LayerManager();
            // set up first layer - we never draw on background
            layerManager.addLayerWithoutMessage(new Layer(width, height, sketch), width, height, sketch, toolManager, socketNum, socket);
            // #endregion
            // only leader sockets allowed
            if(socketNum === 1 || socketNum === 3) return;
            // set active canvas variable
            activeCanvas = socketNum === 0 ? 0 : 1;
            // add ready button event listener since this is only called once
            document.getElementById('modal-button').addEventListener('click', () => {
                // set our status to green
                toggleReadyDotAndStatus('ready-dotPlayer', 'green', userName);
                // let server know we are ready
                socket.emit('player-ready');
                // check if we are both ready
                checkIfBothReady();
            });
        });
        // #endregion
        // #region 'new-player' new information about new player, including self
        socket.on('new-player', user => {
            // only leader sockets
            if(socketNum === 1 || socketNum === 3) return;
            // only sockets 0 and 2 should remain
            if(user === userName) {
                toggleReadyDotAndStatus('ready-dotPlayer', 'red', user);
            }
            else {
                toggleReadyDotAndStatus('ready-dotFriend', 'red', user);
            }
            // once we are checked in ask server about other players info
            socket.emit('check-players');
        });
        // #endregion
        // #region 'check-players' receive info about other players in room
        socket.on('check-players', players => {
            // on leader sockets allowed
            if(socketNum === 1 || socketNum === 3) return;
            // if we are first player we will or have received notification of a
            // new player from 'new-player'
            let otherPlayer;
            if(players['firstPlayer']['name'] === userName) {
                return;
            }
            else {  // case where are are the second player and we arrived later
                otherPlayer = players['firstPlayer'];
            }
            // set friend color
            const friendStatusColor = otherPlayer['ready'] ? 'green' : 'red';
            toggleReadyDotAndStatus('ready-dotFriend', friendStatusColor, otherPlayer['name']);
        });
        // #endregion
        // #region 'friend-ready' we now know friend is ready
        socket.on('friend-ready', user => {
            // we know we are ready
            if(user === userName) return;
            // otherwise our friend is ready
            friendReady = true;
            toggleReadyDotAndStatus('ready-dotFriend', 'green', user);
            // check if we are both ready
            checkIfBothReady();
        });
        // #endregion
        // #region 'both-ready'
        socket.on('both-ready', () => {
            bothReady = true;
            // leader sockets will turn off canvas
            if(socketNum === 1 || socketNum === 3) return;
            // turn off canvas
            if(socketNum === 0) {   // p0 turns off second canvas
                document.getElementById('defaultCanvas0').style.display = 'block';
                document.getElementById('defaultCanvas1').style.display = 'none';
            }
            else if(socketNum === 2) {  // p1 turns off first canvas
                document.getElementById('defaultCanvas0').style.display = 'none';
                document.getElementById('defaultCanvas1').style.display = 'block';
            }
            // start timer if not already started yet
            if(timerId) return;
            timerId = startTimer();
        });
        // #endregion
        // #region 'swap-canvas' timer is up time to swap canvas
        socket.on('swap-canvas', () => {
            clearInterval(timerId);
            DEVELOPER_switchButtonHandler();
            if(socketNum === 1 || socketNum === 3) return;
            // only leader sockets allowed after this
            timerId = null;
            document.getElementById('time-left').innerHTML = '0:10';
            timerId = startTimer();
        });
        // #endregion
        // #region 'disconnected-player' handler when friend disconencted
        socket.on('disconnected-player', user => {
            // if waiting modal is still on then just remove the other person's name
            const waitingModal = document.getElementById('waiting-modal-wrapper');
            const waitingModalStyle = window.getComputedStyle(waitingModal);
            // if modal is up
            if(waitingModalStyle.display !== 'none') {
                // only leader sockets allowed
                if(socketNum === 1 || socketNum === 3) return;
                const defaultName = 'Waiting on another player...';
                toggleReadyDotAndStatus('ready-dotFriend', 'lightslategray', defaultName);
            }
            else {  // modal is gone
                // already got alert
                if(homeRedirectAlert) return;
                // only leader sockets allowed
                if(socketNum === 1 || socketNum === 3) return;
                // resend alert
                // TODO: create custom alert
                alert('Your friend has left the room. Redirecting back to the home page...');
                window.location.href = `http://${urlInfo.url}:${urlInfo.port}`;
                homeRedirectAlert = true;
            }
        });
        // #endregion
        /*
        ==================== socket.on receive paint data ====================
        */
        // #region 'paint-data' receive paint data and paint
        socket.on('paint-data', data => {
            // r - received
            const rColor = data.color;
            const rRadius = Number(data.radius);
            const rMX = Number(data.mx);
            const rMY = Number(data.my);
            const rWidth = Number(data.width);
            layerManager.paintOnLayer(sketch.color(rColor), rRadius, rMX, rMY, rWidth, sketch);
        }); 
        // #endregion 
        // #region 'eraser-data' receive eraser data and erase
        socket.on('eraser-data', data => {
            // r - received
            const rColor = data.color;
            const rRadius = Number(data.radius);
            const rMX = Number(data.mx);
            const rMY = Number(data.my);
            const rWidth = Number(data.width);
            layerManager.paintOnLayer(rColor, rRadius, rMX, rMY, rWidth, sketch);
        });
        // #endregion
        // #region 'new-layer' create new later
        socket.on('new-layer', () => {
            const newLayer = new Layer(width, height, sketch);
            layerManager.addLayerWithoutMessage(newLayer, width, height, sketch, toolManager, socketNum, socket);
        });
        // #endregion
        // #region 'delete-layer' delete layer from message
        socket.on('delete-layer', layer => {
            layerManager.deleteLayerWithoutMessage(layer, width, height, sketch, toolManager, socketNum, socket);
        });
        // #endregion
        // #region 'toggle-layer' toggle layer from message
        socket.on('toggle-layer', layer => {
            layerManager.toggleLayerWithoutMessage(layer, socketNum);
        });
        // #endregion
        /*
        ==================== helper functions ====================
        */
        // #region helper functions
        function toggleReadyDotAndStatus(id, color, name) {
            document.getElementById(id).style.backgroundColor = color;
            // set friend name
            if(id === 'ready-dotFriend') {
                document.getElementById('modal-friendName').innerHTML = name;
            }
            // toggle ready boolean for friend
            if(id === 'ready-dotFriend' && color === 'green') {
                friendReady = true;
            }
            else if(id === 'ready-dotFriend' && (color === 'red' || color === 'lightslategray')) {
                friendReady = false;
            }
            // toggle ready boolean for self
            if(id === 'ready-dotPlayer' && color === 'green') {
                userReady = true;
            }
            else if(id === 'ready-dotPlayer' && (color === 'red' || color === 'lightslategray')) {
                userReady = false;
            }
        }
        // make sure to only have sockets 0 and 2 call this function
        function checkIfBothReady() {
            if(userReady && friendReady) {
                bothReady = true;
                document.getElementById('waiting-modal-wrapper').style.display = 'none';
                socket.emit('both-ready');
            }
        }
        function startTimer() {
            const id = setInterval(() => {
                const currentTimeLeft = document.getElementById('time-left').innerHTML;
                const timeSplit = currentTimeLeft.split(':');
                const secondsLeft = (Number(timeSplit[0]) * 60) + (Number(timeSplit[1]));
                const remainingTime = secondsLeft - 1;
                const remainingMinutes = Math.floor(remainingTime / 60);
                const remainingSeconds = remainingTime % 60;
                const paddedSeconds = String(remainingSeconds).padStart(2, '0');
                const time = `${remainingMinutes}:${paddedSeconds}`;
                document.getElementById('time-left').innerHTML = time;

                if(time === '0:00') {
                    clearInterval(timerId);
                    timerId = null; // reset timer id
                    if(socketNum === 0) {
                        socket.emit('swap-canvas');
                    }
                }
            }, 1000);
            return id;
        }
        // #endregion
        /*
        ==================== developer functions ====================
        */
        // #region developer functions
        function DEVELOPER_logReadyStatus() {
            console.log(`s${socketNum}: u-${userReady}; f-${friendReady}; b-${bothReady}`);
        }

        function DEVELOPER_logSocketNumbers() {
            console.log(`socket ${socketNum}`);
        }
        function DEVELOPER_switchButtonHandler() {
            const firstCanvas = document.getElementById('defaultCanvas0');
            const secondCanvas = document.getElementById('defaultCanvas1');
            const firstCanvasStyle = window.getComputedStyle(firstCanvas);
            const secondCanvasStyle = window.getComputedStyle(secondCanvas);

            // current socket will close their layer window if open
            toolManager.closeLayersWindow(socketNum);

            // only leader sockets swap
            if(socketNum === 0 || socketNum === 2) {
                // swap first canvas display
                if(firstCanvasStyle.display === 'none') {
                    document.getElementById('defaultCanvas0').style.display = 'block';
                    activeCanvas = 0;
                }
                else if(firstCanvasStyle.display === 'block') {
                    document.getElementById('defaultCanvas0').style.display = 'none';
                }
                // swap first canvas display
                if(secondCanvasStyle.display === 'none') {
                    document.getElementById('defaultCanvas1').style.display = 'block';
                    activeCanvas = 1;
                }
                else if(secondCanvasStyle.display === 'block') {
                    document.getElementById('defaultCanvas1').style.display = 'none';
                }
            }
            // beyond here sockets act only when their canvas is active
            // if(socketNum === 0 && activeCanvas === 1) return;
            // if(socketNum === 1 && activeCanvas === 0) return;
            // if(socketNum === 2 && activeCanvas === 1) return;
            // if(socketNum === 3 && activeCanvas === 0) return;

            if(playerTool !== 'layer-tool') {
                toolManager.setTool(playerTool, layerManager, width, height, sketch, socketNum, socket);
            }
            else {
                toolManager.setTool('brush-tool', layerManager, width, height, sketch, socketNum, socket);
            }
        }
        // #endregion      
    }

    sketch.draw = () => {
        sketch.background('#ffffff');
        if(!bothReady) return;
        // render all layers
        layerManager.renderLayers(sketch);
        // tool preview should always be last line of code executed to be on top
        toolPreviewLayer.drawPreview(sketch.mouseX, sketch.mouseY, width, height, sketch);
    }

    sketch.mouseDragged = () => {
        // [0] only paint on first canvas, [1] with second canvas, etc
        if(socketNum === 0 && activeCanvas === 1) return;
        if(socketNum === 1 && activeCanvas === 0) return;
        if(socketNum === 2 && activeCanvas === 1) return;
        if(socketNum === 3 && activeCanvas === 0) return;

        if(bothReady && !accessingTools && toolManager.currentTool === 'brush-tool') {
            const currentColor = document.getElementById('color-selector').value;
            const currentRadius = document.getElementById('brush-size').value;
            const currentOpacity = document.getElementById('brush-opacity').value;
            // convert color from hex to rgba to support alpha
            const currentColorHex = sketch.color(currentColor);
            const r = sketch.red(currentColorHex);
            const g = sketch.green(currentColorHex);
            const b = sketch.blue(currentColorHex);
            const currentColorRGBA = sketch.color('rgba(' + r + ',' + g + ',' + b + ',' + currentOpacity + ')');
            // the algorithm behind sketch uses twice as large radius so we need
            // to divide by two to get an accurate size
            layerManager.paintOnLayer(currentColorRGBA, Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);

            const paintData = {
                color: 'rgba(' + r + ',' + g + ',' + b + ',' + currentOpacity + ')',
                radius: Number(currentRadius) / 2,
                mx: sketch.mouseX,
                my: sketch.mouseY,
                width: width
            }

            socket.emit('paint-data', paintData);
        }
        if(bothReady && !accessingTools && toolManager.currentTool === 'eraser-tool') {
            const eraserColor = sketch.color(0, 0);
            const currentRadius = document.getElementById('brush-size').value;

            layerManager.paintOnLayer(eraserColor, Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);

            const eraserData = {
                color: eraserColor,
                radius: Number(currentRadius) / 2,
                mx: sketch.mouseX,
                my: sketch.mouseY,
                width: width
            }

            socket.emit('eraser-data', eraserData);
        }
    }

    const toolButtons = document.getElementsByClassName('tool');
    toolButtons.forEach((tool) => {
        tool.addEventListener('click', function() {
            // sockets can only activate when their canvas is active
            if(socketNum === 0 && activeCanvas === 1) return;
            if(socketNum === 1 && activeCanvas === 0) return;
            if(socketNum === 2 && activeCanvas === 1) return;
            if(socketNum === 3 && activeCanvas === 0) return;

            toolManager.setTool(this.id, layerManager, width, height, sketch, socketNum, socket);
            playerTool = this.id;
        });
    });
    // #endregion
    // #region buttons
    sketch.keyPressed = () => {
        // don't trigger keyboard shortcuts if both players aren't ready
        if(!bothReady) return;
        // swap key
        // if(sketch.keyCode === rKey) {
        //     const firstCanvas = document.getElementById('defaultCanvas0');
        //     const secondCanvas = document.getElementById('defaultCanvas1');
        //     const firstCanvasStyle = window.getComputedStyle(firstCanvas);
        //     const secondCanvasStyle = window.getComputedStyle(secondCanvas);
        //     // current socket will close their layer window if open
        //     toolManager.closeLayersWindow(socketNum);
        //     if(socketNum === 0 || socketNum === 2) {
        //         // swap first canvas display
        //         if(firstCanvasStyle.display === 'none') {
        //             document.getElementById('defaultCanvas0').style.display = 'block';
        //             activeCanvas = 0;
        //         }
        //         else if(firstCanvasStyle.display === 'block') {
        //             document.getElementById('defaultCanvas0').style.display = 'none';
        //         }
        //         // swap first canvas display
        //         if(secondCanvasStyle.display === 'none') {
        //             document.getElementById('defaultCanvas1').style.display = 'block';
        //             activeCanvas = 1;
        //         }
        //         else if(secondCanvasStyle.display === 'block') {
        //             document.getElementById('defaultCanvas1').style.display = 'none';
        //         }
        //     }
        //     // beyond here sockets act only when their canvas is active
        //     if(socketNum === 0 && activeCanvas === 1) return;
        //     if(socketNum === 1 && activeCanvas === 0) return;
        //     if(socketNum === 2 && activeCanvas === 1) return;
        //     if(socketNum === 3 && activeCanvas === 0) return;

        //     toolManager.setTool(toolManager.currentTool, layerManager, width, height, sketch, socketNum, socket);
        // }
        // sockets can only activate when their canvas is active
        if(socketNum === 0 && activeCanvas === 1) return;
        if(socketNum === 1 && activeCanvas === 0) return;
        if(socketNum === 2 && activeCanvas === 1) return;
        if(socketNum === 3 && activeCanvas === 0) return;

        if(sketch.keyCode === qKey) {
            toolManager.setTool('brush-tool', layerManager, width, height, sketch, socketNum, socket);
            playerTool = 'brush-tool';
        }
        else if(sketch.keyCode === wKey) {
            toolManager.setTool('eraser-tool', layerManager, width, height, sketch, socketNum, socket);
            playerTool = 'eraser-tool';
        }
        else if(sketch.keyCode === eKey) {
            toolManager.setTool('layer-tool', layerManager, width, height, sketch, socketNum, socket);
            playerTool = 'layer-tool';
        }
    }
    // #endregion
}

let firstCanvas = new p5(s, 'canvas-container');
let secondCanvas;
setTimeout(() => {
    secondCanvas = new p5(s, 'canvas-container');
}, 500);

// prevent right click
window.addEventListener('contextmenu', e => {
    e.preventDefault();
});