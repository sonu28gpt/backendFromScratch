import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";




export const verifyJWT=asyncHandler(async(req,_,next)=>{
    //first take token from req.cookie or header
    //decodeInfo from token using jwt.verify
    //fetch user from db
    //set user in req
    //call next
    const token=req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","");
    if(!token){
        throw new ApiError(401,"unauthorized access");
    }
    const decodedInfo=await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(!decodedInfo){
        throw new ApiError(401,"invalid access token");
    }
    const user=await User.findById(decodedInfo._id).select(" -password -refreshToken ");
    if(!user){
        throw new ApiError(404,"user does not exist");
    }
    req.user=user;
    next();

})