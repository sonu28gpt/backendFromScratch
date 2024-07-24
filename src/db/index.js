import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";



export const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log("connection host:",connectionInstance.connection.host);
    }catch(err){
        console.error("db connection failed",err)
        throw err;
    }
}


