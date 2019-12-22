const express =require ('express')
const router=express.Router()
const authRouter=require('./route.authentication')

router.use('/user',authRouter)

module.exports=router
