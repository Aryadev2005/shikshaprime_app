import { Router } from "express";
import { getAllMedia, uploadMedia, deleteMedia } from "../controllers/mediaLibraryController";
import { upload } from "../middleware/fileUploadMiddleware";

const router = Router();

router.get("/", getAllMedia);
router.post("/upload", upload.single('file'), uploadMedia);
router.delete("/:id", deleteMedia);

export default router;
