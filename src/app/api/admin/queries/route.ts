import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { queries, studentProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const queryResponseSchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved"]),
  adminResponse: z.string().min(1),
});

// GET /api/admin/queries - Get all queries
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const allQueries = await db.query.queries.findMany({
      with: {
        student: {
          with: {
            studentProfile: true,
          },
        },
      },
      orderBy: [desc(queries.createdAt)],
    });

    const formattedQueries = allQueries.map(query => ({
      id: query.id,
      title: query.title,
      description: query.description,
      status: query.status,
      adminResponse: query.adminResponse,
      createdAt: query.createdAt,
      studentName: query.student.name,
      studentRollNo: query.student.studentProfile?.rollNo || 'N/A',
    }));

    // Log for debugging
    console.log('Queries found:', formattedQueries);

    return NextResponse.json(formattedQueries);
  } catch (error) {
    console.error("[QUERIES_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/queries/:id - Update query status and response
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Query ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = queryResponseSchema.parse(body);

    // Check if query exists
    const existingQuery = await db.query.queries.findFirst({
      where: eq(queries.id, id),
    });

    if (!existingQuery) {
      return NextResponse.json(
        { error: "Query not found" },
        { status: 404 }
      );
    }

    // Update query
    await db
      .update(queries)
      .set({
        status: validatedData.status,
        adminResponse: validatedData.adminResponse,
        updatedAt: new Date(),
      })
      .where(eq(queries.id, id));

    return NextResponse.json({ message: "Query updated successfully" });
  } catch (error) {
    console.error("[QUERY_UPDATE]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 