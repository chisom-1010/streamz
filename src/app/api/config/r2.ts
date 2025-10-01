import { S3Client } from "@aws-sdk/client-s3";

// Validate required environment variables
const requiredEnvVars = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(
      `${envVar} environment variable is required for R2 configuration`
    );
  }
}

console.log("🔧 Configuring Cloudflare R2...");

// Create R2 client
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || `pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;

console.log(`✅ R2 configured - Bucket: ${R2_BUCKET}`);
