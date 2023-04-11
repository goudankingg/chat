// 引入数据库操作模块
const dbserver = require('../dao/dbserver');
const jwt = require('../dao/jwt')

exports.signIn = function (req, res) {
    console.log(req.body);
    let data = req.body.data;
    let pwd = req.body.pwd;
    // res.send(req.body)
    dbserver.userMatch(data, pwd, res);
}

exports.tokenTest = function (req, res) {
    let token = req.body.token;
    let decodeToken = jwt.verifyToken(token);
    res.send(decodeToken);//返回解析出来的 id 和 time
}