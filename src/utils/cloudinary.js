import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { deleteFile } from './deleteFile.js';


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})



/*
const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath)return null;
        // console.log("inprocess of uploading")
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        });
        // console.log("file uploaded on cloudinary successfully",response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        console.log("error while uploading to cloudinary",localFilePath)
        fs.unlinkSync(localFilePath);//remove the locally saved file when upload operation failed
        return null;
    }
}
*/
//better one to upload large files and also we can sepicify folderName;
const uploadOnCloudinary = (localFilePath, cloudinaryFolderName = '') => {
    return new Promise((resolve, reject) => {
        if (!localFilePath || localFilePath.trim() === '') {
            console.log("localFilePath is required.");
            return resolve(null);
        }
  
        cloudinary.uploader.upload_large(localFilePath, {//this is not returning promise that's why i am returning promise
            folder: cloudinaryFolderName,
            chunk_size: 6000000,  // 6MB chunks
            resource_type: "auto"
        }, (error, result) => {
            deleteFile(localFilePath);
            if (error) {
                console.error("Error during upload:", error);
               
                return resolve(null);
            }
           
            console.log("Upload successful:", result);
            return resolve(result);
        });
    });
  };
  

const getPublicIdAndResourceTypeFromUrl = (url) => {
    const parts = url.split('/');
    const publicIdWithExtension = parts.slice(-1).join('');
    const [publicId, extension] = publicIdWithExtension.split('.');

    // Determine resource type based on the file extension
    let resourceType = 'raw'; // Default to raw if unknown
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'svg', 'webp'].includes(extension)) {
        resourceType = 'image';
    } else if (['mp4', 'avi', 'flv', 'mkv', 'mov', 'wmv','ts'].includes(extension)) {
        resourceType = 'video';
    }

    return { publicId, resourceType };
}


const destroyOnCloudinary = async (url,cloudinaryFolderName="") => {
    try {
        if (!url) {
            console.log("Please provide a URL for performing delete operation");
            return null;
        }

        const { publicId, resourceType }= getPublicIdAndResourceTypeFromUrl(url);

        if (!publicId) {
            console.log('Something went wrong while fetching public ID from URL:', url);
            return null;
        }

        let fullPublicId = "";
        if(cloudinaryFolderName&& cloudinaryFolderName.trim()!==''){
          fullPublicId=`${cloudinaryFolderName}/${publicId}`;
        }else{
          fullPublicId=publicId;
        }

        console.log(`Deleting resource with publicId: ${fullPublicId}`);

        const result = await cloudinary.uploader.destroy(fullPublicId, {
            resource_type: resourceType // Specify the resource type if necessary
        });

        if (result.result === 'ok') {
            console.log("Deletion successful:", result);
        } else {
            console.log("Error deleting resource:", result);
        }

    } catch (error) {
        console.log("An error occurred while destroying the resource:", error);
        return null;
    }
}

export {uploadOnCloudinary,destroyOnCloudinary}