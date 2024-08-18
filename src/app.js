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
import userRouter from "./routes/user.routes.js";
import { ApiError } from './utils/ApiError.js';
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js";
import healthCheckRouter from "./routes/healthCheck.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import videoRouter from "./routes/video.routes.js";


app.use("/api/v1/user",userRouter);
app.use("/api/v1/comments",commentRouter);
app.use('/api/v1/dashboard',dashboardRouter);
app.use("/api/v1/healthCheck",healthCheckRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/playlist",playlistRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/videos",videoRouter);

//----------------random page------------------
app.use('*',(req,res,next)=>{
    let error=new ApiError(404,`${req.method},${req.originalUrl} page Not Found`);
    next(error);
})
//------------error middleware--------------
app.use((err,req,res,next)=>{
    // console.log("error middleware");
    // console.log(err);
    const {statusCode,message="something went wrong"}=err;
    return res.status(statusCode).json({statusCode,message,errors:err?.errors,data:err?.data,stack:err?.stack});
   
})

export {app}