import { NextResponse } from "next/server"; // Importing Next.js response handling
import { db } from "@/db";
import { courses } from "@/db/schema";

// Define the API route
export async function GET() {
  try {
    const fetchedCourses = await db.select().from(courses);
    return NextResponse.json(fetchedCourses);
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
