import { Router } from "express";
import { createAccount, getAllAccounts, updateAccount, verifyAccount, fetchAvailablePages, deleteAccount } from "../controllers/socialAccountController";

const router = Router();

router.post("/fetch-pages", fetchAvailablePages);
router.post("/", createAccount);
router.get("/", getAllAccounts);
router.put("/:id", updateAccount);
router.delete("/:id", deleteAccount);
router.post("/:id/verify", verifyAccount);

export default router;
