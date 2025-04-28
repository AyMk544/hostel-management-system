import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import {
  studentProfiles,
  users,
  courses, // ← import courses
} from "@/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNo: z.string().min(1, "Roll number is required"),
  courseId: z.string().min(1, "Course is required"), // this is the courseId
  contactNo: z.string().min(10, "Contact number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const [profile] = await db
      .select({
        name: users.name,
        email: users.email,
        rollNo: studentProfiles.rollNo,
        course: courses.name, // ← human-readable course name
        contactNo: studentProfiles.contactNo,
        dateOfBirth: studentProfiles.dateOfBirth,
        address: studentProfiles.address,
        courseId: studentProfiles.courseId,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .innerJoin(
        courses,
        eq(studentProfiles.courseId, courses.id) // ← join on FK
      )
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!profile) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Format date for inputs
    const formatted = {
      ...profile,
      dateOfBirth: new Date(profile.dateOfBirth).toISOString().split("T")[0],
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[STUDENT_PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validated = profileSchema.parse(body);

    // Update user name
    await db
      .update(users)
      .set({ name: validated.name })
      .where(eq(users.id, session.user.id));

    // Update the profile (use courseId, not 'course')
    await db
      .update(studentProfiles)
      .set({
        courseId: validated.courseId, // ← set FK column
        contactNo: validated.contactNo,
        dateOfBirth: new Date(validated.dateOfBirth),
        address: validated.address,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, session.user.id));

    // Re-fetch with joined course name
    const [updated] = await db
      .select({
        name: users.name,
        email: users.email,
        rollNo: studentProfiles.rollNo,
        course: courses.name, // ← course name again
        courseId: studentProfiles.courseId,
        contactNo: studentProfiles.contactNo,
        dateOfBirth: studentProfiles.dateOfBirth,
        address: studentProfiles.address,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .innerJoin(courses, eq(studentProfiles.courseId, courses.id))
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    console.error("[STUDENT_PROFILE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
