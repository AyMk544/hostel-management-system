import { db } from "@/db"; // adjust if your db import is different
import { rooms } from "@/db/schema"; // adjust path if needed
import { v4 as uuidv4 } from "uuid"; // for random IDs
import "dotenv/config"; // make sure envs are loaded

async function seedRooms() {
  const blocks = ["A", "B", "C", "D", "E"]; // possible blocks
  const roomsData = [];

  for (let i = 1; i <= 30; i++) {
    const roomNumber = `${i.toString().padStart(3, "0")}`; // R001, R002, etc.
    const capacity = Math.floor(Math.random() * 4) + 1; // random 1-4
    const occupiedSeats = Math.floor(Math.random() * (capacity + 1)); // random between 0 and capacity
    const floor = Math.floor(Math.random() * 5) + 1; // random 1-5 floors
    const block = blocks[Math.floor(Math.random() * blocks.length)]; // random block
    const is_active = Math.random() < 0.9; // 90% chance active

    roomsData.push({
      id: uuidv4(),
      roomNumber,
      capacity,
      occupiedSeats,
      floor,
      block,
      is_active,
    });
  }

  try {
    await db.insert(rooms).values(roomsData);
    console.log("✅ 30 rooms seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding rooms:", error);
  } finally {
    process.exit(0);
  }
}

seedRooms();
