import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js"
import { asyncHandler } from "../utils/AsyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFile } from "../utils/deleteFile.js";


export const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType="asc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const aggregatePipeline=[];
    if(query && query.trim()!==""){
        // remember to create a searchIndex with videoIndex name and also add autocomplete field in videoIndex (title,description)
        aggregatePipeline.push(
                
                {
                  $search: {
                    index: "videoIndex",
                    compound: {
                      should: [
                                        {
                                        autocomplete: {
                                            query: query.trim(),
                                            path: "title",
                                            fuzzy:{
                                                maxEdits:2
                                            }
                                        },
                                        },
                                        {
                                        autocomplete: {
                                            query: query.trim(),
                                            path: "description",
                                            fuzzy:{
                                                maxEdits:2
                                            }
                                        },
                                        },
                                ],
                             },
                    },
                 }
              
        );
    }
    if(userId && isValidObjectId(userId)){
        aggregatePipeline.push({
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        });
    }
    aggregatePipeline.push({
        $match:{
            isPublished:true
        }
    })
    if(sortBy && sortBy.trim()!==''){
        aggregatePipeline.push({
            $sort:{
                [sortBy]:(sortType==='asc')?1:-1,
            }
        })
    }


    page=Number(page);
    limit=Number(limit);
    const aggregateQuery=Video.aggregate(aggregatePipeline);

    let options={
        page,
        limit,
        customLabels:{
            totalDocs:"totalVideos",
            docs:"videos"
        }
    };

    const videos=await Video.aggregatePaginate(aggregateQuery,options);

    if(!videos?.videos?.length){
        return res.status(200).json(new ApiResponse(200,{},"no video found"));
    }

    return res.status(200).json(new ApiResponse(200,videos,"videos fetched successfully"));
    

});


export const getVideoById = asyncHandler(async (req,res)=>{
    const {videoId}= req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }
    const video=await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"no video found");
    }
    return res.status(200).json(new ApiResponse(200,video,"video fetched successfully"));
});

export const publisAVideo=asyncHandler(async(req,res)=>{
    const {title,description}=req.body;


    if(!title || title.trim()===''){// first  i have deleted the uploaded files from server
        if(req.files?.videoFile){
            deleteFile(req.files?.videoFile[0]?.path);
        }
        if(req.files?.thumbnail){
            deleteFile(req.files?.thumbnail[0]?.path);
        }
        throw new ApiError(400,"title is required");
    }
    if(!description || description.trim()===''){//first  i have deleted the uploaded files from server
        if(req.files?.videoFile){
            deleteFile(req.files?.videoFile[0]?.path);
        }
        if(req.files?.thumbnail){
            deleteFile(req.files?.thumbnail[0]?.path);
        }
        throw new ApiError(400,"decription is required");
    }



    let localvideoFilePath=null;
    if(req.files?.videoFile){
        localvideoFilePath=req.files.videoFile[0].path;
    }else{
        if(req.files?.thumbnail){
            deleteFile(req.files.thumbnail[0].path);
        }
        throw new ApiError(400,"video file is required");
    }



    let localthumbnailPath=null;
    if(req.files?.thumbnail){
        localthumbnailPath=req.files.thumbnail[0].path;
    }else{
        if(localvideoFilePath){
            deleteFile(localvideoFilePath);
        }
        throw new ApiError(400,"thumbnail file is required");
    }



    const videoFile=await uploadOnCloudinary(localvideoFilePath,"MyTubeVideoFiles");
    if(!videoFile){
        throw new ApiError(500,"something went wrong during video file upload");
    }

    const thumbnail=await uploadOnCloudinary(localthumbnailPath,"MyTubeThumbnails");
    if(!thumbnail){
        throw new ApiError(500,"something went wrong during thumbnail upload");
    }

    const video= await Video.create({
        title,
        description,
        videoFile:videoFile.secure_url,
        thumbnail:thumbnail.secure_url,
        duration:videoFile.duration,
        owner:req.user._id
    });

    return res.status(201).json(new ApiResponse(201,video,"video published successfully"));


});

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description}=req.body;// remember to send data in form

    if(!videoId || !isValidObjectId(videoId)){
        if(req.file?.path){
            deleteFile(req.file.path);
        }
        throw new ApiError(400,"invalid videoId");
    }
    if(!title || title.trim()===''){
        if(req.file?.path){
        deleteFile(req.file.path);
        }
        throw new ApiError(400,"title is required");
    }
    if(!description || description.trim()===''){
        if(req.file?.path){
        deleteFile(req.file.path);
        }
        throw new ApiError(400,"description is required");
    }

    let localthumbnailPath=null;
    if(req.file?.path){
        localthumbnailPath=req.file.path;
    }else{
        throw new ApiError(400,"thumbnail is required");
    }

    let video=await Video.exists({_id:videoId});
    if(!video){
        if(localthumbnailPath){
            deleteFile(localthumbnailPath);
        }
        throw new ApiError(404,"video not found");
    }

    const thumbnail=await uploadOnCloudinary(localthumbnailPath);
    if(!thumbnail){
        throw new ApiError(500,"something went wrong during thumbnail updation");
    }
     video=await Video.findByIdAndUpdate(videoId,
                                                 {
                                                   $set:{
                                                    title,
                                                    description,
                                                    thumbnail:thumbnail.secure_url
                                                   } 
                                                },{new:true});
        
    return res.status(200).json(new ApiResponse(200,video,"video updated successfully"));
        

});


export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }
    const video=await Video.findByIdAndDelete(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
        
    }
    await destroyOnCloudinary(video.videoFile,"MyTubeVideoFiles");
    await destroyOnCloudinary(video.thumbnail,"MyTubeThumbnails")
    return res.status(200).json(new ApiResponse(200,null,"video deleted successfully"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"invalid videoId");
    }
   
    let video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }
    video.isPublished=!video.isPublished;
    await video.save();
    return res.status(200).json(new ApiResponse(200,video,"video property isPublished toggled successfully"));
})