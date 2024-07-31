import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from 'fs';


const generateAccessAndRefreshToken=async(userId)=>{
        const user=await User.findById(userId);
        const accessToken=user.generateAcceesToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
}


export const userRegister=asyncHandler(async(req,res)=>{
    //get user details                              -  done
    //validation of data                            -   done
    //check if user already exist or not            -   done
    //check for image ,check for avatar             -   done
    //upload them to cloudinary                     -   done
    //again check cloudinary image                  -   done
    //create user object-create entry in db         -   done
    //check user created or not and remove password and refresh token if created   -done
    //return user               -done
    const {userName="",email="",fullName="",password=""}=req.body;
    if([userName,email,fullName,password].some((field)=>field?.trim()==="")){
        // console.log(req.body);
        if(req.files?.avatar){
            fs.unlinkSync(req.files?.avatar[0]?.path);
        }
        if(req.files?.coverImage){
            fs.unwatchFile(req.files?.coverImage[0]?.path);
        }
        throw new ApiError(400,"all fields are required");
    }
    const existedUser= await User.findOne({
        $or:[{email},{userName}]
    });
    if(existedUser){
        if(req.files?.avatar){
            fs.unlinkSync(req.files?.avatar[0]?.path);
        }
        if(req.files?.coverImage){
            fs.unwatchFile(req.files?.coverImage[0]?.path);
        }
        throw new ApiError(409,"user already existed");
    }
    
    // console.log(req.files);
    let avatarLocalPath=null;
    if(req.files.avatar)
    avatarLocalPath=req.files?.avatar[0]?.path;
    else{
        throw new ApiError(400,"avatar is mandatory");
    }
    // console.log(avatarLocalPath)

    let coverImageLocalPath=null
    if(req.files.coverImage)
     coverImageLocalPath=req.files?.coverImage[0].path;



    // if(!avatarLocalPath){
    //     throw new ApiError(400,"avatar is required");
    // }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
   
    if(!avatar){
        throw new ApiError(500,"something went wrong from server while uploading file");
    }
    const user=await User.create({
        userName,
        fullName,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url|| "",

    });

    const createdUser=await User.findById(user._id).select(" -password -refresToken ");

    if(!createdUser){
        throw new ApiError(500,"something went wrong from while creating the user");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user created successfully")
    )
})


export const userLogin=asyncHandler(async(req,res)=>{
    //data destructing and check data present or not
    //check with the data user exit or not
    //check password is correct or not
    //assign access and refresh token
    //set cookies and send user data
    const {email="",userName="",password=""}=req.body;
    // console.log(req.body);
    if(!email && !userName){
        throw new ApiError(400,"please provide username or email");
    }
    const user=await User.findOne({
        $or:[{email},{userName}]
    });
    if(!user){
        throw new ApiError(404,"user not found");
    }

    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"please enter correct password");
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

    const loggedInUser=await User.findById(user._id).select(" -password -refreshToken ");
    
    const options={//using options in cookies so that it can only change from server side
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedInUser,
                refreshToken,
                accessToken
            },
            "user Logged IN successfully"
        )
    );

});


export const userLogout=asyncHandler(async(req,res)=>{
    //from auth middleware we get the details of user;
    //unset the value of refreshToken in user db
    //clear cookie from res
    //send response
     // console.log(req.user);
        await User.findByIdAndUpdate(req.user._id,{
            $unset:{
                refreshToken:1//this willl unset the value refreshToken in user instance
            }
        },{
            new:true// now this will return updated instance 
        });
        const options={
            httpOnly:true,
            secure:true
        }
        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"logout successfully")
        );
});