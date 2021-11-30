const express = require('express');
const http = require('http');
const { connect } = require('http2');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/canvas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'canvas.html'));
});

// socket.io
/* connections format
- should only have four per [room_id]
- new names are put into element 0 and 2 in [room_id]
    - this allows for connections to happen at any time

    [room_id]: [ { socket_id: _, name: _, ready: _ }, ... ]
    ...
    [room_id]: [ { socket_id: _, name: _, ready: _ }, ... ]
*/
const connections = {};
io.on('connection', socket => {
    let room;
    let userName;
    // #region 'newPlayer' adds new player to room
    socket.on('newPlayer', params => {
        room = params.room;
        userName = params.name;
        // if room does not exist, create new room
        if(!connections[room]) {
            connections[room] = [null, null, null, null];
        }
        // check if room is full
        const twoConnected = connections[room][0] && connections[room][2];
        let nameMatch = false;  // no match initially
        let matchIndex;
        for(let i = 0; i < connections[room].length; i++) {
            if(!connections[room][i]) { // skip over null
                continue;
            }
            if(connections[room][i]['name'] === userName) {
                nameMatch = true;
                matchIndex = i;
                break;
            }
        }
        // duplicate name case i.e. third socket with same name
        if(connections[room][matchIndex] && connections[room][matchIndex + 1]) {
            console.log(`Room ${room} is full! Sending a rejection...`);
            socket.emit('room-full');
            return;
        }
        // two connected and no name match
        if(twoConnected && !nameMatch) {
            console.log(`Room ${room} is full! Sending a rejection...`);
            socket.emit('room-full');
            return;
        }
        // add new user into room
        const newSocket = {
            socket_id: socket.id,
            name: userName,
            ready: false
        }
        if(nameMatch) {
            // if name matched means this is the second socket 
            // i.e. not the main socket
            connections[room][matchIndex + 1] = newSocket;
            console.log('1: ' + socket.id);
        }
        else {
            if(!connections[room][0]) { // first slot is empty
                connections[room][0] = newSocket;
                // socket.emit('main-socket');
                // socket.emit('player-num', 0);
                io.to(connections[room][0]['socket_id']).emit('main-socket');
                io.to(connections[room][0]['socket_id']).emit('player-num', 0);
                console.log('2: ' + socket.id);
            }
            else {  // second player slot is empty
                connections[room][2] = newSocket;
                // socket.emit('main-socket');
                // socket.emit('player-num', 1);
                io.to(connections[room][2]['socket_id']).emit('main-socket');
                io.to(connections[room][2]['socket_id']).emit('player-num', 1);
                console.log('3: ' + socket.id);
            }
        }
        console.log(connections);
        // add socket to room
        socket.join(room);
        // let everyone know in this room that a new player has connected
        io.to(room).emit('new-player', userName);
    });
    // #endregion
    // #region 'check-for-others' when first arriving check if others are here
    socket.on('check-for-others', () => {
        const otherPlayersInfo = {
            firstPlayer: connections[room][0],
            secondPlayer: connections[room][2]
        }
        socket.emit('check-for-others', otherPlayersInfo);
    });
    // #endregion
    // #region 'player-ready' let other players know player is ready
    socket.on('player-ready', () => {
        // set ready on server
        for(let i = 0; i < connections[room].length; i++) {
            if(!connections[room][i]) { // skip over null
                continue;
            }
            if(connections[room][i]['name'] === userName) {
                connections[room][i]['ready'] = true;
            }
        }
        // send out which player is ready
        io.to(room).emit('friend-ready', userName);
    });
    // #endregion
    // #region 'both-ready' once both ready disable canvas
    socket.on('both-ready', () => {
        socket.emit('disable-canvas');
    });
    // #endregion
    // #region 'disconnect'
    socket.on('disconnect', () => {
        for(let i = 0; i < connections[room].length; i++) {
            if(!connections[room][i]) { // skip over null
                continue;
            }
            // remove from connections
            if(connections[room][i]['socket_id'] === socket.id) {
                connections[room][i] = null;
            }
        }
        io.to(room).emit('disconnected-player', userName);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});