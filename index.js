const express = require("express");
const cors = require("cors");

require("dotenv/config");


const app = express();
let PORT = process.env.PORT || 5500;

const http = require('http');
const server = http.Server(app);
const socketIO = require('socket.io')(server,{
    cors:{
        origin:"*"
    }
});

app.use(cors({origin:"*",preflightContinue:false}));

let users = [];

const createUsers = (userSocketID,client)=>{
  if(users.length>0){
    users.forEach((user,index) => {
      if(user.client.id == client.id){
        users.splice(index,1);
      }
        users.push({userSocketID,client})
    });
  }else{
    users.push({userSocketID,client})
  }
}

const deleteFromUsers = (userSocketID) =>{
    for(let i=0;i<users.length;i++){
        if(users[i].userSocketID == userSocketID){
            users.splice(i,1);
        }
    }
}


socketIO.on("connection",(socket)=>{

    socket.on("message",(message)=>{
        const data = JSON.parse(message);
        if(data.user){
            createUsers(socket.id,data.user);
        }
    });

    socket.on("send",(message)=>{
        let info = message;
        let receiver = users.find(user=>user.client.id==info.to);
        socketIO.emit("chat-message",message);
        if(receiver){
            socketIO.to(receiver.userSocketID).emit("chat-message",JSON.stringify({to:receiver.client.id,from:info.from,message:info.message}));
        }
    });


    socket.on("send-group-message",(message)=>{
        let info = message;
        socketIO.emit("group-message",message);
    });


    socket.on("disconnect",()=>{
        deleteFromUsers(socket.id);
        socket.disconnect();
    })

})


app.get("/",(req,res)=>{
    return res.json({"message":"CHAT APP"});
});

server.listen(PORT,(err)=>{
    if (err) {
        throw err
    }
    console.log("Running on port "+PORT);
})