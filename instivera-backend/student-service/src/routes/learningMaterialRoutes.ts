import { Router } from "express";

import {
    createLearningMaterial,
    getLearningMaterials,
    getLearningMaterialById,
    updateLearningMaterial,
    deleteLearningMaterial,
    downloadLearningMaterial,
    getMyLearningMaterials,
} from "../controllers/learningMaterialController";

import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";
import { learningMaterialUpload } from "../middleware/uploadMiddleware";

const router = Router();

/**
 * Student Specific Routes
 * These must come BEFORE /:id to avoid conflict
 */
router.get(
    "/my-learning-materials",
    requireAuth,
    requireRole("student"),
    getMyLearningMaterials
);

router.get(
    "/my-learning-materials/:id",
    requireAuth,
    requireRole("student"),
    getLearningMaterialById
);

/**
 * Upload Learning Material (Admin/Teacher)
 */
router.post(
    "/",
    requireAuth,
    requireRole("admin", "teacher"),
    learningMaterialUpload.single("file"),
    createLearningMaterial
);

/**
 * Get All Learning Materials (Admin/Teacher Only)
 */
router.get(
    "/",
    requireAuth,
    requireRole("admin", "teacher"),
    getLearningMaterials
);

/**
 * Download Learning Material File (Any authenticated user)
 * MUST come BEFORE /:id to prevent Express matching "download" as an id
 */
router.get(
    "/:id/download",
    requireAuth,
    downloadLearningMaterial
);

/**
 * Get Learning Material By ID (Admin/Teacher)
 */
router.get(
    "/:id",
    requireAuth,
    requireRole("admin", "teacher"),
    getLearningMaterialById
);

/**
 * Update Learning Material (Admin/Teacher)
 */
router.put(
    "/:id",
    requireAuth,
    requireRole("admin", "teacher"),
    learningMaterialUpload.single("file"),
    updateLearningMaterial
);

/**
 * Delete Learning Material (Admin/Teacher)
 */
router.delete(
    "/:id",
    requireAuth,
    requireRole("admin", "teacher"),
    deleteLearningMaterial
);

export default router;
