const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')


const app=express()
const server=http.createServer(app)//if we don't do it express does it in the backend automatically
const io=socketio(server)//it expects to be called with raw http server, So if express creates server behind the scene ,it does not work with that


const port=process.env.PORT ||3000
const publicdirectorypath=path.join(__dirname,'../public')

//static middleware
app.use(express.static(publicdirectorypath))

//fired on connection event
//server(emit)-> client(recieve)-countUpdated
//Client(emit)-> server(receive)-increment
io.on('connection',(socket)=>{
    console.log('New Client  Connection!')
    
    socket.on('join',({username,room},callback)=>{
        const {error,user}=addUser({id:socket.id,username,room})
        if(error)
        {
           return callback(error)
        }
        socket.join(user.room)
        
        socket.emit('message',generateMessage("Welcome!")) 
        socket.broadcast.to(user.room).emit('message',generateMessage(user.username+' has joined!'))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(msg,callback)=>{
        const user=getUser(socket.id)
        const filter=new Filter()
        if(filter.isProfane(msg))
        {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,msg))
        callback()
    })

    socket.on('sendLocation',(loc,callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${loc.lat},${loc.long}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user)
        {
        io.to(user.room).emit('message',generateMessage(`${user.username} has left!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        }
    })
})



server.listen(port,()=>{
    console.log('server is UP on port '+port)
})