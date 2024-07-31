import { Router } from "express";
import { refreshAccessToken, userLogin, userLogout, userRegister } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router();


router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    userRegister
);
router.route("/login").post(userLogin);//remember to send data in raw because here we are not using upload.field 


//secured routes
router.route("/logout").post(verifyJWT,userLogout);
router.route("/refresh-accessToken").post(refreshAccessToken)//this route will help in refreshing the access token without login with the help of refresh token

export default router;