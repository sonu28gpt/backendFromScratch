import { Router } from "express";
import { changeCurrentPassword, getCurrUser, refreshAccessToken, updateAccountDetail, updateUserAvatar, updateUserCoverImage, userLogin, userLogout, userRegister } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router();


router.route("/register").post(upload.fields([
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
router.route("/changePassword").post(verifyJWT,changeCurrentPassword);
router.route("/getCurrUser").get(verifyJWT,getCurrUser);
router.route("/updateAccountDetail").post(verifyJWT,updateAccountDetail);
router.route("/updateUserAvatar").post(verifyJWT,upload.single('avatar'),updateUserAvatar);
router.route("/updateUserCoverImage").post(verifyJWT,upload.single('coverImage'),updateUserCoverImage);

export default router;