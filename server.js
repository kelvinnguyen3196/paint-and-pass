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
    // #region introductory connection set up
    let room = socket.handshake.query.roomId;
    let userName = socket.handshake.query.userName;
    // if room does not exist, create new room
    if(!connections[room]) {
        connections[room] = [null, null, null, null];
    }
    // check if room is full - first canvas socket will occupy 0 and 2
    const twoConnected = connections[room][0] && connections[room][2];
    let nameMatch = false;
    let matchIndex;
    // check for name match
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
    // add socket to connections data structure and let each socket which socket 
    // they are
    console.log(socket.id);
    if(nameMatch) {
        // same name with space means this is the second canvas
        connections[room][matchIndex + 1] = newSocket;
        socket.emit('socket-num', (matchIndex + 1));
        console.log('option 1');
    }
    else {
        if(!connections[room][0]) { // first slot is empty
            connections[room][0] = newSocket;
            socket.emit('socket-num', 0);
            console.log('option 2');

        }
        else {
            connections[room][2] = newSocket;
            socket.emit('socket-num', 2);
            console.log('option 3');

        }
    }
    socket.join(room);
    // TODO: add socket id and userName as an object so the main socket only does
        // TODO: things once
    io.to(room).emit('new-player', userName);
    console.log(connections);
    // #endregion
    /*
    ==================== socket.on ====================
    */
    // #region 'check-players' send back socket information about other players
    socket.on('check-players', () => {
        const players = {
            firstPlayer: connections[room][0],
            secondPlayer: connections[room][2]
        }
        socket.emit('check-players', players);
    });
    // #endregion
    // #region 'player-ready' let other players know a player is ready
    socket.on('player-ready', () => {
        for(let i = 0; i < connections[room].length; i++) {
            if(!connections[room][i]) { // skip over null
                continue;
            }
            if(connections[room][i]['name'] === userName) {
                connections[room][i]['ready'] = true;
            }
        }
        // send out which player is ready to other player
        io.to(room).emit('friend-ready', userName);
    });
    // #endregion
    // #region 'both-ready' both are ready - sent bothReady = true for ALL sockets
    socket.on('both-ready', () => {
        // send out message to every socket
        io.to(room).emit('both-ready');
        console.log('both-ready');
        console.log(connections);
    });
    // #endregion
    
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`);
});