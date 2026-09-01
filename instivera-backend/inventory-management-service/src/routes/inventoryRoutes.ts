import { Router } from "express";
import { 
    getCategories, 
    createCategory,
    deleteCategory,
    getDepartments, 
    createDepartment,
    deleteDepartment,
    getVendors, 
    createVendor,
    deleteVendor,
    createAsset,
    getLocations,
    createLocation,
    createProcurementRequest,
    getProcurementRequests,
    getAssets,
    deleteAsset,
    createVerification,
    getAssetVerifications,
    deleteProcurementRequest,
    updateProcurementRequestStatus,
    completeProcurementRequest
} from "../controllers/inventoryController";

const router = Router();

// Categories
router.get("/admin/categories", getCategories);
router.post("/admin/categories", createCategory);
router.delete("/admin/categories/:id", deleteCategory);

// Departments
router.get("/admin/departments", getDepartments);
router.post("/admin/departments", createDepartment);
router.delete("/admin/departments/:id", deleteDepartment);

// Vendors
router.get("/admin/vendors", getVendors);
router.post("/admin/vendors", createVendor);
router.delete("/admin/vendors/:id", deleteVendor);

// Assets
router.get("/admin/assets", getAssets);
router.post("/admin/assets", createAsset);
router.delete("/admin/assets/:id", deleteAsset);

// Verifications
router.post("/admin/verifications", createVerification);
router.get("/admin/assets/:id/verifications", getAssetVerifications);

// Locations
router.get("/admin/locations", getLocations);
router.post("/admin/locations", createLocation);

// Procurement Requests
router.get("/admin/procurement-requests", getProcurementRequests);
router.post("/admin/procurement-requests", createProcurementRequest);
router.delete("/admin/procurement-requests/:id", deleteProcurementRequest);
router.put("/admin/procurement-requests/:id/status", updateProcurementRequestStatus);
router.patch("/admin/procurement-requests/:id/complete", completeProcurementRequest);

export default router;
