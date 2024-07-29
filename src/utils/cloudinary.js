import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_SECRET_KEY
})




const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null;
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("file uploaded on cloudinary successfully",response.original_filename);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath);//remove the locally saved file when upload operation failed
        return null;
    }
}


return {uploadOnCloudinary}