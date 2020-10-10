const express = require('express');
const socketio = require('socket.io');
const http = require('http');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    console.log('We have a new connection!!');

    socket.on('join', ({ name, room }, callback) => {
        const { user, error } = addUser({id: socket.id, name, room});

        if (error) {
            callback(error);
        }

        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
        //Method below send message to all the users except that specific user
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joinned`});

        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

        callback();

    })

    socket.on('trial', ({name, room}) => {
        console.log(name, room );
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        socket.to(user.room).emit('message', {user: user.name, text: message});
        socket.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left.`})
        }
    });
});

app.use(router);

server.listen(PORT, () => console.log(`Server has start on port ${PORT}`));