import { asyncHandler } from "../utils/AsyncHandler.js"


export const userRegister=asyncHandler(async(req,res)=>{
    res.status(200).json("ok");
})