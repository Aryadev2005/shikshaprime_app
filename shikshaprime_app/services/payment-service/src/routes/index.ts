import { Router } from "express";
import paymentTypeRoutes from "./paymentTypeRoutes";
import studentPaymentRoutes from "./studentPaymentRoutes";
import dashboardRoutes from "./dashboardRoutes";
import { getTenantBreaker } from "../breakers/dbBreaker";
import webhookRoutes from "./webhookRoutes";

const router = Router();

router.use("/types", paymentTypeRoutes);
router.use("/students", studentPaymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/webhooks", webhookRoutes);

router.get("/ready/:tenant", async (req, res) => {
  const breaker = getTenantBreaker(req.params.tenant);
  const dbReady = await breaker.fire();
  if (dbReady) res.status(200).send("READY");
  else res.status(500).send("NOT READY");
});

export default router;
