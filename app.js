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
      console.log(req.headers);
    } else {
      console.log(req.headers);

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
        "SELECT tbl_user.userName,tbl_employee.employeeImage,tbl_designation.designation FROM tbl_user JOIN tbl_employee tbl_employee ON tbl_user.employeeId=tbl_employee.employeeId JOIN tbl_designation ON tbl_employee.designationId=tbl_designation.designationId";
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
    "SELECT tbl_role.roleName,tbl_role.active,tbl_role.remark,tbl_employee.createdDate,tbl_employee.employeeName FROM tbl_user JOIN tbl_employee ON tbl_user.employeeId=tbl_employee.employeeId JOIN tbl_role ON tbl_user.roleId=tbl_role.roleId";
    dbcon.connect(err => {
      if (err) throw err;
      dbcon.query(selectRole, (err, result, fields) => {
        if (err) throw err;

        const data = result
        res.json(response({ success: true, payload: data }));
      });
    });
  
});

// app.use(express.urlencoded({extended:false}))

app.listen(port, () => console.log(`server is running on port ${port}`));
