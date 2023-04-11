var dbserver = require('../dao/dbserver');
var email =require('../dao/emailserver')
//用户注册
exports.signUp = (req, res) =>{
    let name = req.body.name;
    let mail = req.body.mail;
    let pwd = req.body.pwd;
    // res.send(req.body);
    email.emailSignUp(mail)
    dbserver.buildUser(name, mail, pwd, res);
}

//用户使用邮箱注册 判断邮箱是否已经被占用
exports.judgeValue = (req, res)=>{
    let data = req.body.data;
    let type = req.body.type;
    // res.send(req.body);
    dbserver.countUserValue(data,type,res);
}

