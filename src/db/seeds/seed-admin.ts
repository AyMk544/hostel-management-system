import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";
import { db } from "../index";
import { users } from "../schema";

async function seedAdmin() {
  const hashedPassword = await hash("admin123", 12);
  await db
    .insert(users)
    .values({
      id: uuidv4(),
      name: "Admin",
      email: "admin@hostel.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .execute();

  console.log("✅ Admin user seeded.");
}

seedAdmin()
  .catch((err) => {
    console.error("❌ Failed to seed admin:", err);
    process.exit(1);
  })
  .finally(() => process.exit());
