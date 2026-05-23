import dotenv from "dotenv";
import path from "path"; 
import fs from "fs";

export const env = process.env.NODE_ENV || "development"; 
const envFile = path.resolve(process.cwd(), `.env.${env}`); 
if (fs.existsSync(envFile)) { 
    dotenv.config({ path: envFile }); 
    console.log(`Loaded env file ${envFile}`); 
} else { 
    dotenv.config(); // fallback to .env console.log("Loaded fallback .env"); 
}
console.log('NODE_ENV=', process.env.NODE_ENV);
console.log('Using DB_HOST=', process.env.DB_HOST, 'DB_PORT=', process.env.DB_PORT);
console.log('Using DB_USER=', process.env.DB_USERNAME ? '***' : '<missing>');
console.log('Using DB_PASS=', process.env.DB_PASSWORD ? '***' : '<missing>');


export const config = {
  env,
  port: process.env.SERVICE_PORT || 4000,
  db: {
    host: process.env.DB_HOST!,
    port: process.env.DB_PORT!,
    user: process.env.DB_USERNAME!,
    pass: process.env.DB_PASSWORD!,
    name: process.env.DB_NAME!,
  }, 
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expires_in: process.env.JWT_EXPIRES_IN!,
  
  // Frontend URL for generating payment links
  frontendUrl: process.env.FRONTEND_URL,
  
  // SMS Configuration
  sms: {
    user: process.env.SMS_USER!,
    password: process.env.SMS_PASSWORD!,
    senderId: process.env.SMS_SENDER_ID!,
    peId: process.env.SMS_PEID!,
    templateId: process.env.SMS_DLT_TEMPLATE_ID!,
    channel: process.env.SMS_CHANNEL!,
    route: process.env.SMS_ROUTE!
  },

  // PhonePe Configuration
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID!,
    clientId: process.env.PHONEPE_CLIENT_ID!,
    clientSecret: process.env.PHONEPE_CLIENT_SECRET!,
    saltKey: process.env.PHONEPE_SALT_KEY || process.env.PHONEPE_CLIENT_SECRET!,
    keyIndex: parseInt(process.env.PHONEPE_KEY_INDEX || '1', 10),
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com',
    apiPrefix: process.env.PHONEPE_API_PREFIX || (
      (process.env.PHONEPE_BASE_URL || '').includes('api-preprod.phonepe.com')
        ? '/apis/pg-sandbox'
        : '/apis/hermes'
    ),
    oauthPath: process.env.PHONEPE_OAUTH_PATH || (
      `${process.env.PHONEPE_API_PREFIX || (
        (process.env.PHONEPE_BASE_URL || '').includes('api-preprod.phonepe.com')
          ? '/apis/pg-sandbox'
          : '/apis/hermes'
      )}/v1/oauth/token`
    ),
    redirectUrl: process.env.PHONEPE_REDIRECT_URL!,
    callbackUrl: process.env.PHONEPE_CALLBACK_URL!,
    environment: process.env.PHONEPE_ENVIRONMENT || 'UAT',
    webhook: {
      url: process.env.PHONEPE_WEBHOOK_URL || process.env.PHONEPE_CALLBACK_URL!,
      username: process.env.PHONEPE_WEBHOOK_USERNAME || "",
      password: process.env.PHONEPE_WEBHOOK_PASSWORD || "",
      description: process.env.PHONEPE_WEBHOOK_DESCRIPTION || "ShikshaPrime PhonePe order webhook",
      events: (process.env.PHONEPE_WEBHOOK_EVENTS || "checkout.order.completed,checkout.order.failed")
        .split(",")
        .map((event) => event.trim())
        .filter(Boolean)
    }
  },
  
  // Razorpay Configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID!,
    keySecret: process.env.RAZORPAY_KEY_SECRET!,
    isTestMode: env !== 'production' // Use test credentials unless in production
  },
  
  // SMTP Configuration (ZeptoMail)
  smtp: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!) || 587,
    username: process.env.SMTP_USERNAME!,
    password: process.env.SMTP_PASSWORD!,
    from: process.env.SMTP_FROM || 'noreply@shikshaprime.com'
  },
  
  secretKey: process.env.SECRET_KEY!
};
