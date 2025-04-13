import { v4 as uuidv4 } from "uuid";
import { rooms } from "../schema";
import type { DrizzleClient } from "../index";

export async function seedRooms(db: DrizzleClient) {
  try {
    // Define room types with their fees
    const roomTypes = [
      { capacity: 1, fees: 15000 }, // Single occupancy
      { capacity: 2, fees: 12000 }, // Double occupancy
      { capacity: 3, fees: 10000 }, // Triple occupancy
    ];

    // Create rooms across 4 floors
    for (let floor = 1; floor <= 4; floor++) {
      // Each floor has 10 rooms
      for (let roomNum = 1; roomNum <= 10; roomNum++) {
        // Alternate between room types
        const roomType = roomTypes[(roomNum - 1) % roomTypes.length];
        
        // Format room number: Floor-RoomNumber (e.g., 101, 102, etc.)
        const roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`;

        await db.insert(rooms).values({
          id: uuidv4(),
          roomNumber,
          capacity: roomType.capacity,
          occupiedSeats: 0, // Start with empty rooms
          fees: roomType.fees,
          floor,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    console.log("✅ Successfully seeded rooms data");
  } catch (error) {
    console.error("Error seeding rooms:", error);
    throw error;
  }
}

// If running this script directly
if (require.main === module) {
  const { drizzle } = require("drizzle-orm/mysql2");
  const mysql = require("mysql2/promise");
  
  async function main() {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "3306"),
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "hostel_management",
    });

    const db = drizzle(connection);
    await seedRooms(db);
    await connection.end();
  }

  main().catch(console.error);
} 