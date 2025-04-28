import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  studentProfiles,
  users,
  rooms,
  payments,
  courses, // ← import courses
} from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only admins allowed
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate current month window
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch students + user, room, course.name
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        rollNumber: studentProfiles.rollNo,
        course: courses.name,
        courseId: studentProfiles.courseId, // ← pull in human-readable name
        contactNumber: studentProfiles.contactNo,
        roomNumber: rooms.roomNumber,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .innerJoin(
        courses,
        eq(studentProfiles.courseId, courses.id) // ← join on the FK
      )
      .leftJoin(rooms, eq(studentProfiles.roomId, rooms.id))
      .where(eq(users.role, "student"));

    // Attach this month's hostel/mess status
    const studentsWithPaymentInfo = await Promise.all(
      students.map(async (student) => {
        const [hostel] = await db
          .select({ status: payments.status })
          .from(payments)
          .where(
            and(
              eq(payments.studentId, student.id),
              eq(payments.type, "hostel"),
              gte(payments.dueDate, startOfMonth),
              lte(payments.dueDate, endOfMonth)
            )
          );

        const [mess] = await db
          .select({ status: payments.status })
          .from(payments)
          .where(
            and(
              eq(payments.studentId, student.id),
              eq(payments.type, "mess"),
              gte(payments.dueDate, startOfMonth),
              lte(payments.dueDate, endOfMonth)
            )
          );

        return {
          ...student,
          hostelFeeStatus: hostel?.status ?? "pending",
          messFeeStatus: mess?.status ?? "pending",
        };
      })
    );

    return NextResponse.json(studentsWithPaymentInfo);
  } catch (err) {
    console.error("[STUDENTS_GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// … your PUT handler remains unchanged …

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student ID from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("id");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Start a transaction to handle room assignment changes
    const result = await db.transaction(async (tx) => {
      // Get current student profile to check for room changes
      const [currentProfile] = await tx
        .select({
          roomId: studentProfiles.roomId,
        })
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, studentId));

      // If room is being changed, update room occupancy
      if (currentProfile && currentProfile.roomId !== data.roomId) {
        // If student was previously assigned to a room, decrease its occupancy
        if (currentProfile.roomId) {
          await tx
            .update(rooms)
            .set({
              occupiedSeats: sql`${rooms.occupiedSeats} - 1`,
            })
            .where(eq(rooms.id, currentProfile.roomId));
        }

        // If student is being assigned to a new room, increase its occupancy
        if (data.roomId) {
          await tx
            .update(rooms)
            .set({
              occupiedSeats: sql`${rooms.occupiedSeats} + 1`,
            })
            .where(eq(rooms.id, data.roomId));
        }
      }

      // Update student profile
      await tx
        .update(studentProfiles)
        .set({
          contactNo: data.contactNo,
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address,
          roomId: data.roomId || null,
        })
        .where(eq(studentProfiles.userId, studentId));

      // Update user name and email
      await tx
        .update(users)
        .set({
          name: data.name,
          email: data.email,
        })
        .where(eq(users.id, studentId));

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[STUDENT_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
