import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { queries, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateQuerySchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved"]),
  adminResponse: z.string().optional(),
});

// GET /api/admin/queries/:id - Get query details
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    // Get query with student details
    const result = await db
      .select({
        id: queries.id,
        studentId: queries.studentId,
        studentName: users.name,
        title: queries.title,
        description: queries.description,
        status: queries.status,
        adminResponse: queries.adminResponse,
        createdAt: queries.createdAt,
        updatedAt: queries.updatedAt,
      })
      .from(queries)
      .innerJoin(users, eq(queries.studentId, users.id))
      .where(eq(queries.id, id));

    if (!result.length) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("[QUERY_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/queries/:id - Update query status and response
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validatedData = updateQuerySchema.parse(body);

    // Check if query exists
    const existingQuery = await db
      .select()
      .from(queries)
      .where(eq(queries.id, id));

    if (!existingQuery.length) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }

    // If marking as resolved, require an admin response
    if (
      validatedData.status === "resolved" &&
      !validatedData.adminResponse?.trim()
    ) {
      return NextResponse.json(
        { error: "Admin response is required when resolving a query" },
        { status: 400 }
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

    return NextResponse.json({
      message: "Query updated successfully",
    });
  } catch (error) {
    console.error("[QUERY_UPDATE]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
