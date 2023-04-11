

const dbserver = require('../dao/dbserver');


exports.createGroup = (req, res)=>{
  let data = req.body
  dbserver.createGroup(data, res)
}


