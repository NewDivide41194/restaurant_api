const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const helmet = require("helmet");
const multer = require("multer");
const appRouter = require("./routes");
const privateKey = fs.readFileSync("./security/private.key");

const response = require("./model/response");
const { verifyToken } = require("./security/token");

const port = 3002;
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

function dbcon() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "restaurant",
    multipleStatements: "true"
  });
}

const upload = multer({
  storage: storage
}).single("employeeImage");
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());
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
app.use("/api", appRouter);

app.get("/api/user/nav", verifyToken, (req, res) => {
  jwt.verify(req.token, privateKey, err => {
    if (err) {
      res.sendStatus(403);
    } else {
      const selectNav =
        "SELECT tbl_user.userId,tbl_user.userName,tbl_employee.employeeImage,tbl_designation.designation FROM tbl_user JOIN tbl_employee tbl_employee ON tbl_user.employeeId=tbl_employee.employeeId JOIN tbl_designation ON tbl_employee.designationId=tbl_designation.designationId";

      dbcon().query(selectNav, (err, result, fields) => {
        if (err) {
          res.json(
            response({
              success: false,
              payload: null,
              message: "Database Connection Fail!"
            })
          );
        }
        const data = [];
        data.push(result);
        res.json(response({ success: true, payload: data }));
      });
    }
  });
});

app.get("/api/user/role", (req, res) => {
  const selectRole =
    "select user.userId,role.roleId,role.roleName,role.active,role.remark,role.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_role as role ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY role.roleName";
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(selectRole, (err, result, fields) => {
      if (err) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Database Connection Fail!"
          })
        );
      }

      const data = result;
      res.json(response({ success: true, payload: data }));
    });
  });
});

app.post("/api/user/role/addRole", (req, res) => {
  const InsertRoleName = req.body.roleName;
  const InsertRemark = req.body.remark;
  const InsertActive = req.body.active;
  const InsertDate = req.body.createdDate;
  console.log(req.body);

  const checkDuplicate = `Select Count(*) as DR from tbl_role where roleName=trim('${InsertRoleName}')`;
  const insertRole = `INSERT INTO tbl_role (roleName, active, remark,createBy, createdDate) VALUES (trim("${InsertRoleName}"), ${
    InsertActive ? 1 : 0
  }, trim("${InsertRemark}"), 1, '${InsertDate}')`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
        return;
      } else {
        dbcon().query(insertRole, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.put("/api/user/role/updateRole", (req, res) => {
  const UpdateRoleName = req.body.roleName;
  const UpdateRemark = req.body.remark;
  const UpdateActive = req.body.active;
  const UpdateId = req.body.roleId;

  console.log(req.body);
  const checkDuplicate = `Select Count(*) as DR from tbl_role where roleName=trim('${UpdateRoleName}') and roleId<>'${UpdateId}'`;

  const updateRole = `UPDATE tbl_role SET roleName = trim('${UpdateRoleName}'),remark=trim("${UpdateRemark}"),createBy=1,active=${
    UpdateActive === true ? 1 : 0
  } WHERE roleId=${UpdateId}`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
      } else {
        dbcon().query(updateRole, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.get("/api/user/department", (req, res) => {
  const selectDepartment =
    "select user.userId,department.departmentId,department.department,department.active,department.remark,department.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_department as department ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY department.department";
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(selectDepartment, (err, result, fields) => {
      if (err) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Database Connection Fail!"
          })
        );
      }

      const data = result;
      res.json(response({ success: true, payload: data }));
    });
  });
});

app.post("/api/user/department/addDepartment", (req, res) => {
  const InsertDepartment = req.body.department;
  const InsertActive = req.body.active;
  const InsertRemark = req.body.remark;
  const InsertDate = req.body.createdDate;
  console.log(req.body);

  const checkDuplicate = `Select Count(*) as DR from tbl_department where department=trim('${InsertDepartment}')`;
  const insertDepartment = `INSERT INTO tbl_department( department, active, remark, createBy, createdDate) VALUES (trim('${InsertDepartment}'), ${
    InsertActive ? 1 : 0
  }, trim("${InsertRemark}"), 1, '${InsertDate}')`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
        return;
      } else {
        dbcon().query(insertDepartment, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.put("/api/user/department/updateDepartment", (req, res) => {
  const UpdateDepartment = req.body.department;
  const UpdateRemark = req.body.remark;
  const UpdateActive = req.body.active;
  const UpdateId = req.body.departmentId;

  console.log(req.body);
  const checkDuplicate = `Select Count(*) as DR from tbl_department where department=trim('${UpdateDepartment}') and departmentId<>'${UpdateId}'`;

  const updateDepartment = `UPDATE tbl_department SET department = trim('${UpdateDepartment}'),remark=trim("${UpdateRemark}"),createBy=1,active=${
    UpdateActive === true ? 1 : 0
  } WHERE departmentId=${UpdateId}`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
      } else {
        dbcon().query(updateDepartment, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.get("/api/user/designation", (req, res) => {
  const selectDesignation =
    "select user.userId,designation.designationId,designation.designation,designation.active,designation.remark,designation.createdDate,employee.employeeName from tbl_user as user INNER JOIN  tbl_designation as designation ON user.userID inner Join tbl_employee as employee ON user.employeeId=employee.employeeId ORDER BY designation.designation";
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(selectDesignation, (err, result, fields) => {
      if (err) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Database Connection Fail!"
          })
        );
      }

      const data = result;
      res.json(response({ success: true, payload: data }));
    });
  });
});

app.post("/api/user/designation/addDesignation", (req, res) => {
  const InsertDesignation = req.body.designation;
  const InsertActive = req.body.active;
  const InsertRemark = req.body.remark;
  const InsertDate = req.body.createdDate;
  console.log(req.body);

  const checkDuplicate = `Select Count(*) as DR from tbl_designation where designation=trim('${InsertDesignation}')`;
  const insertDesignation = `INSERT INTO tbl_designation (designation, active, remark, createBy, createdDate) VALUES (trim('${InsertDesignation}'), ${
    InsertActive ? 1 : 0
  }, trim("${InsertRemark}"), 1, '${InsertDate}');`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
        return;
      } else {
        dbcon().query(insertDesignation, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.put("/api/user/designation/updateDesignation", (req, res) => {
  const UpdateDesignation = req.body.designation;
  const UpdateRemark = req.body.remark;
  const UpdateActive = req.body.active;
  const UpdateId = req.body.designationId;

  console.log(req.body);
  const checkDuplicate = `Select Count(*) as DR from tbl_designation where designation=trim('${UpdateDesignation}') and designationId<>'${UpdateId}'`;

  const updateDesignation = `UPDATE tbl_designation SET designation = trim('${UpdateDesignation}'),remark=trim("${UpdateRemark}"),createBy=1,active=${
    UpdateActive === true ? 1 : 0
  } WHERE designationId='${UpdateId}'`;
  dbcon().connect(err => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          error: err,
          message: "Database Connection Fail!"
        })
      );
    }
    dbcon().query(checkDuplicate, (err, result) => {
      const DuplicateRows = result[0].DR;
      if (DuplicateRows > 0) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Role Name Already Exist"
          })
        );
      } else {
        dbcon().query(updateDesignation, (err, result, fields) => {
          if (err) {
            res.json(
              response({
                success: false,
                payload: null,
                message: "Database Connection Fail!"
              })
            );
          }

          const data = result;
          res.json(response({ success: true, payload: data }));
        });
      }
    });
  });
});

app.get("/api/user/employee", (req, res) => {
  const selectEmployee =
    "select user.userId,department.departmentId,designation.designationId,employee.employeeId,employee.employeeImage,employee.employeeName,employee.fatherName,employee.dateOfBirth,employee.nrcNo,employee.joinDate,employee.education,employee.gender,employee.maritalStatus,employee.address,employee.createdBy,employee.createdDate,employee.active,department.department,designation.designation,user.userName as createdBy from tbl_employee as employee INNER JOIN tbl_department as department ON employee.departmentId=department.departmentId INNER JOIN tbl_designation as designation on employee.designationId=designation.designationId INNER JOIN tbl_user as user on employee.createdBy=user.userId;Select departmentId as value,department as label from tbl_department;Select designationId as value,designation as label from tbl_designation";

  dbcon().query(selectEmployee, (err, result, fields) => {
    if (err) {
      res.json(
        response({
          success: false,
          payload: null,
          message: "Database Connection Fail!"
        })
      );
    }

    const data = result[0];
    const DepData = result[1];
    const DesData = result[2];
    const CompoundData = [data, DepData, DesData];

    res.json(response({ success: true, payload: CompoundData }));
  });
});

app.post("/api/user/employee/addEmployee", (req, res) => {
  console.log(
    "..................................llllllllll......................"
  );
  upload(req, res, function(err) {
    console.log("err ->", err);
    // console.log("Request  ====>", req);
    console.log("Request file ====>", req.file);

    const InsertEmployeeName = req.body.employeeName;
    const InsertEmployeeImage = `${
      req.file ? req.file.filename : req.body.employeeImage
    }`;
    const InsertFatherName = req.body.fatherName;
    const InsertDateOfBirth = req.body.dateOfBirth;
    const InsertNRC = req.body.NRC;
    const InsertJoinDate = req.body.joinDate;
    const InsertDepartmentId = req.body.departmentId;
    const InsertDesignationId = req.body.designationId;
    const InsertEducation = req.body.education;
    const InsertGender = req.body.gender;
    const InsertMaritalStatus = req.body.maritalStatus;
    const InsertAddrerss = req.body.address;
    const InsertCreatedBy = req.body.userId;
    const InsertCreatedDate = req.body.createdDate;
    const InsertActive = req.body.active;

    console.log(req.body);

    const checkDuplicate = `Select Count(*) as DR from tbl_employee where employeeName=trim('${InsertEmployeeName}');Select Count(*) as DRNRC from tbl_employee where nrcNo=trim('${InsertNRC}')`;

    const insertEmployee = `INSERT INTO restaurant.tbl_employee (employeeImage, employeeName, fatherName, dateOfBirth, nrcNo, joinDate, departmentId, designationId, education, gender, maritalStatus, address, createdBy, createdDate, active) VALUES ('${InsertEmployeeImage}', '${InsertEmployeeName}', '${InsertFatherName}', '${InsertDateOfBirth}', '${InsertNRC}', '${InsertJoinDate}', ${InsertDepartmentId}, ${InsertDesignationId},'${InsertEducation}', '${InsertGender}', '${InsertMaritalStatus}', '${InsertAddrerss}', '${InsertCreatedBy}', '${InsertCreatedDate}', ${InsertActive})`;
    dbcon().connect(err => {
      if (err) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Database Connection Fail!"
          })
        );
      }
      dbcon().query(checkDuplicate, (err, result) => {
        const DuplicateRows = result[0][0].DR;
        const DuplicateNRCRows = result[1][0].DRNRC;

        if (DuplicateRows > 0) {
          res.json(
            response({
              success: false,
              payload: null,
              message: "Employee Name Already Exist",
              error: "E2601"
            })
          );
          return;
        } else if (DuplicateNRCRows > 0) {
          res.json(
            response({
              success: false,
              payload: null,
              message: "NRC Already Exist",
              error: "N2601"
            })
          );
          return;
        } else {
          dbcon().query(insertEmployee, (err, result, fields) => {
            if (err) {
              res.json(
                response({
                  success: false,
                  payload: null,
                  message: "Database Connection Fail!"
                })
              );
            }

            const data = result;

            res.json(
              response({
                success: true,
                payload: data,
                message: "Employee inserted!"
              })
            );
          });
        }
      });
    });
  });
});

app.put("/api/user/employee/updateEmployee", (req, res) => {
  upload(req, res, function(err) {
    const UpdateEmployeeId = req.body.employeeId;
    const UpdateEmployeeName = req.body.employeeName;
    const UpdateEmployeeImage = `${
      req.file ? req.file.filename : req.body.employeeImage
    }`;
    const UpdateFatherName = req.body.fatherName;
    const UpdateDateOfBirth = req.body.dateOfBirth;
    const UpdateNRC = req.body.NRC;
    const UpdateJoinDate = req.body.joinDate;
    const UpdateDepartmentId = req.body.departmentId;
    const UpdateDesignationId = req.body.designationId;
    const UpdateEducation = req.body.education;
    const UpdateGender = req.body.gender;
    const UpdateMaritalStatus = req.body.maritalStatus;
    const UpdateAddrerss = req.body.address;
    const UpdateCreatedBy = req.body.userId;
    const UpdateCreatedDate = req.body.createdDate;
    const UpdateActive = req.body.active;

    const checkDuplicate = `Select Count(*) as DR from tbl_employee where employeeName=trim('${UpdateEmployeeName}') and employeeId<>'${UpdateEmployeeId}';Select Count(*) as DRNRC from tbl_employee where nrcNo=trim('${UpdateNRC}') and employeeId<>'${UpdateEmployeeId}'`;

    const updateEmployee = `UPDATE restaurant.tbl_employee SET employeeImage = '${UpdateEmployeeImage}', employeeName = '${UpdateEmployeeName}', fatherName = '${UpdateFatherName}', dateOfBirth = '${UpdateDateOfBirth}', nrcNo = '${UpdateNRC}', joinDate = '${UpdateJoinDate}', departmentId = ${UpdateDepartmentId}, designationId = ${UpdateDesignationId}, education = '${UpdateEducation}', gender = '${UpdateGender}', maritalStatus = '${UpdateMaritalStatus}', address = '${UpdateAddrerss}', createdBy = '${UpdateCreatedBy}', createdDate = '${UpdateCreatedDate}', active = ${UpdateActive} WHERE employeeId=${UpdateEmployeeId}`;
    dbcon().connect(err => {
      if (err) {
        res.json(
          response({
            success: false,
            payload: null,
            message: "Database Connection Fail!"
          })
        );
      }
      dbcon().query(checkDuplicate, (err, result) => {       
        const DuplicateRows = result[0][0].DR;
        const DuplicateNRCRows = result[1][0].DRNRC;
        if (DuplicateRows > 0) {
          res.json(
            response({
              success: false,
              payload: null,
              message: "Employee Name Already Exist",
              error: "E2601"
            })
          );
          return;
        } else if (DuplicateNRCRows > 0) {
          res.json(
            response({
              success: false,
              payload: null,
              message: "NRC Already Exist",
              error: "N2601"
            })
          );
          return;
        } else {
          dbcon().query(updateEmployee, (err, result, fields) => {
            if (err) {
              res.json(
                response({
                  success: false,
                  payload: null,
                  message: "Database Connection Fail!"
                })
              );
            }
            const data = result;
            res.json(response({ success: true, payload: data }));
          });
        }
      });
    });
  });
});

app.listen(port, () => console.log(`server is running on port ${port}`));
