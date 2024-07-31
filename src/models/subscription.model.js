import mongoose from "mongoose";

const subscriptionSchema=new mongoose.Schema({
    subscriber:{//the one who subsribe 
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{//the one whom"subscriber" is subscribing
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true});
export const Subscription=mongoose.model("Subscription",subscriptionSchema);