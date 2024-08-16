import {ApiError} from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

export const healthCheck=asyncHandler(async(req,res)=>{


    return res.status(200).json(
        new ApiResponse(200,{},"everyThing is ok")
    )
});