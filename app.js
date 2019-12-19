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
const multer = require('multer')


const privateKey = fs.readFileSync("./security/private.key");
const response = require("./model/response");

const port = 3001;

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
      callback(null, './uploads');
  },
  filename: function (req, file, callback) {
      callback(null, Date.now() + file.originalname);
  }
});

const upload = multer({
  storage: storage
}).single('employeeImage')


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
    "select user.userId,role.roleId,role.roleName,role.active,role.remark,role.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_role as role ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY role.roleName";
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
 

const checkDuplicate=`Select Count(*) as DR from tbl_role where roleName=trim('${InsertRoleName}')`
  const insertRole =
  `INSERT INTO tbl_role (roleName, active, remark,createBy, createdDate) VALUES (trim("${InsertRoleName}"), ${InsertActive?1:0}, trim("${InsertRemark}"), 1, '${InsertDate}')`
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
  `UPDATE tbl_role SET roleName = trim('${UpdateRoleName}'),remark=trim("${UpdateRemark}"),createBy=1,active=${UpdateActive===true?1:0} WHERE roleId=${UpdateId}`
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

app.get("/api/user/department", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
    console.log("connected")
  );
  const selectDepartment =
  "select user.userId,department.departmentId,department.department,department.active,department.remark,department.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_department as department ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY department.department";
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(selectDepartment, (err, result, fields) => {
      if (err) throw err;

      const data = result
      res.json(response({ success: true, payload: data }));
    });
  });  
});

app.post("/api/user/department/addDepartment", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
    console.log("connected")
  );
  const InsertDepartment=req.body.department
  const InsertActive=req.body.active
  const InsertRemark=req.body.remark
  const InsertDate=req.body.createdDate
  console.log(req.body);
 

const checkDuplicate=`Select Count(*) as DR from tbl_department where department=trim('${InsertDepartment}')`
  const insertDepartment =
  `INSERT INTO tbl_department( department, active, remark, createBy, createdDate) VALUES (trim('${InsertDepartment}'), ${InsertActive?1:0}, trim("${InsertRemark}"), 1, '${InsertDate}')`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))
      return
      }
      else{
        dbcon.query(insertDepartment, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});

app.put("/api/user/department/updateDepartment", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
  );
  const UpdateDepartment=req.body.department
  const UpdateRemark=req.body.remark
  const UpdateActive=req.body.active
  const UpdateId=req.body.departmentId

  console.log(req.body);
  const checkDuplicate=`Select Count(*) as DR from tbl_department where department=trim('${UpdateDepartment}') and departmentId<>'${UpdateId}'`

  const updateDepartment =
  `UPDATE tbl_department SET department = trim('${UpdateDepartment}'),remark=trim("${UpdateRemark}"),createBy=1,active=${UpdateActive===true?1:0} WHERE departmentId=${UpdateId}`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))}
      else{
        dbcon.query(updateDepartment, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});

app.get("/api/user/designation", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
    console.log("connected")
  );
  const selectDesignation =
  "select user.userId,designation.designationId,designation.designation,designation.active,designation.remark,designation.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_designation as designation ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY designation.designation";
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(selectDesignation, (err, result, fields) => {
      if (err) throw err;

      const data = result
      res.json(response({ success: true, payload: data }));
    });
  });  
});

app.post("/api/user/designation/addDesignation", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
    console.log("connected")
  );
  const InsertDesignation=req.body.designation
  const InsertActive=req.body.active
  const InsertRemark=req.body.remark
  const InsertDate=req.body.createdDate
  console.log(req.body);
 

const checkDuplicate=`Select Count(*) as DR from tbl_designation where designation=trim('${InsertDesignation}')`
  const insertDesignation =
  `INSERT INTO tbl_designation (designation, active, remark, createBy, createdDate) VALUES (trim('${InsertDesignation}'), ${InsertActive?1:0}, trim("${InsertRemark}"), 1, '${InsertDate}');`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))
      return
      }
      else{
        dbcon.query(insertDesignation, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});

app.put("/api/user/designation/updateDesignation", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
  );
  const UpdateDesignation=req.body.designation
  const UpdateRemark=req.body.remark
  const UpdateActive=req.body.active
  const UpdateId=req.body.designationId

  console.log(req.body);
  const checkDuplicate=`Select Count(*) as DR from tbl_designation where designation=trim('${UpdateDesignation}') and designationId<>'${UpdateId}'`

  const updateDesignation =
  `UPDATE tbl_designation SET designation = trim('${UpdateDesignation}'),remark=trim("${UpdateRemark}"),createBy=1,active=${UpdateActive===true?1:0} WHERE designationId='${UpdateId}'`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))}
      else{
        dbcon.query(updateDesignation, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });

});

app.get("/api/user/employee", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant",
      debug:false,
      multipleStatements:true
    },
    console.log("connected")
  );
  const selectEmployee =
  "select user.userId,department.departmentId,designation.designationId,employee.employeeId,employee.employeeImage,employee.employeeName,employee.fatherName,employee.dateOfBirth,employee.nrcNo,employee.joinDate,employee.education,employee.gender,employee.maritalStatus,employee.address,employee.createdBy,employee.createdDate,employee.active,department.department,designation.designation,user.userName as createdBy from tbl_employee as employee INNER JOIN tbl_department as department ON employee.departmentId=department.departmentId INNER JOIN tbl_designation as designation on employee.designationId=designation.designationId INNER JOIN tbl_user as user on employee.createdBy=user.userId;Select * from tbl_department;Select * from tbl_designation"
   
    dbcon.query(selectEmployee, (err, result, fields) => {
      if (err) throw err;

      const data = result[0]
      const DepData=result[1]
      const DesData=result[2]
      const CompoundData=[data,DepData,DesData]
      
      res.json(response({ success: true, payload: CompoundData }));
  });  
});

app.post("/api/user/employee/addEmployee", (req, res) => {
  console.log("..................................llllllllll......................")
  upload(req,res,function(err){
    console.log("err ->",err)
    console.log("Request  ====>",req);
    console.log("Request file ====>",req.file);
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant",
    },
    console.log("connected")
  );
  const InsertEmployeeName=req.body.employeeName
  const InsertEmployeeImage=req.file.filename
  const InsertFatherName=req.body.fatherName
  const InsertDateOfBirth=req.body.dateOfBirth
  const InsertNRC=req.body.nrcNo
  const InsertJoinDate=req.body.joinDate
  const InsertDepartmentId=req.body.departmentId
  const InsertDesignationId=req.body.designationId
  const InsertEducation=req.body.education
  const InsertGender=req.body.gender
  const InsertMaritalStatus=req.body.maritalStatus
  const InsertAddrerss=req.body.address
  const InsertCreatedBy=req.body.createdBy
  const InsertCreatedDate=req.body.createdDate
  const InsertActive=req.body.active

  console.log(req.body);
 
const checkDuplicate=`Select Count(*) as DR from tbl_employee where employeeName=trim('${InsertEmployeeName}')`
  const insertEmployee =
  `INSERT INTO restaurant.tbl_employee (employeeImage, employeeName, fatherName, dateOfBirth, nrcNo, joinDate, departmentId, designationId, education, gender, maritalStatus, address, createdBy, createdDate, active) VALUES ('${InsertEmployeeImage}', '${InsertEmployeeName}', '${InsertFatherName}', '${InsertDateOfBirth}', '${InsertNRC}', '${InsertJoinDate}', ${InsertDepartmentId}, ${InsertDesignationId},'${InsertEducation}', '${InsertGender}', '${InsertMaritalStatus}', '${InsertAddrerss}', '${InsertCreatedBy}', '${InsertCreatedDate}', ${InsertActive})`
  dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Employee Name Already Exist" }))
      return
      }
      else{
        dbcon.query(insertEmployee, (err, result, fields) => {
          if (err) throw err;
          
          const data = result
          
          res.json(response({ success: true, payload: data }));
        });
      }
    })
    
  });
  })


});

app.put("/api/user/employee/updateEmployee", (req, res) => {
  
  const dbcon = mysql.createConnection(
    {
      host: "localhost",
      user: "root",
      password: "root",
      database: "restaurant"
    },
  );
  const UpdateEmployeeId=req.body.employeeId
  const UpdateEmployeeName=req.body.employeeName
  const UpdateEmployeeImage=req.body.employeeImage
  const UpdateFatherName=req.body.fatherName
  const UpdateDateOfBirth=req.body.dateOfBirth
  const UpdateNRC=req.body.NRC
  const UpdateJoinDate=req.body.joinDate
  const UpdateDepartmentId=req.body.departmentId
  const UpdateDesignationId=req.body.designationId
  const UpdateEducation=req.body.education
  const UpdateGender=req.body.gender
  const UpdateMaritalStatus=req.body.maritalStatus
  const UpdateAddrerss=req.body.addrerss
  const UpdateCreatedBy=req.body.createdBy
  const UpdateCreatedDate=req.body.createdDate
  const UpdateActive=req.body.active

  console.log(req.body);
  const checkDuplicate=`Select Count(*) as DR from tbl_employee where employeeName=trim('${UpdateEmployeeName}') and employeeId<>'${UpdateEmployeeId}'`

  const updateEmployee =
`UPDATE restaurant.tbl_employee SET employeeImage = '${UpdateEmployeeImage}', employeeName = '${UpdateEmployeeName}', fatherName = '${UpdateFatherName}', dateOfBirth = '${UpdateDateOfBirth}', nrcNo = '${UpdateNRC}', joinDate = '${UpdateJoinDate}', departmentId = ${UpdateDepartmentId}, designationId = ${UpdateDesignationId}, education = '${UpdateEducation}', gender = '${UpdateGender}', maritalStatus = '${UpdateMaritalStatus}', address = '${UpdateAddrerss}', createdBy = '${UpdateCreatedBy}', createdDate = '${UpdateCreatedDate}', active = ${UpdateActive} WHERE employeeId=${UpdateEmployeeId}`
    dbcon.connect(err => {
    if (err) throw err;
    dbcon.query(checkDuplicate,(err,result)=>{
      const DuplicateRows=result[0].DR
      if(DuplicateRows>0)
      { res.json(response({ success: false, payload: null,message:"Role Name Already Exist" }))}
      else{
        dbcon.query(updateEmployee, (err, result, fields) => {
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
