import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";



export const toggleSubscription=asyncHandler(async(req,res)=>{
        const {channelId}=req.params;
        if(!channelId || !isValidObjectId(channelId)){
            throw new ApiError(400,"please enter correct channelId");
        }
        const channel=await User.findById(channelId);
        if(!channel){
            throw new ApiError(404,"channel not found");
        }
        const subscription= await Subscription.findOneAndDelete({
            channel:channelId,
            subscriber:req.user._id
        });
        if(!subscription){
            const newSubscription=await Subscription.create({
                subscriber:req.user._id,
                channel:channelId
            });
            return res.status(200).json(new ApiResponse(200,newSubscription,"user subscribed channel successfully"));
        }
        return res.status(200).json(new ApiResponse(200,null,"user unsubscribed channel successfully"));

});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!channelId || !isValidObjectId(channelId) ){
        throw new ApiError(400,"please enter correct channelId");
    }
    const channel=await User.findById(channelId);
    if(!channel){
        throw new ApiError(404,"channel not found");
    }
    // if(!channelId.equals(req.user._id)){//authorization condition
    //     throw new ApiError(401,"you are not authorized to see this");
    // }
    const subscriberList=await Subscription.aggregate([
        {
            $match:{
                channel:mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "subscriberDetail",
              pipeline:[
                                {
                                $project:{
                                    name:1
                                }
                                }
                
                        ]
            }
           
        },
        {
            $addFields:{
                subscriberDetail:{
                    $first:"$subscriberDetail"
                }
            }
        },
        {
            $project:{
                subscriberDetail:1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,subscriberList,"subscribers fetched successfully"));
});


export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(400,"invalid subscriberId");
    }
    const user=await User.findById(subscriberId);
    if(!user){
        throw new ApiError(404,"user not found");
    }
    // if(!subscriberId.equals(req.user._id)){//for authorization 
    //     throw new ApiError( 401,"you are not authorized to see subscribe channels");
    // }
    const subscribeChannelList=await Subscription.aggregate([
        {
            $match:{
                subscriber:mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetail",
                pipeline:[
                    {
                        $project:{
                            name:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channelDetail:{
                    $first:"$channelDetail"
                }
            }
        },
        {
            $project:{
                channelDetail:1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,subscribeChannelList,"subscribed channel fetched successfully"));
});