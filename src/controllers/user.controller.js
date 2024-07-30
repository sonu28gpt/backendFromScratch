import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



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
        throw new ApiError(400,"all fields are required");
    }
    const existedUser= await User.findOne({
        $or:[{email},{userName}]
    });
    if(existedUser){
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