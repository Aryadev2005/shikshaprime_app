import { Router } from "express";
import { upload } from "../middleware/fileUploadMiddleware";
import {
  createNaacInfrastructureItems,
  getNaacInfrastructureItems,
  createNaacLibraryResources,
  getNaacLibraryResources,
  createNaacItInfrastructure,
  getNaacItInfrastructure,
  createNaacHostel,
  getNaacHostel,
} from "../controllers/naacInfrastructureControllers";

const router = Router();

// ─── INFRASTRUCTURE ITEMS ───────────────────────────────────────────────────
router.get("/infrastructure-items", getNaacInfrastructureItems);
router.post("/infrastructure-items", upload.any(), createNaacInfrastructureItems);
router.post("/infrastructure-items/:id", upload.any(), createNaacInfrastructureItems);
router.put("/infrastructure-items/:id", upload.any(), createNaacInfrastructureItems);


// ─── LIBRARY RESOURCES ─────────────────────────────────────────────────────
router.get("/library-resources", getNaacLibraryResources);
router.post("/library-resources", upload.any(), createNaacLibraryResources);
router.put("/library-resources/:id", upload.any(), createNaacLibraryResources);


// ─── IT INFRASTRUCTURE ─────────────────────────────────────────────────────
router.get("/it-infrastructure", getNaacItInfrastructure);
router.post("/it-infrastructure", upload.any(), createNaacItInfrastructure);
router.put("/it-infrastructure/:id", upload.any(), createNaacItInfrastructure);


// ─── HOSTEL ───────────────────────────────────────────────────────────────
router.get("/hostel-facilities", getNaacHostel);
router.post("/hostel-facilities", upload.any(), createNaacHostel);
router.put("/hostel-facilities/:id", upload.any(), createNaacHostel);


export default router;
