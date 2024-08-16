import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";



export const getVideoComments=asyncHandler(async(req,res)=>{
        const {videoId}=req.params;
        let {page=1 ,limit=10}=req.query;
        if(!videoId|| !mongoose.isValidObjectId(videoId)  ){
            throw new ApiError(400,"please provide  correct videoId");
        }
        const video=await Video.findById(videoId);
        if(!video){
            throw new ApiError(400,"video corresponding to videoId doesn't exists")
        }

        page=Number(page);
        limit=Number(limit);
        const aggregateQuery=Comment.aggregate([
                {
                    $match:{
                        video:new mongoose.Types.ObjectId(videoId)
                    }
                },
                {
                    $project:{
                        content:1
                    }
                }
        ]);


        let options={
            page,
            limit,
            customLabels:{
                toctalDocs:"totalComments",
                docs:"comments"
            }
        }

        const comments=await Comment.aggregatePaginate(aggregateQuery,options);

        if(!comments?.comments?.length){
            return res.status(200).json(new ApiResponse(200,{},"this video does not contain comments"));
        }

        return res
        .status(200)
        .json(new ApiResponse(200,comments,"comments fetched successfully"));


});


export const addComment=asyncHandler(async(req,res)=>{
        const {content}=req.body;
        const {videoId}=req.params;
        if(!videoId || !mongoose.isValidObjectId(videoId)){
            throw new ApiError(400,"please provide correct videoId");
        }
        const video=await Video.findById(videoId);
        if(!video){
            throw new ApiError(400,"video corresponding to videoId doesn't exists");
        }
        if(!content?.trim()){
            throw new ApiError(400,"please input some comment");
        }

        const comment=await Comment.create({
            content,
            video:videoId,
            owner:req.user._id
        });

        if(!comment){
            throw new ApiError(500,"something went wrong during addition of comment");
        }

        return res
                .status(200)
                .json(new ApiResponse(200,
                    {
                    "comment":comment.content
                     },
                "comment added successfully"));
});

export const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    let comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(400,"please provide correct commentId");
    }
    if(!req.user._id.equals(comment.owner)){
        throw new ApiError(401,"you are not authorized to update this comment");
    }
    const {content}=req.body;
    if(!content?.trim()){
        throw new ApiError(400,"please provide content ");
    }
    comment=await Comment.findByIdAndUpdate({_id:commentId},{
        $set:{
            content
        }
    },{new:true});

    return res.status(200).json( new ApiResponse(200,comment,"comment updated successfully"));

});

export const destroyComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw  new ApiError(400,"please provide correct commentId");
    }
    if(!req.user._id.equals(comment.owner)){
        throw new ApiError(401,"you are not authorized to delete this comment");
    }
     await Comment.findByIdAndDelete(commentId);
    return res.status(200).json(new ApiResponse(200,comment,"comment destroyed successfully"));
})