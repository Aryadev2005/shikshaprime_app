import CircuitBreaker from "opossum";

async function callPaymentApi() {}

const paymentBreaker = new CircuitBreaker(callPaymentApi, {
  timeout: 5000,
  errorThresholdPercentage: 40,
  resetTimeout: 15000,
});

paymentBreaker.fallback(() => ({ status: "unavailable" }));

export default paymentBreaker;
