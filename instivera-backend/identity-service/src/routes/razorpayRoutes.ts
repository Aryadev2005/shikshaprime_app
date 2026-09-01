import { Router } from "express";
import { createRazorpayOrder, verifyRazorpayOrder } from "../controllers/razorpayController";

const router = Router();

router.post("/order", createRazorpayOrder);
router.post("/verify", verifyRazorpayOrder);

export default router;
