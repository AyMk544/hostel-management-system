import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { readFile } from "fs/promises";
import { join } from "path";
import { seedPayments } from "./seeds/seed-payments";
import * as schema from "./schema";

// Database configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "hostel_management",
  ssl: process.env.NODE_ENV === "production" ? {} : undefined,
};

console.log("Using database config:", {
  ...DB_CONFIG,
  password: DB_CONFIG.password ? "****" : "",
});

async function setupPayments() {
  let pool;
  try {
    // Create the connection pool
    pool = mysql.createPool(DB_CONFIG);
    const db = drizzle(pool, { mode: "default", schema });

    // Read and execute the migration
    const migrationPath = join(__dirname, "migrations", "0004_add_payments_table.sql");
    const migration = await readFile(migrationPath, "utf-8");
    
    console.log("Running payments table migration...");
    const connection = await pool.getConnection();
    await connection.execute(migration);
    connection.release();
    console.log("✅ Payments table migration completed");

    // Run the seeding
    console.log("Seeding payments data...");
    await seedPayments();
    console.log("✅ Setup completed successfully");

  } catch (error) {
    console.error("Error setting up payments:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupPayments(); 