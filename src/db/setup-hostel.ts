import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import { seedRooms } from "./seeds/seed-rooms";

// Database configuration
const DB_CONFIG = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "hostel_management",
  ssl: process.env.NODE_ENV === "production" ? {} : undefined,
};

async function setupHostel() {
  let pool;
  try {
    // Create the connection pool
    pool = mysql.createPool(DB_CONFIG);
    const db = drizzle(pool, { mode: "default", schema });

    // Seed rooms data
    console.log("Seeding rooms data...");
    await seedRooms(db);
    console.log("✅ Setup completed successfully");

  } catch (error) {
    console.error("Error setting up hostel:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupHostel(); 