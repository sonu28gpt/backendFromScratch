import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";



export const createPlaylist=asyncHandler(async(req,res)=>{
        const {name,description}=req.body;
        if(!name || name?.trim()==""){
            throw new ApiError(400,"please provide playlist name");
        }
        const playlist=await Playlist.create({
            name,
            owner:req.user._id,
            description:description
        });
        return res.status(200).json(new ApiResponse(200,playlist,"playlist created successfully"));

});

export const getUserPlaylists=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    if(!userId|| !isValidObjectId(userId)){
        throw new ApiError(400,"please enter userId");
    }
    const user=await User.findById(userId);
    if(!user){
        throw new ApiError(404,"user not found");
    }
    const allPlaylist=await Playlist.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId)
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(200,allPlaylist,"playlist fetched successfully"));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"please enter playlist id correct");
    }
    const playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist does not exists");
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist fetched successfuly"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    if(!playlistId || !videoId || !isValidObjectId(playlistId)|| !isValidObjectId(videoId)){
        throw new ApiError(400,"please enter playlistId and videoId both");
    }
    let playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }
    if(!req.user._id.equals(playlist.owner)){
        throw new ApiError(401,"you are not authorized to add video in other's playlist");
    }

    const isPresent=playlist.videos.includes(videoId);
    if(isPresent){
        throw new ApiError(400,"this video already present in playlist");
    }
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200,playlist,"video added successfully in playlist"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId || !isValidObjectId(playlistId)|| !isValidObjectId(videoId)){
        throw new ApiError(400,"please enter playlistId and videoId both");
    }
    let playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }
    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }
    if(!req.user._id.equals(playlist.owner)){
        throw new ApiError(401,"you are not authorized to remove video in other's playlist");
    }
    const videoIndex=playlist.videos.indexOf(videoId);
    if(videoIndex===-1){
        throw new ApiError(400,"video is not present in this playlist");
    }
    playlist.videos.splice(videoIndex,1);
    await playlist.save({validateBeforeSave:true});

    return res.status(200).json(new ApiResponse(200,playlist,"video removed from playlist successfully"));


});

export const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params;
    // TODO: delete playlist
    if(!playlistId|| !isValidObjectId(playlistId)){
        throw new ApiError(400,"please enter playlist id");
    }
    const playlist=await Playlist.findByIdAndDelete(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");

    }
    return res.status(200).json(new ApiResponse(200,null,"playlist deleted successfully"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId|| !isValidObjectId(playlistId)){
        throw new ApiError(400,"please enter playlist id");
    }
    if(!name|| !description|| name?.trim()===""){
        throw new ApiError(400,"please provide name and description to be updated");
    }
    let playlist=await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401,"you are not authorized to update playlist");
    }

    playlist.name=name;
    playlist.description=description;
    await playlist.save({validateBeforeSave:true});
    return res.status(200).json(new ApiResponse(200,playlist,"playlist updated successfully"));
});