import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})




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


const getPublicIdfromUrl=(url)=>{
        const parts=url.split('/');
        const publicIdWithExtension=parts.slice(-1).join('');
        const publicId=publicIdWithExtension.split('.')[0];
        return publicId;

}

const destroyOnCloudinary=async (url)=>{
    try{
        if(!url){
            console.log("please provide url for performing delete operation");
            return null;
        }
        const publicId=getPublicIdfromUrl(url);
        if(!publicId){
            console.log('something went wrong while fetching public id from url from',url);
            return null;
        }

        await cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.log({ message: 'Error deleting image', error });
            }else{
                console.log("deletion successfull");
            }
           
          });


    }catch(error){
        console.log("while destroying something went wrong",error);
        return null;
    }
}


export {uploadOnCloudinary,destroyOnCloudinary}