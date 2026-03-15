export const PHONEPE_CONFIG = {
  merchantId: process.env.PHONEPE_MERCHANT_ID || "",
  saltKey: process.env.PHONEPE_SALT_KEY || "",
  saltIndex: parseInt(process.env.PHONEPE_SALT_INDEX || "1"),
  env: process.env.PHONEPE_ENV || "UAT",
  baseUrl:
    process.env.PHONEPE_BASE_URL ||
    "https://api-preprod.phonepe.com/apis/pg-sandbox",
} as const;
