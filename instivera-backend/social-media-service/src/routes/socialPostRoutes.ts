import { Router } from "express";
import { createPost, getPosts, deletePost, updatePost, retryPost, getTags, syncHistoricalPosts } from "../controllers/socialPostController";
import { upload } from "../middleware/fileUploadMiddleware";

const router = Router();

router.get("/tags", getTags);
router.get("/", getPosts);
router.post("/sync-history", syncHistoricalPosts);
router.post("/", upload.single("media"), createPost);
router.put("/:id", upload.single("media"), updatePost);
router.post("/:id/retry", retryPost);
router.delete("/:id", deletePost);

export default router;
