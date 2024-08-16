import mongoose from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";


export const getChannelStats=asyncHandler(async(req,res)=>{
        const totalSubscribers=await Subscription.countDocuments({channel:req.user._id});
        const totalVideos=await Video.countDocuments({owner:req.user._id});
        const totalLikesAndViews=await User.aggregate([
                {
                    $match:{
                        _id:new mongoose.Types.ObjectId(req.user._id)
                    }
                },
                {
                    $lookup:{
                        from:"videos",
                        localField:"_id",
                        foreignField:"owner",
                        as:"totalVideos"
                    }
                },
                {
                    $addFields:{
                        totalViews:{
                            $sum:"$totalVideos.views"
                        }
                    }
                },
                {
                    $lookup:{
                        from:"likes",
                        localField:"totalVideos._id",
                        foreignField:"video",
                        as:"likesDetail"
                    }
                },
                {
                    $addFields:{
                        totalLikes:{
                            $size:"$likesDetail"
                        }
                    }
                },
                {
                    $project:{
                        totalLikes:1,
                        totalViews:1
                    }
                }
        ]);
        return res.status(200).json(new ApiResponse(200,{
            totalSubscribers,
            totalVideos,
            totalLikes:(totalLikesAndViews&&totalLikesAndViews.length>0)?(totalLikesAndViews[0].totalLikes):0 ,
            totalViews:(totalLikesAndViews&&totalLikesAndViews.length>0)?(totalLikesAndViews[0].totalViews):0 ,
            
        },"user stats fetched successfully"));
});


export const getChannelVideos=asyncHandler(async(req,res)=>{
            const videos=await Video.find({owner:req.user._id});
            if(!videos?.length){
                return res.status(200).json(new ApiResponse(200,[],"no videos uploaded on this channel"));
            }
            return res.status(200).json(new ApiResponse(200,videos,"videos fetched successfully"));
});