const login=(req,res)=>{
    const userName=req.body.userName
    const password=req.body.password

    .then(data=>{
        if (data.length==0){
            res.json(response({ success: false, message: "email and password not match" }))
        }
        res.json(response({ success: true, payload: data }))
    }).catch(err => {
        res.json(response({ success: false, message: err }))
    }) 
}

module.exports=login