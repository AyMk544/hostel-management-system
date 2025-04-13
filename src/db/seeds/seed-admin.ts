import { v4 as uuidv4 } from "uuid";
import { hash } from "bcryptjs";
import { users } from "../schema";
import type { DrizzleClient } from "../index";

export async function seedAdmin(db: DrizzleClient) {
  try {
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@hostel.com"),
    });

    if (existingAdmin) {
      console.log("✓ Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await hash("admin123", 12);
    await db.insert(users).values({
      id: uuidv4(),
      name: "Admin",
      email: "admin@hostel.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Successfully created admin user");
    console.log("Email: admin@hostel.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error seeding admin:", error);
    throw error;
  }
} 