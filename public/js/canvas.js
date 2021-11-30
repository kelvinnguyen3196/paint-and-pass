// waiting modal scripting
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const userName = params.name;
const roomId = params.room;

document.getElementById('modal-playerName').innerHTML = userName;
document.getElementById('room-id').innerHTML = roomId;

const modalReady = document.getElementById('modal-button');

// socket.io variables
let userReady = false;
let friendReady = false;
// let friendConnected = false;
let bothReady = false;

let mainSocket = false; // we assume we aren't main socket unless otherwise told

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

    const socket = io();

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
            // most if actions should contain if(mainSocket)
                // this is so that actions only happen once
        // add event listener on ready button
        modalReady.addEventListener('click', () => {
            socket.emit('player-ready');
            // we know we are ready, so toggle
            toggleReadyDot('ready-dotPlayer', 'green', userName);
            userReady = true;
            // check if we are both ready
            if(userReady && friendReady) {
                bothReady = true;
                document.getElementById('waiting-modal-wrapper').style.display = 'none';
            }
        });
        // I. socket.emit
        // #region 'newPlayer' let server know we connected
        socket.emit('newPlayer', params);
        socket.emit('check-for-others');
        // assume we were able to connect unless told otherwise
        toggleReadyDot('ready-dotPlayer', 'red', userName);
        // #endregion

        // II. socket.on
        // #region 'room-full' redirect artist back to home page
        socket.on('room-full', () => {
            alert(`Room ${roomId} is full! Redirecting you back to home page...`);
            window.location.href = 'http://localhost:3000/';
        });
        // #endregion
        // #region 'main-socket' we know we are the main socket
        socket.on('main-socket', () => {
            mainSocket = true;
        });
        // #endregion
        // #region 'new-player' new information about new player
        socket.on('new-player', user => {
            if(user === userName) { // we don't need to know we just connected
                return;
            }
            if(mainSocket) {
                // friend has connected but is not ready
                toggleReadyDot('ready-dotFriend', 'red', user);
            }
        });
        // #endregion
        // #region 'check-for-others' receive info about other players
        socket.on('check-for-others', otherPlayersInfo => {
            let otherPlayer;
            // case where we are the first player, no one here yet
            if(otherPlayersInfo['firstPlayer']['name'] === userName) {
                return;
            }
            else {
                otherPlayer = otherPlayersInfo['firstPlayer'];
            }
            // set other player dot and name
            const friendColor = otherPlayer['ready'] ? 'green' : 'red';
            toggleReadyDot('ready-dotFriend', friendColor, otherPlayer['name']);
            // set friend ready status
            friendReady = otherPlayer['ready'];
        });
        // #endregion
        // #region 'friend-ready' we now know friend is ready
        socket.on('friend-ready', user => {
            if(user === userName) { // we know we are ready
                return;
            }
            friendReady = true;
            toggleReadyDot('ready-dotFriend', 'green', user);
            // check if we are both ready
            if(friendReady && userReady) {
                bothReady = true;
                document.getElementById('waiting-modal-wrapper').style.display = 'none';
            }
        });
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
    // #region socket.io helper functions
    function toggleReadyDot(id, color, name) {
        const readyDot = document.getElementById(id);
        readyDot.classList.toggle(`${color}`);

        if(id === 'ready-dotFriend') {
            document.getElementById('modal-friendName').innerHTML = name;
        }
    }
    // #endregion
}

let p5v1 = new p5(s, 'canvas-container');

// prevent right click
window.addEventListener('contextmenu', e => {
    e.preventDefault();
});