const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const bcrypt = require("bcryptjs");
const { produceToken, verifyToken } = require("./security/token");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const privateKey = fs.readFileSync("./security/private.key");
const response = require("./model/response");

const port = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.post("/api/user/login", (req, res) => {
  const dbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "restaurant"
  });
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
});

app.get("/api/user/nav", verifyToken, (req, res) => {
  jwt.verify(req.token, privateKey, err => {
    if (err) {
      res.sendStatus(403);
    } else {

      const dbcon = mysql.createConnection(
        {
          host: "localhost",
          user: "root",
          password: "root",
          database: "restaurant"
        },
        console.log("connected")
      );
      const selectNav =
        "SELECT tbl_user.userId,tbl_user.userName,tbl_employee.employeeImage,tbl_designation.designation FROM tbl_user JOIN tbl_employee tbl_employee ON tbl_user.employeeId=tbl_employee.employeeId JOIN tbl_designation ON tbl_employee.designationId=tbl_designation.designationId";
      dbcon.connect(err => {
        if (err) throw err;
        dbcon.query(selectNav, (err, result, fields) => {
          if (err) throw err;
          const data = [];
          data.push(result);
          res.json(response({ success: true, payload: data }));
        });
      });
    }
  });
});

app.get("/api/user/role", (req, res) => {
  
    const dbcon = mysql.createConnection(
      {
        host: "localhost",
        user: "root",
        password: "root",
        database: "restaurant"
      },
      console.log("connected")
    );
    const selectRole =
    "select user.userId,role.roleId,role.roleName,role.active,role.remark,role.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_role as role ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId";
    dbcon.connect(err => {
      if (err) throw err;
      dbcon.query(selectRole, (err, result, fields) => {
        if (err) throw err;

        const data = result
        res.json(response({ success: true, payload: data }));
      });
    });  
});


app.post("/api/user/role/addRole", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
    console.log("connected")
  );
  const InsertRoleName=req.body.roleName
  const InsertRemark=req.body.remark
  const InsertActive=req.body.active
  const InsertDate=req.body.createdDate
  console.log(req.body);
  
// const checkDuplicate=`Select * from tbl_role where roleName='${"Hein"}' and roleId<>0`
//   const selectRole =
//   `INSERT INTO tbl_role (roleName, active, remark,createBy, createdDate) VALUES ('${InsertRoleName}', ${InsertActive==="true"?1:0}, '${InsertRemark}', 1, '${InsertDate}')`
//   dbcon.connect(err => {
//     if (err) throw err;
//     dbcon.query(selectRole, (err, result, fields) => {
//       if (err) throw err;
      
//       const data = result
//       res.json(response({ success: true, payload: data }));
//     });
//   });

// });
const checkDuplicate=`Select Count(*) as DR from tbl_role where roleName=trim('${InsertRoleName}')`
  const insertRole =
  `INSERT INTO tbl_role (roleName, active, remark,createBy, createdDate) VALUES (trim('${InsertRoleName}'), ${InsertActive?1:0}, '${InsertRemark}', 1, '${InsertDate}')`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))
      return
      }
      else{
        dbcon.query(insertRole, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});


app.put("/api/user/role/updateRole", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
  );
  const UpdateRoleName=req.body.roleName
  const UpdateRemark=req.body.remark
  const UpdateActive=req.body.active
  const UpdateId=req.body.roleId

  console.log(req.body);
  const checkDuplicate=`Select Count(*) as DR from tbl_role where roleName=trim('${UpdateRoleName}') and roleId<>'${UpdateId}'`

  const updateRole =
  `UPDATE tbl_role SET roleName = trim('${UpdateRoleName}'),remark='${UpdateRemark}',createBy=1,active=${UpdateActive===true?1:0} WHERE roleId=${UpdateId}`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))
      
      }
      else{
        dbcon.query(updateRole, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});

// app.use(express.urlencoded({extended:false}))

app.listen(port, () => console.log(`server is running on port ${port}`));
