import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/db";
import { users, studentProfiles } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { verificationTokens } from "@/db/schema";

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
      where: (studentProfiles, { eq }) =>
        eq(studentProfiles.rollNo, data.rollNo),
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
      // Create user with emailVerified set to null
      await tx.insert(users).values({
        id: userId,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "student",
        emailVerified: null, // Initially null until verified
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

    // Send verification email
    // Note: You can't use React hooks in API routes, so we need a different approach
    // We will use a server-side version of sending verification email

    // Option 1: Use a server action to trigger the email provider
    try {
      // This approach requires a server action to be called from the API route
      // Create a separate endpoint or use the email provider directly

      // Calling a custom email verification function (you'll need to implement this)
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      await sendVerificationEmail(data.email, baseUrl);

      return NextResponse.json(
        {
          message:
            "Registration successful. Please check your email to verify your account.",
          redirect: "/verify-request",
        },
        { status: 201 }
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Registration was successful, but email sending failed
      return NextResponse.json(
        {
          message:
            "Registration successful, but failed to send verification email. Please contact support.",
          userId,
        },
        { status: 201 }
      );
    }
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

// Create a helper function to send verification emails
// You will need to implement this function
async function sendVerificationEmail(email: string, baseUrl: string) {
  // Generate a token for this email
  const token = uuidv4();

  // Store the token in your database with an expiry time
  // You need to create a verification_tokens table or collection
  await db.transaction(async (tx) => {
    // Add verification token to database
    await tx.insert(verificationTokens).values({
      identifier: email,
      token: token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
    });
  });

  // Create verification URL
  const url = `${baseUrl}/api/auth/verify?token=${token}`;

  // Send email using nodemailer
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    port: Number(process.env.EMAIL_SERVER_PORT),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_SERVER_USER,
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; text-align: center;">Email Verification</h1>
        <p style="color: #666; font-size: 16px;">Thank you for registering. Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p style="color: #888; font-size: 14px; text-align: center;">If you did not request this email, please ignore it.</p>
        <p style="color: #888; font-size: 14px; text-align: center;">This link will expire in 24 hours.</p>
      </div>
    `,
    text: `Please verify your email by clicking this link: ${url}`,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
}
