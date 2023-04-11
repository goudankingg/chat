//项目中配置token
//引入jsonwebtoken
const jwt = require('jsonwebtoken');

// function generateToken(){

// }

// jwt.sign("规则", "加密名字", "过期时间", "箭头函数")
// jwt.sign(payload, secretOrPrivateKey, [options, callback])

const secret = "superchat";
//生成token
exports.generateToken = function(e){
    let payload = {id:e, time:new Date()};
    let token = jwt.sign(payload, secret, {expiresIn: 60*60*24*120});
    return token;
}
//验证token
exports.verifyToken = function(token){
    let payload = '';
    jwt.verify(token, secret, (err, result)=>{
        //如果token验证失败就返回0，成功就返回1
        if(err){
            payload = 0;
        }else{
            payload = 1;
        }
    });
    return payload;
}