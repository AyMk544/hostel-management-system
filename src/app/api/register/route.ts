import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { users, studentProfiles } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  rollNo: z.string().regex(/^[A-Z]{3}\d{7}$/),
  course: z.string().min(2),
  contactNo: z.string().regex(/^\d{10}$/),
  dateOfBirth: z.string(),
  address: z.string().min(10),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, data.email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Check if roll number already exists
    const existingStudent = await db.query.studentProfiles.findFirst({
      where: (studentProfiles, { eq }) => eq(studentProfiles.rollNo, data.rollNo),
    });

    if (existingStudent) {
      return NextResponse.json(
        { message: "Roll number already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Create user and student profile in a transaction
    const userId = uuidv4();
    await db.transaction(async (tx) => {
      // Create user
      await tx.insert(users).values({
        id: userId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "student",
      });

      // Create student profile
      await tx.insert(studentProfiles).values({
        id: uuidv4(),
        userId: userId,
        rollNo: data.rollNo,
        course: data.course,
        contactNo: data.contactNo,
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address,
      });
    });

    return NextResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 