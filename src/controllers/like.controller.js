import mongoose,{ isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js";



export const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"please send correct videoId");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video does not found with this id");
    }
    const likeDoc=await Like.findOne({video:videoId,likedBy:req.user._id});
    if(likeDoc){
        await Like.findByIdAndDelete(likeDoc._id);
        return res.status(200).json(new ApiResponse(200,{},"like removed successfully"));
    }

    const like=await Like.create({
        video:videoId,
        likedBy:req.user._id
    });
    return res.status(200).json(new ApiResponse(200,like,"like added successfully"));

});

export const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId|| !isValidObjectId(commentId)){
        throw new ApiError(400,"invalid comment id");
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404,"comment  not found");
    }
    const likeComment=await Like.findOne({comment:commentId,likedBy:req.user._id});
    if(likeComment){
        await Like.findByIdAndDelete(likeComment._id);
        return res.status(200).json(new ApiResponse(200,{},"comment unliked successful"));
    }

    const likedComment=await Like.create({comment:commentId,likedBy:req.user._id});
    return res.status(200).json(new ApiResponse(200,likedComment,"comment liked successfully"));


});



export const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    //TODO: toggle like on tweet
    if(!tweetId|| !isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id");
    }
    const tweet=await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweet  not found");
    }
    let likeTweet=await Like.findOne({tweet:tweetId,likedBy:req.user._id});
    if(likeTweet){
        await Like.findByIdAndDelete(likeTweet._id);
        return res.status(200).json(new ApiResponse(200,{},"tweet unliked successfully"));
    }

     likeTweet=await Like.create({tweet:tweetId,likedBy:req.user._id});
    return res.status(200).json(new ApiResponse(200,likeTweet,"tweet liked successfully"));
}
);

export const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy:req.user._id
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetail"
            }
        },
        {
            $addFields:{
                videoDetail:{
                    $first:"$videoDetail"
                }
            }
        },
        {
            $project:{
                videoDetail:1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,likedVideos,"liked videos fetched successfully"));
});