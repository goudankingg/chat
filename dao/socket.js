let dbserver=require('./dbserver')

module.exports=function(io){
    var users={}
    
    io.on('connection',(socket)=>{
        
        console.log('socket链接成功');
        socket.on('login',(id)=>{
            socket.name=id
            users[id]=socket.id
            socket.emit('login',socket.id);
        });
        socket.on('msg',(msg,fromid,toid)=>{
            //console.log(msg);
            dbserver.updateLastMsgTime({uid:fromid,fid:toid});
            dbserver.insertMsg(fromid,toid,msg.message,msg.types);
            if(users[toid]){
               socket.to(users[toid]).emit('msg',msg,fromid,0); 
            }
            socket.emit('msg',msg,toid,1); 
            
        });
        socket.on('disconnecting',()=>{
            //console.log(users);
            if(users.hasOwnProperty(socket.name)){
                delete users[socket.name]
                console.log(socket.id+' 离开');
            }
            
        });
        socket.on('group',function(data){
            socket.join(data)
        });
        socket.on('groupMsg',function(msg,fromid,gid,name,img){
            

            socket.to(gid).emit('groupmsg',msg,fromid,gid,name,img,0)
            socket.emit('groupmsg',msg,fromid,gid,name,img,1)
        });

        //离开页面
        socket.on('leaveChatr',function(uid,fid){
            socket.emit('leavechatr',uid,fid)
        });
    })
}
