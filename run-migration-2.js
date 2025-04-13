// run-migration-2.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'drizzle', 'migrations', '0002_add_unique_constraint.sql'),
      'utf8'
    );
    
    // Create a connection to the database
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: parseInt(process.env.DATABASE_PORT || '3306')
    });
    
    console.log('Connected to database');
    
    // Run the migration
    console.log('Running migration...');
    await connection.query(migrationSQL);
    
    console.log('Migration completed successfully');
    
    // Close the connection
    await connection.end();
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 