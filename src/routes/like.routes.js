import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggle/v/:videoId").get(toggleVideoLike);
router.route("/toggle/c/:commentId").get(toggleCommentLike);
router.route("/toggle/t/:tweetId").get(toggleTweetLike);
router.route("/videos").get(getLikedVideos);



export default router;