import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function init() {
  try {
    // Create the initial connection without database
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '3306'),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE_NAME}`);
    console.log(`Database ${process.env.DATABASE_NAME} created successfully`);

    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

init(); 