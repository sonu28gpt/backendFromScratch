export const ayncHandler=(fn)=>{
    return (req,res,next)=>{
        Promise.resolve(fn(req,res,next)).catch((err)=>next(err));
    }
}





//try and catch block
/*
const asynHandler=(fn)=>async (req,res,next)=>{
    try{
       await fn(req,res,next);
    }catch(err){
        
        res.status(err.code|| 500).json({
            success:false,
            message:err.message
        })
    }

}

*/