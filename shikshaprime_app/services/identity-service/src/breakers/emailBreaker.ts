import CircuitBreaker from "opossum";

async function sendEmail(msg) {}

const emailBreaker = new CircuitBreaker(sendEmail, {
  timeout: 4000,
  errorThresholdPercentage: 50,
  resetTimeout: 12000,
});

emailBreaker.fallback(() => ({ success: false, reason: "Email service down" }));

export default emailBreaker;