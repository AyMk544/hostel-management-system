import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, users, rooms, payments, queries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing student ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student details
    const [student] = await db
      .select({
        name: users.name,
        email: users.email,
        rollNo: studentProfiles.rollNo,
        course: studentProfiles.course,
        contactNo: studentProfiles.contactNo,
        dateOfBirth: studentProfiles.dateOfBirth,
        address: studentProfiles.address,
        roomId: studentProfiles.roomId,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(users.id, id));

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("[STUDENT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing student ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await request.json();
    console.log("Updating student roomId:", { studentId: id, roomId });

    try {
      // Get current student profile to check if room is being changed
      const [currentProfile] = await db
        .select({ currentRoomId: studentProfiles.roomId })
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, id));

      // If student had a previous room, decrement its occupancy
      // For decrementing occupancy
      if (currentProfile?.currentRoomId) {
        console.log(
          "Decrementing occupancy for room:",
          currentProfile.currentRoomId
        );

        await db
          .update(rooms)
          .set({
            occupiedSeats: sql`GREATEST(occupied_seats - 1, 0)`,
          })
          .where(eq(rooms.id, currentProfile.currentRoomId));
      }

      // For incrementing occupancy
      if (roomId) {
        console.log("Incrementing occupancy for room:", roomId);

        await db
          .update(rooms)
          .set({
            occupiedSeats: sql`occupied_seats + 1`,
          })
          .where(eq(rooms.id, roomId));
      }

      // Update student's room assignment
      await db
        .update(studentProfiles)
        .set({ roomId: roomId || null })
        .where(eq(studentProfiles.userId, id));

      return NextResponse.json({ message: "Student updated successfully" });
    } catch (innerError: any) {
      console.error("Error in room assignment:", innerError);
      throw innerError;
    }
  } catch (error: any) {
    console.error("[STUDENT_UPDATE]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Missing student ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute all database operations within a transaction
    await db.transaction(async (tx) => {
      // 1. Get the student's room assignment first
      const studentProfile = await tx.query.studentProfiles.findFirst({
        where: (studentProfiles, { eq }) => eq(studentProfiles.userId, id),
      });

      if (!studentProfile) {
        throw new Error(`No student profile found for user ID: ${id}`);
      }

      // 2. If student has a room, decrement the room's occupiedSeats safely
      if (studentProfile.roomId) {
        await tx
          .update(rooms)
          .set({
            occupiedSeats: sql`GREATEST(${rooms.occupiedSeats} - 1, 0)`,
          })
          .where(eq(rooms.id, studentProfile.roomId));
      }

      // 3. Delete related payments
      await tx.delete(payments).where(eq(payments.studentId, id));

      // 4. Delete related queries/issues
      await tx.delete(queries).where(eq(queries.studentId, id));

      // 5. Delete student profile
      await tx.delete(studentProfiles).where(eq(studentProfiles.userId, id));

      // 6. Delete user account
      await tx.delete(users).where(eq(users.id, id));
    });

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("[STUDENT_DELETE]", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
