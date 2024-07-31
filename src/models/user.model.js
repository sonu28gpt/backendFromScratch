import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema=new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true,//need to be know more about this field

    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        index:true,
        trim:true,
        lowercase:true
    },
    avatar:{
        type:String,//cloudinary string
        required:true
    },
    coverImage:{
        type:String,//cloudinary string
        // required:true
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"video"
    }],
    password:{
        type:String,
        required:[true,"password is required"]
    },
    refreshToken:{
        type:String
    }
},{timestamps:true});




userSchema.pre("save",async function(next){//here dont use arrow function since we have to use this keyword
    if(!this.isModified("password"))return  next();

    this.password= await bcrypt.hash(this.password,5);
    next()

});
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAcceesToken=function(){//this token generation is fast ,so can we use async or not used depends
    return jwt.sign({
        _id:this._id,
        userName:this.userName,
        emai:this.email,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY//generally it is greater than access token expiry
    })
}


export const User=mongoose.model("User",userSchema);