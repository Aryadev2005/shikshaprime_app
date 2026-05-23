// import { Router } from "express";
// import {
//   handleWebhook,
//   getPaymentStatus,
//   paymentCallback,
//   lookupByOrder,
//   testPhonePe,
// } from "../controllers/phonePeController";

// const router = Router();

// router.post("/webhook", handleWebhook);
// router.get("/status/:merchantOrderId", getPaymentStatus);
// router.get("/callback", paymentCallback);
// router.get("/lookup-by-order/:merchantOrderId", lookupByOrder);
// router.get("/test", testPhonePe);

// export default router;

import { Router } from "express";
import {
  handleWebhook,
  createWebhookConfiguration,
  getPaymentStatus,
  getWebhookConfigurationStatus,
  getWebhookListenerStatus,
  paymentCallback,
  lookupByOrder,
  testPhonePe,
  initiatePayment,
} from "../controllers/phonePeController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/roleMiddleware";

const router = Router();

router.get("/webhook", getWebhookListenerStatus);
router.head("/webhook", (req, res) => res.sendStatus(200));
router.post("/webhook", handleWebhook);
router.get("/webhook/config", requireAuth, requireRole("admin"), getWebhookConfigurationStatus);
router.post("/webhook/config", requireAuth, requireRole("admin"), createWebhookConfiguration);

router.post("/initiate", requireAuth, initiatePayment);
router.get("/status/:merchantOrderId", getPaymentStatus);
router.get("/callback", paymentCallback);
router.get("/lookup-by-order/:merchantOrderId", lookupByOrder);
router.get("/test", testPhonePe);

export default router;
