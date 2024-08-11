import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from 'fs';
import jwt from 'jsonwebtoken';
import exp from "constants";
import mongoose from "mongoose";

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
    let {userName="",email="",fullName="",password=""}=req.body;
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
    userName=userName.toLowerCase();
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

export const refreshAccessToken=asyncHandler(async(req,res)=>{//this controller will help in refreshing the access token without login with the help of refresh token
            const incomingRefreshToken=req.cookie?.refreshToken|| req.body?.refreshToken;
            if(!incomingRefreshToken){
                throw new ApiError(401,"unauthorized access");
            }
            const decodedInfo=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

            const user=await User.findById(decodedInfo?._id);

            if(!user){
                throw new ApiError(404,"invalid refresh token ");
            }
            if(incomingRefreshToken!==user.refreshToken){
                throw new ApiError(401,"refresh token is expired or used");
            }
            const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);//it is updating refresh token in db
            const options={
                httpOnly:true,
                secure:true
            };
            return res.status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(new ApiResponse(200,
                    {
                        accessToken,
                        refreshToken
                    },"access Token refreshed")
                );

});

export const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;
    if(!oldPassword && !newPassword){
        throw new ApiError(400,"please provide old password and new password");
    }
    const user=await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(400,"please login and then do the process");
    }
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400,"please provide correct old password");
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});
    return res.status(200).json(
        new ApiResponse(200,{},"password changes successfully")
    );

});

export const getCurrUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,req.user,"user data fetched successfully")
    );
   
})

export const updateAccountDetail=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!fullName && !email){
        throw new ApiError(400,"please provide details to be updated");
    }
    const user=await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                email,
                fullName
            }
        },
    {new:true}).select(" -password -refreshToken");
    return res.status(200).json(
        new ApiResponse(200,user,"user updated successfully")
    );
  
})

export const updateUserAvatar=asyncHandler(async(req,res)=>{
    if(!req.file.path){
        throw new ApiError(400,"kindly provide avatar");
    }
    const avatarLocalPath=req.file.path;
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500,"something went wrong during uploading avatar")
    }
    const prevAvatarUrl=req.user.avatar;
    const user=await User.findByIdAndUpdate(req.user._id,{
        $set:{
            avatar:avatar.url
        }
    },{
        new:true
    }).select(" -password -refreshToken ");
    await destroyOnCloudinary(prevAvatarUrl);
    return res.status(200).json(
        new ApiResponse(200,user,"avatar updated successfully")
        )
});


export const updateUserCoverImage=asyncHandler(async(req,res)=>{
    if(!req.file.path){
        throw new ApiError(400,"kindly provide coverImage");
    }
    const coverImageLocalPath=req.file.path;
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(500,"something went wrong during uploading coverImage")
    }
    let prevCoverImageUrl=null;
    if(req.user.coverImage){

         prevCoverImageUrl=req.user.coverImage;
    }

    const user=await User.findByIdAndUpdate(req.user._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{
        new:true
    }).select(" -password -refreshToken ");
    if(prevCoverImageUrl!=null){

        await destroyOnCloudinary(prevCoverImageUrl);
    }

    return res.status(200).json(
        new ApiResponse(200,user,"coverImage updated successfully")
        )
});


export const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {userName}=req.params;
    if(!userName?.trim()){
        throw new ApiError(400,"userName is missing");
    }
    const channel =await User.aggregate([
        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                                    $size:"$subscribers"
                                },
                subscribedToCount:{
                                    $size:"$subscribedTo"    
                                },
                isSubscirbed:{
                                $cond:{
                                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                                    then:true,
                                    else:false
                                }
                            }
            }
        },
        {
            $project:{
                userName:1,
                email:1,
                fullName:1,
                avatar:1,
                coverImage:1,
                subscriberCount:1,
                subscribedToCount:1,
                isSubscirbed:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User Channel fetched Successfully")
    )
});

export const getWatchHistory=asyncHandler(async(req,res)=>{
    const watchHistory=await User.aggregate([
        {
            $match:{
                _id:mongoose.Schema.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $addFields:{
                                        ownerId:"$_id"
                                    }
                                },
                                {
                                    $project:{
                                        userName:1,
                                        fullName:1,
                                        avatar:1,
                                        ownerId:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                    
                ]
            }
        }
    ]);

    if(!watchHistory?.length){
        throw new ApiError(400,"watch History not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,watchHistory[0],"watch history fetched successfully"));
})