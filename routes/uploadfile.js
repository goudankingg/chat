const multer = require('multer');
const mkdir = require('../dao/mkdir')
//定义存储引擎
const storage = multer.diskStorage({
    //保存路径
    destination: function (req, file, cb) {
        let url = req.body.url;
        mkdir.mkdirs('../data/'+url, err=>{
            console.log(err);
        })
        cb(null, './data/'+url);
    },
    //保存在destination中的文件名
    filename: function (req, file, cb) {
        let name=req.body.name
        let type = file.originalname.replace(/.*\./, ".");
        cb(null,name + type);
    }
});

const upload = multer({ storage: storage });
module.exports = function (app) {
    //前端文件上传
    app.post('/files/upload', upload.array('file', 10), (req, res, next) => {
        //获取文件信息
        let url=req.body.url
        let name=req.files[0].filename
        let imgurl='/'+url+'/'+name
        
        //返回给前端
        res.send(imgurl);
    })
}

