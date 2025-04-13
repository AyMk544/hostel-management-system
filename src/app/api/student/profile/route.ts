import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNo: z.string().min(1, "Roll number is required"),
  course: z.string().min(1, "Course is required"),
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
        course: studentProfiles.course,
        contactNo: studentProfiles.contactNo,
        dateOfBirth: studentProfiles.dateOfBirth,
        address: studentProfiles.address,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!profile) {
      return new NextResponse("Student not found", { status: 404 });
    }

    // Format the date to YYYY-MM-DD for the date input
    const formattedProfile = {
      ...profile,
      dateOfBirth: new Date(profile.dateOfBirth).toISOString().split('T')[0],
    };

    return NextResponse.json(formattedProfile);
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
    const validatedData = profileSchema.parse(body);

    // Don't allow changing email or roll number
    const { email, rollNo, ...updateData } = validatedData;

    // Update user name
    await db
      .update(users)
      .set({ name: updateData.name })
      .where(eq(users.id, session.user.id));

    // Update student profile
    await db
      .update(studentProfiles)
      .set({
        course: updateData.course,
        contactNo: updateData.contactNo,
        dateOfBirth: new Date(updateData.dateOfBirth),
        address: updateData.address,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.userId, session.user.id));

    // Fetch the updated profile
    const [updatedProfile] = await db
      .select({
        name: users.name,
        email: users.email,
        rollNo: studentProfiles.rollNo,
        course: studentProfiles.course,
        contactNo: studentProfiles.contactNo,
        dateOfBirth: studentProfiles.dateOfBirth,
        address: studentProfiles.address,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("[STUDENT_PROFILE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 