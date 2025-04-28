import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

// Create the initial connection without database
const initialConnection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

// Create database if it doesn't exist
await initialConnection.query(
  `CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE_NAME}`
);
await initialConnection.end();

// Create the connection with database
const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: "default" });
