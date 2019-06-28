const path = require('path')
const http = require('http')
const express= require('express')
const socketio = require('socket.io')

const {generateMessage,generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser , getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server) 

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {

    socket.on('join', (options, callback)=>{
        const { error, user} = addUser({ id:socket.id, ...options})
        if(error){
                // console.log(error)
            return callback(error)
        }

        socket.join(user.room);

        socket.emit('message',generateMessage('Admin','Welcome!'));
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`));
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id);

        if(!user){
           return callback("Can't find user room.")
        }
        io.to(user.room).emit('message',generateMessage(user.username,message));
        callback()
    });

    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id);
        if(!user){
           return callback("Can't find user room.")
        }
       
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://www.google.com/maps/place?q=${location.lat},${location.lng}`))
        callback()
    });

    socket.on('disconnect',()=>{

        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });

})

server.listen(port, () => console.log(`Example app listening on port ${port}!`))