import { runPhonePeReconciliation } from "./phonepeReconciliationScheduler";

const schedulerIntervals: Record<string, NodeJS.Timeout> = {};

export function startPhonePeScheduler(tenant: string) {
  if (schedulerIntervals[tenant]) {
    return; // already running for this tenant
  }

  console.log(`PhonePe reconciliation scheduler started for tenant ${tenant}`);

  // run once immediately
  void runPhonePeReconciliation(tenant);

  // schedule every 3 seconds (consider increasing interval in production)
  schedulerIntervals[tenant] = setInterval(() => {
    void runPhonePeReconciliation(tenant);
  }, 3000);
}

export function stopPhonePeSchedulers() {
  for (const [tenant, interval] of Object.entries(schedulerIntervals)) {
    clearInterval(interval);
    delete schedulerIntervals[tenant];
    console.log(`PhonePe scheduler stopped for tenant ${tenant}`);
  }
}