
import dotenv from 'dotenv';
dotenv.config({
    path:'/.env'
});// change dev script
import { connectDB } from './db/index.js';







connectDB();
















// const mongoose=require('mongoose');
// const express=require('express');
// const DB_NAME=require('./constant.js');
// const app=express();

/* bad practice as this is in my index.js
;(async()=>{
    try{
       
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error",(err)=>{
            console.log("app.on has throwed",err);
            throw err;
        });
        app.listen(process.env.PORT,()=>{
            console.log("server is listening on ",process.env.PORT);
        })
    }catch(error){
        console.error("db connection failed",error);
        process.exit(1);
    }
})();
*/