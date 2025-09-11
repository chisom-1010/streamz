// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "aws-0-us-east-1.pooler.supabase.com",
    database: "postgres",
    user: "postgres.hymiyqshwskykptufkfb",
    password: process.env.DB_PASSWORD!,
    port: 6543,
    ssl: false, // Try without SSL first
  },
} satisfies Config;
