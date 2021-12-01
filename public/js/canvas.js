// waiting modal scripting
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const userName = params.name;
const roomId = params.room;

document.getElementById('modal-playerName').innerHTML = userName;
document.getElementById('room-id').innerHTML = roomId;

const modalReady = document.getElementById('modal-button');

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

    // socket.io variables
    const socket = io({
        query: {
            roomId: roomId,
            userName: userName
        }
    });
    let bothReady = false;

    sketch.setup = () => {
        sketch.createCanvas(width, height);
        // not accessing tools at the start 
        // set up tool preview i.e. brush size slider
        const currentRadius = document.getElementById('brush-size').value;
        const currentOpacity = document.getElementById('brush-opacity').value;
        toolPreviewLayer = new ToolPreview(currentRadius, currentOpacity, width, height, sketch);
        // set up tool manager
        toolManager = new ToolManager(layerManager, width, height, sketch);
        // set up layer manager
        layerManager = new LayerManager();
        // set up first layer - we never draw on background
        layerManager.addLayer(new Layer(width, height, sketch), width, height, sketch, toolManager);

        // socket.io
        /*
        ==================== variables ====================
        */ // individual variables to each socket
        let socketNum;
        let userReady = false;
        let friendReady = false;
        /*
        ==================== socket.on ====================
        */
        // #region 'room-full' kick player our
        socket.on('room-full', () => {
            // TODO: change alert to custom alert
            alert(`Room ${roomId} is full! Redirecting you back to home page...`);
            window.location.href = 'http://localhost:3000';
        });
        // #endregion
        // #region 'socket-num' receive socket number
        socket.on('socket-num', num => {
            socketNum = Number(num);
            // only leader sockets allowed
            console.log('socket-num start');
            DEVELOPER_logSocketNumbers();
            if(socketNum === 1 || socketNum === 3) return;
            // add ready button event listener since this is only called once
            document.getElementById('modal-button').addEventListener('click', () => {
                // set our status to green
                toggleReadyDotAndStatus('ready-dotPlayer', 'green', userName);
                // let server know we are ready
                socket.emit('player-ready');
                // check if we are both ready
                checkIfBothReady();
            });
            console.log('socket-num end')
            DEVELOPER_logSocketNumbers();
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
            else if(id === 'ready-dotFriend' && color === 'red') {
                friendReady = false;
            }
            // toggle ready boolean for self
            if(id === 'ready-dotPlayer' && color === 'green') {
                userReady = true;
            }
            else if(id === 'ready-dotPlayer' && color === 'red') {
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
        // #endregion
    }

    sketch.draw = () => {
        sketch.background('#ffffff');

        // render all layers
        layerManager.renderLayers(sketch);
        // tool preview should always be last line of code executed to be on top
        toolPreviewLayer.drawPreview(sketch.mouseX, sketch.mouseY, width, height, sketch);
    }

    sketch.mouseDragged = () => {
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
        }
        if(bothReady && !accessingTools && toolManager.currentTool === 'eraser-tool') {
            const eraserColor = sketch.color(0, 0);
            const currentRadius = document.getElementById('brush-size').value;

            layerManager.paintOnLayer(eraserColor, Number(currentRadius) / 2, sketch.mouseX, sketch.mouseY, width, sketch);
        }
    }

    // #region event listeners
    document.getElementById('brush-size').oninput = () => {
        accessingTools = true;
        toolPreviewLayer.radius = document.getElementById('brush-size').value;
    }

    document.getElementById('brush-size').onmouseup = () => {
        accessingTools = false;
    }
    
    document.getElementById('brush-opacity').oninput = () => {
        accessingTools = true;
        toolPreviewLayer.opacity = document.getElementById('brush-opacity').value;
    }

    document.getElementById('brush-opacity').onmouseup = () => {
        accessingTools = false;
    }

    const toolButtons = document.getElementsByClassName('tool');
    toolButtons.forEach((tool) => {
        tool.addEventListener('click', function() {
            toolManager.setTool(this.id, layerManager, width, height, sketch);
        });
    });
    // #endregion
    // #region buttons
    sketch.keyPressed = () => {
        if(sketch.keyCode === qKey) {
            toolManager.setTool('brush-tool', layerManager, width, height, sketch);
        }
        else if(sketch.keyCode === wKey) {
            toolManager.setTool('eraser-tool', layerManager, width, height, sketch);
        }
        else if(sketch.keyCode === eKey) {
            toolManager.setTool('layer-tool', layerManager, width, height, sketch);
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