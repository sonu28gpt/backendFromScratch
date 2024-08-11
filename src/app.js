import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app=express();


app.use(cors(
    {
        origin:process.env.CORS_ORIGIN,
        credentials:true
    }
))
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static('public'));



//importing routes
import userRoute from "./routes/user.routes.js";
import { ApiError } from './utils/ApiError.js';








app.use("/api/v1/user",userRoute);






//----------------random page------------------
app.use('*',(req,res,next)=>{
    let error=new ApiError(404,"page Not Found");
    next(error);
})
//------------error middleware--------------
app.use((err,req,res,next)=>{
    // console.log("error middleware");
    // console.log(err);
    const {statusCode,message="something went wrong"}=err;
    res.status(statusCode).json({statusCode,message,errors:err?.errors,data:err?.data,stack:err?.stack});
   
})

export {app}