import { db } from "@/db";
import { payments } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

export async function seedPayments() {
  try {
    // Get all student users
    const students = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, "student"),
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Create payments for each student
    for (const student of students) {
      // Get student's room fees
      const studentProfile = await db.query.studentProfiles.findFirst({
        where: (profiles, { eq }) => eq(profiles.userId, student.id),
        with: {
          room: true,
        },
      });

      const hostelFees = studentProfile?.room?.fees || 10000; // Default hostel fees
      const messFees = 3000; // Default mess fees

      // Add hostel payment for current month
      await db.insert(payments).values({
        id: uuidv4(),
        studentId: student.id,
        type: "hostel",
        amount: hostelFees,
        dueDate: new Date(currentYear, currentMonth, 10), // Due on 10th of each month
        paidAmount: 0,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      // Add mess payment for current month
      await db.insert(payments).values({
        id: uuidv4(),
        studentId: student.id,
        type: "mess",
        amount: messFees,
        dueDate: new Date(currentYear, currentMonth, 5), // Due on 5th of each month
        paidAmount: 0,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log("✅ Payments seeded successfully");
  } catch (error) {
    console.error("Error seeding payments:", error);
    throw error;
  }
} 