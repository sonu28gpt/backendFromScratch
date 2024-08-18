import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError }from "../utils/ApiError.js";
import { ApiResponse }from "../utils/ApiResponse.js";
import { asyncHandler }from "../utils/AsyncHandler.js"
import { User } from "../models/user.model.js";


export const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body;
    if(!content || content?.trim()===""){
        throw new ApiError(400,"please provide content");
    }
    const tweet=await Tweet.create({
        content,
        owner:req.user._id
    });
    return res.status(201).json(new ApiResponse(200,tweet,"tweet created successfully"));
});

export const getUserTweets=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"please provide correct userId");
    }
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,"user not found");
    }
    const userTweets=await Tweet.find({
        owner:userId
    });
    return res.status(200).json(new ApiResponse(200,userTweets,"user Tweet fetched successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content }=req.body;
    const { tweetId }=req.params;
    if(!content || content?.trim()===""){
        throw new ApiError(400,"please provide content for updation");
    }
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"please provide tweet id")
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweet not found");
    }    
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(403,"you are not authorized to update this tweet");
    }
    tweet.content=content;
    await tweet.save();

    return res.status(200).json(new ApiResponse(200,tweet,"tweet updated successfully"));

});

export const deleteTweet=asyncHandler(async(req,res)=>{
    const { tweetId }=req.params;
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"please provide tweet id")
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweet not found");
    }    
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(403,"you are not authorized to delete this tweet");
    } 
    await tweet.deleteOne();
    return res.status(200).json(new ApiResponse(200,null,"tweet deleted successfully"));
});

