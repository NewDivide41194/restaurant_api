const express = require("express");
const router = express.Router();
const multer = require("multer");
const response=require('../model/response')

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "uploads");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpg");
  }
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 100000 },
  
}).single("profileImage");


router.post("/", function(req, res) {
  upload(req, res, function (err) {
    if (err) {
        console.log(err, 'multer error')
        res.json(response({ success: false, message: err }))
    }
    else {
        const foodName = req.body.foodName
        const price = req.body.price
        const size = req.body.size
        const menuId = req.body.menuId
        const image = req.file.path
        console.log(req.file.path);
        res.json(response({success:true,message:"image uploaded"}))
        
        // adminService.addFood(foodName, image, price, size, menuId).then(data => {
        //     res.json(response({ success: true, message: "success" }))
        // }).catch(err => {
        //     res.json(response({ success: false, message: err }))
        // })
    }
})
});


module.exports = router;
