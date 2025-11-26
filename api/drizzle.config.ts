// drizzle.config.ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import fs from "fs";
//const certificate = fs.readFileSync('./certs/prod-ca-2021.crt').toString();

export default defineConfig({
  schema: "./shared/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "aws-1-us-east-2.pooler.supabase.com",
    database: "postgres",
    user: "postgres.wwehrrarhinwlhsshedv",
    password: "9eclZwQnWBkXYuCv",
    port: 5432,
    //ssl:"verify-full" ,
  },
  verbose: true,
  strict: true,
});
