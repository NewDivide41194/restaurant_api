const response=require('../model/response')
const mysql=require('mysql2')

const login=(req,res)=>{
    const dbcon = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        database: "restaurant"
      });
      console.log("hello");
      
      console.log(req);

      const user = { name: req.body.userName, password: req.body.password };
      const selectLogin = `SELECT * FROM tbl_user WHERE password = '${user.password}' AND userName='${user.name}' `;
    
      dbcon.connect(err => {
        if (err) throw err;
    
        const data = [];
        data.push(user);
        const token = produceToken(data[0]);
    
        dbcon.query(selectLogin, (err, result, fields) => {
          if (result.length == 0) {
            res.json(
              response({ success: false, message: "Login Fail!", payload: null })
            );
          } else {
            res.json(response({ success: true, message: token, payload: data }));
    
            console.log(token);
          }
        });
      });
}

module.exports={login}

//Functions Export with {}