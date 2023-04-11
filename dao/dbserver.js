//dao Database Access Object
//专门用来处理数据的一层
//引入加密解密模块
const bcrypt = require('./bcrypt')
//引入数据库操作模块
const dbmodel = require('../model/dbmodel');
//引入数据库中的User表
const User = dbmodel.model('User');
//引入Friend表
const Friend = dbmodel.model('Friend');
//引入Group表
const Group = dbmodel.model('Group');
//引入GroupUser表
const GroupUser = dbmodel.model('GroupUser');
//引入消息表
const Message = dbmodel.model('Message');
//引入群消息表
const GroupMsg = dbmodel.model('GroupMessage');
//const GroupUser = dbmodel.model('GroupUser');
//引入Token模块
const jwt = require('./jwt');
//TODO 用户查找 还未完成
exports.findUser = function (res) {
    User.find(function (err, val) {
        if (err) {
            console.log("用户数据查找失败！" + err);
        } else {
            res.send(val);
        }
    })
}
//新增用户 在数据库中添加新的数据
exports.buildUser = function (name, mail, pwd, res) {
    //密码加密
    let password = bcrypt.encryption(pwd);
    //console.log(password);
    let data = {
        name: name,
        email: mail,
        psw: password,
        //time:new Date(),
        time: new Date()
    }
    // res.send(data)
    let user = new User(data);
    user.save((err, result) => {
        if (err) {
            console.log("保存失败");
            res.send({status:500});
        } else {
            console.log("保存成功");
            res.status(200).send(data);
        }
    });
}
//匹配用户表元素个数
exports.countUserValue = function (data, type, res) {
    let wherestr = {};
    //wherestr = {'type':data};
    wherestr[type] = data;

    User.countDocuments(wherestr, (err, result) => {
        if (err) {
            res.send({ status: 500 })
        } else {
            res.send({ status: 200, result });
        }
    })
}
//用户验证用户匹配 当用户输入用户名或者邮箱时 进行相关匹配 存在就进行下一步的操作
//data 可以是用户名也可以是邮箱
exports.userMatch = function (data, pwd, res) {
    //查询条件 姓名或邮箱 存在的 name等于data 或者 email等于data的    
    let wherestr = { $or: [{ 'name': data }, { 'email': data }] };
    //输出的匹配项
    let out = { 'name': 1, 'imgurl': 1, 'psw': 1 };
    //等价于SELECT * FROM User WHERE name = data OR email = data;
    User.find(wherestr, out, (err, result) => {
        if (err) {
            res.send({ status: 500 });//500(服务器错误)
        } else {
            //查询的结果为空就返回400（参数错误，通常用在表单参数错误）
            if (result === '') {
                res.send({ status: 400 });
            }
            //如果在数据库中找到有对应的用户 将得到的结果进行遍历
            result.map(function(e) {
                //密码校验
                console.log('e:'+e);
                const pwdMatch = bcrypt.verification(pwd, e.psw);
                //const pwdMatch =pwd
                if (pwdMatch) {//密码正确                    
                    //登录成功之后，生成token，写到到客户端，方便下次的身份识别
                    let token = jwt.generateToken(e._id);
                    let back = {
                        id: e._id,
                        name: e.name,
                        imgurl: e.imgurl,
                        token: token
                    };

                    //返回200成功 并携带上返回值
                    res.send({ status: 200, back });
                } else {//密码错误
                    res.send({ status: 404 }); //服务器找不到请求的资源404
                }
            })
        }
    })
}

//搜索用户
exports.searchUser = function (data, res) {
    let wherestr = '';
    if (data === 'superchat') {
        wherestr = {};
    } else {
        wherestr = { $or: [{ 'name': { $regex: data } }, { 'email': { $regex: data } }] }
    };
    let out = {
        'name': 1,
        'email': 1,
        'imgurl': 1
    };
    User.find(wherestr, out, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200, result });
        }
    })
};
//判断是否为好友
exports.isFriend = function (uid, fid, res) {                     //uid 用户的id fid朋友的id
    let wherestr = { 'userID': uid, 'friendID': fid, 'state': 0 };
    Friend.findOne(wherestr, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            if (result) {
                //是好友
                res.send({ status: 200 ,result});
            } else {
                //不是好友
                res.send({ status: 400 });
            }
        }
    })
}
//搜索群
exports.searchGroup = function (data, res) {
    let wherestr = '';
    if (data == 'superchat') {
        wherestr = {};
    } else {
        wherestr = { 'name': { $regex: data } };
    }
    let out = {
        'name': 1,
        'imgurl': 1
    }
    Group.find(wherestr, out, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200, result })
        }
    })
}
//判断自己是否为群成员即是不是在群内
exports.isGroupUser = function (uid, gid, res) {              //uid用户id gid群id
    let wherestr = { 'userID': uid, 'groupID': gid };
    GroupUser.findOne(wherestr, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            if (result) {
                //是成员
                res.send({ status: 200,result });
            } else {
                //不是成员
                res.send({ status: 400 });
            }
        }
    })
}

//查询用户详情
exports.userDetail = function (id, res) {
    let wherestr = { '_id': id };
    let out = { 'psw': 0 };//0表示不需要把password查询出来 把其他的查询出来就行
    User.findOne(wherestr, out, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200, result })
        }
    })
}
function update(data, update, res) {
    User.findByIdAndUpdate(data, update, (err, result) => {
        if (err) {
            //修改失败
            res.send({ status: 500 });
        } else {
            //修改成功
            res.send({ status: 200, result });
        }
    })
}
//用户详情 用户信息修改
exports.userUpdate = function (data, res) {
    let updatestr = {};
    //判断是否有密码 修改密码时 需要额外传进来 原来的密码data.pwd 要修改成的内容为data.data
    if (typeof (data.pwd) != 'undefined') {
        User.find({ '_id': data.id }, { 'psw': 1 }, (err, result) => {
            if (err) {            
                res.send({ status: 500 }) 
            } else {              
                if (result == '') {
                    res.send({ status: 400 });
                }
                //非空即该用户存在就执行以下代码
                result.map((e) => {
                    const pswdMatch = bcrypt.verification(data.pwd, e.psw);
                    //密码验证正确
                    if (pswdMatch) {
                        //如果要更新的是密码，那就先加密再进行更新
                        if (data.type === 'psw') {
                            //密码加密
                            let password = bcrypt.encryption(data.data);
                            updatestr[data.type] = password;
                            update(data.id, updatestr, res);
                        } else {
                            //不是密码就更新其它
                            //邮箱匹配
                            updatestr[data.type] = data.data;
                            User.countDocuments(updatestr, (err, result) => {
                                if (err) {
                                    res.send({ status: 500 })
                                } else {
                                    //没有匹配项 可以修改
                                    if (result == 0) {
                                        update(data.id, updatestr, res);
                                    }else{
                                        res.send({ status: 600 })
                                    }
                                    
                                }
                            })
                        }                       
                    } else {
                        //密码匹配失败
                        res.send({ status: 400 });
                    }
                })
            }
        })
    } else if (data.type == 'name') {
        //如果是用户名先进行匹配
        updatestr[data.type] = data.data;
        User.countDocuments(updatestr, (err, result) => {
            if (err) {
                res.send({ status: 500 })
            } else {
                //没有匹配项 可以修改
                if (result == 0) {
                    update(data.id, updatestr, res);
                } else {
                    res.send({ status: 300 })
                }
            }
        })
    } else {
        //一般项部分修改
        updatestr[data.type] = data.data;
        update(data.id, updatestr, res);
    }
};


//获取好友昵称
exports.getFriendNickname = function (data, res) {
    let wherestr = { 'userID': data.uid, 'friendID': data.fid };
    let out = { 'markname':1 };
    Friend.findOne(wherestr, out, (err, result) => {
        if (err) {
            //获取失败
            res.send({ status: 500 })
        } else {
            //获取成功
            res.send({ status: 200, result });
        }
    })
}

//修改好友的备注
exports.alterFriendNickname = function (data, res) {
    let wherestr = { 'userID': data.uid, 'friendID': data.fid };
    let updatestr = { 'markname': data.name };
    Friend.updateOne(wherestr, updatestr, (err, result) => {
        if (err) {
            //修改失败
            res.send({ status: 500 });
        } else {
            //修改成功
            res.send({ status: 200 ,result});
        }
    })
}

//添加好友
exports.buildFriend = function (uid, fid, state, res) {
    let data = {                          // 与数据表字段对应
        userID: uid,
        friendID: fid,
        state: state,    
                 //好友状态（0表示已为好友，1表示申请成功，2表示发送方）
        time: new Date(),
        lastTime: new Date(),
    }
    let friend = new Friend(data);
    // 保存
    friend.save((err, result) => {
        if (err) {
            console.log('申请好友出错');
            //res.send({status:500});
        } else {
            
            //res.send({status:200, result});
        }
    })
}

//添加一对一消息
exports.insertMsg = function (uid, fid, msg, type, res) {
    let data = {
        userID: uid,
        friendID: fid,
        message: msg,
        types: type,
        time: new Date(),
        state: 1, // 消息状态 （0已读，1未读）
    }
    let message = new Message(data)
    message.save((err, result) => {
            if (err) {
                if(res){
                    res.send({ status: 500 });
                    console.log('添加消息错误');
                }
            } else {
                if(res){
                    res.send({status:200}); 
                    console.log('添加消息正确');
                }
            }
    })
}

//好友申请  为了不改变this的方向 使用箭头函数
exports.applyFriend = (data, res)=> {
    //console.log('开始加好友');
    let wherestr = { 'userID': data.uid, 'friendID': data.fid }
    //res.send(wherestr);
    Friend.countDocuments(wherestr, (err, result) => {

        if (err) {
            res.send({ status: 500 })
        } else {
            //console.log(result);
            // 1.判断是否已经申请过
            if (result == 0) {
                // 1.1 第一次申请
                this.buildFriend(data.uid, data.fid, 2);
                this.buildFriend(data.fid, data.uid, 1);
            } else {
                // 1.2 已经申请过
                this.updateLastMsgTime(data.uid,data.fid)
                
            }
            // 1.3 添加消息
            this.insertMsg(data.uid, data.fid, data.msg, 0, res)
        }
    })
}

//好友的最后一条消息的通讯时间
exports.updateLastMsgTime = function (data) {
    //同时匹配 自己对调
    let wherestr = { $or: [{ 'userID': data.uid, 'friendID': data.fid }, { 'userID': data.fid, 'friendID': data.uid }] }
    let updatestr = { 'lastTime': new Date() }
    Friend.updateMany(wherestr, updatestr, (err, result) => {
        if (err) {
            console.log('更新时间错误');
            //res.send({status:500})
        } else {
            //res.send({status:200, result})
        }
    })
}



//更新与好友的状态（同意）
exports.updateFriendState = (data, res) => {
    let wherestr = { $or: [{ 'userID': data.uid, 'friendID': data.fid }, { 'userID': data.fid, 'friendID': data.uid }] }
    // 好友状态更新：0
    Friend.updateMany(wherestr, { 'state': 0 }, (err, result) => {
        if (err) {
            res.send({ status: 500 })
        } else {
            console.log('同意');
           
            res.send({ status: 200 })
        }
    })
    
}

// 更新好友关系（拒绝或删除）
exports.deleteFriend = (data, res) => {
    let wherestr = { $or: [{ 'userID': data.uid, 'friendID': data.fid }, { 'userID': data.fid, 'friendID': data.uid }] }
    // 好友状态更新：0
    Friend.deleteMany(wherestr, (err, result) => {
        if (err) {
            res.send({ status: 500 })
        } else {
            console.log('拒绝或删除');
            res.send({ status: 200 })
        }
    })
}

//按要求获取用户列表
exports.getUsers = function (data, res){
    doIt(data,res)
}
exports.getUsers1 = function (data, res) {
    return new Promise(function(resolve,reject){
        let query = Friend.find({});
        query.where({ 'usrID': data.uid, 'state': data.state });
        query.populate('friendID');
        query.sort({ 'lastTime': -1 });
        query.exec().then(function (e) {
            let result = e.map(function (ver) {
                return {
                    id: ver.friendID._id,
                    name: ver.friendID.name,
                    markname: ver.markname,
                    imgurl: ver.friendID.imgurl,
                    lastTime: ver.lastTime,
                    type:0
                }
            })
            resolve({ status: 200 ,result});
        }).catch((err) => {
            reject({ status: 500 });
        })
    }).then(function onFulfilled (value){
        res.send(value)
    })
}
// exports.getUsers = function (data, res) {
//     let query = Friend.find({});
//     //查询条件
//     query.where({ 'usrID': data.uid, 'state': data.state });
//     //查询friendID 关联user对象
//     query.populate('friendID');
//     //排序方式 最有通讯时间倒序排列
//     query.sort({ 'lastTime': -1 });
//     //查询结果
//     query.exec().then(function (e) {
//         let result = e.map(function (ver) {
//             return {
//                 id: ver.friendID._id,
//                 name: ver.friendID.name,
//                 markname: ver.markname,
//                 imgurl: ver.friendID.imgurl,
//                 lastTime: ver.lastTime,
//                 type:0
//             }
//         })
//         res.send({ status: 200, result });
//     }).catch((err) => {
//         res.send({ status: 500 });
//     })
// }
function getUser(data) {
    return new Promise(function(resolve,reject){
        let query = Friend.find({});
        query.where({ 'userID': data.uid, 'state': data.state });
        query.populate('friendID');
        query.sort({ 'lastTime': -1 });
        query.exec().then(function (e) {
            let result = e.map(function (ver) {
                return {
                    id: ver.friendID._id,
                    name: ver.friendID.name,
                    markname: ver.markname,
                    imgurl: ver.friendID.imgurl,
                    lastTime: ver.lastTime,
                    type:0
                }
            })
            resolve(result);
        }).catch(function(err) {
            reject({ status: 500 });
        })
    })
    
}
function getOneMsg(uid,fid) {
    return new Promise(function(resolve,reject){
        let query = Message.findOne({});
        query.where({ $or: [{ 'userID': uid, 'friendID': fid }, { 'userID': fid, 'friendID': uid }] });
        query.sort({ 'time': -1 });
        query.exec().then(function (ver) {
            let result = {
                message: ver.message,
                time: ver.time,
                types: ver.types
            }
            resolve(result);
        }).catch(function (err) {
            reject({ status: 500 });
        })
    })
    
}
  function unreadMsg(uid,fid) {
    return new Promise(function(resolve,reject){
        let wherestr = { 'userID': fid, 'friendID':uid, 'state': 1 };
        Message.countDocuments(wherestr, (err, result) => {
            if (err) {
                reject({ status: 500 });
            } else {
                resolve(result);
            }
        })
    })
}
async function doIt(data,res){
    let result,bb,cc,err;
    [err,result]=await getUser(data).then(data=>[null,data]).catch(err=>[err,null])
    for(var i=0;i<result.length;i++){
        [err,bb]=await getOneMsg(data.uid,result[i].id).then(data=>[null,data]).catch(err=>[err,null])
        
        if(bb.types==0){
            
        }else if(bb.types==1){
            bb.message='[图片]'
        }else if(bb.types==2){
            bb.message='[语音]'
        }else if(bb.types==3){
            bb.message='[位置]'
        }
        result[i].msg=bb.message;
        
        [err,cc]=await unreadMsg(data.uid,result[i].id).then(data=>[null,data]).catch(err=>[err,null])
        result[i].tip=cc
    }
    if(err){
        res.send(err)
    }else{
        res.send({status:200,result})
    }
}
//汇总一对一消息未读条数
exports.unreadMsg = function (data, res) {
    //汇总条件
    let wherestr = { 'userID': data.fid, 'friendID': data.uid, 'state': 1 };
    Message.countDocuments(wherestr, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200, result });
        }
    })
}

//一对一消息 未读消息改为已读的
exports.updateMsg = function (data, res) {
    //修改项条件
    //let wherestr =({ $or: [{ 'userID': uid, 'friendID': fid, 'state': 1 }, { 'userID': fid, 'friendID': uid, 'state': 1 }] })
    
    let wherestr = { 'userID': data.uid, 'friendID': data.fid, 'state': 1 };
    //修改内容
    let updatestr = { 'state': 0 };
    Message.updateMany(wherestr, updatestr, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200});
        }
    })
}
//按要求获取群列表
exports.getGroup = function (id, res) {
    //id为用户所在的群
    let query = GroupUser.find({});
    //查询条件
    query.where( {'userID': id });
    //查找friendID 关联的user对象
    query.populate('groupID');
    //排序方式 好友通讯时间倒序排列
    query.sort({ 'lastTime': -1 });
    //查询结果
    query.exec().then(function (e) {
        let result = e.map(function (ver) {
            return {
                id: ver.groupID._id,
                name: ver.groupID.name,
                markname: ver.name,
                imgurl: ver.groupID.imgurl,
                lastTime: ver.lastTime,
                tip: ver.tip,
                type:1
            }
        });
        res.send({ status: 200, result });
    }).catch((err) => {
        res.send({ status: 500 });
    })
}
//按要求获取群消息
exports.getOneGroupMsg = function (gid, res) {
    let query = GroupMsg.findOne({});
    //查询条件
    query.where({ 'groupID': gid });
    //关联的user对象
    query.populate('userID');
    //排序方式 通讯时间倒序排列
    query.sort({ 'time': -1 });
    //查询结果
    query.exec().then(function (ver) {
        let result = {
            message: ver.message,
            time: ver.time,
            types: ver.types,
            name: ver.userID.name
        }
        res.send({ status: 200, result });
    }).catch((err) => {
        res.send({ status: 500 });
    })
}
//群消息状态修改
exports.updateGroupMsg = function (data, res) {
    //修改项条件
    let wherestr = { 'userID': data.uid, 'groupID': data.fid};
    //修改内容
    let updatestr = { 'tip': 0 };
    Message.updateOne(wherestr, updatestr, (err, result) => {
        if (err) {
            res.send({ status: 500 });
        } else {
            res.send({ status: 200 ,result});
        }
    })
}
//按要求获取一条一对一消息
exports.getOneMsg = function (data, res) {
    let query = Message.findOne({});
    //查询条件
    query.where({ $or: [{ 'userID': data.uid, 'friendID': data.fid }, { 'userID': data.fid, 'friendID': data.uid }] });
    //排序方式 最近通讯时间倒序排列
    query.sort({ 'time': -1 });
    //查询结果
    query.exec().then(function (ver) {
        let result = {
            message: ver.message,
            time: ver.time,
            types: ver.types
        }
        res.send({ status: 200, result })
    }).catch(function (err) {
        res.send({ status: 500 });
    })
}

//添加群成员
exports.insertGroupUser=function(data){
    var groupuser=new GroupUser(data);
    groupuser.save(function(err,res){
        if(err){
            res.send({state:500}) 
        }else{
            console.log('添加成功');
        }
    })

}
function insertGroupUser(data){
    var groupuser=new GroupUser(data);
    groupuser.save(function(err,res){
        if(err){
            res.send({state:500}) 
        }else{
            console.log('添加成功');
        }
    })

}
//新建群
exports.createGroup=function(data,res){
        let groupData={
            userID:data.uid,
            name:data.name,
            imgurl:data.imgurl,
            time:new Date(),
        }
        var group=new Group(groupData)
        group.save(function(err,result){
            if(err){
                res.send({status:500})
            }else{
                Group.find({'userID':data.uid,'name':data.name},{'_id':1},(err,rest)=>{
                    if(err){
                        res.send({status:500})
                    }else{
                        rest.map(function(gid){
                            let udata={
                                groupID:gid._id,
                                userID:data.uid,
                                time:new Date(),
                                lastTime:new Date(),
                            }
                            insertGroupUser(udata)
                            for(let i=0;i<data.user.length;i++){
                                let fdata={
                                        groupID:gid._id,
                                        userID:data.user[i],
                                        time:new Date(),
                                        lastTime:new Date(),
                                    }
                                    insertGroupUser(fdata)
                            }
                        })
                        res.send({status:200,rest})
                    }
                })
            }
        })
    }


exports.msg=function(data,res){
    //console.log(data);
    let wherestr = { 'value': 0 };
    Message.countDocuments(wherestr, (err, rest) => {
        if (err) {
            res.send({ status: 500 })
        } else {
            //console.log('rest:'+rest);
            //res.send({ status: 200, result });
            var skipNum=data.nowPage*data.pageSize;
            let query=Message.find({});
            query.where({$or:[{'userID':data.uid,'friendID':data.fid,},{'userID':data.fid,'friendID':data.uid,}] });
            query.sort({'time':-1})
            query.populate('userID');
            query.sort({'lastTime':-1});
            query.skip(skipNum)
            query.limit(data.pageSize)
            //query.limit(skipNum)
            query.exec().then(function(e){
                let result=e.map(function(ver){
                    return{
                        id:ver._id,
                        message:ver.message,
                        types:ver.types,
                        time:ver.time,
                        fromId:ver.userID._id,
                        imgurl:ver.userID.imgurl,
                        value:rest
                    }
                })
                //console.log(result);
                res.send({state:200,result})
            }).catch(function(err){
                res.send({state:500})
            })
        }
    })
    
}