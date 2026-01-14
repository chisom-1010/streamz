import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/db/index";

const connectionString = process.env.SUPABASE_URLL;

if (!connectionString) {
  throw new Error("SUPABASE_URL environment variable is required");
}

console.log("🔗 Connecting to database...");

// Create postgres client
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

console.log("✅ Database connection established");
