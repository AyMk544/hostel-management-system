import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { queries } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";

const querySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const studentQueries = await db
      .select({
        id: queries.id,
        title: queries.title,
        description: queries.description,
        status: queries.status,
        adminResponse: queries.adminResponse,
        createdAt: queries.createdAt,
        updatedAt: queries.updatedAt,
      })
      .from(queries)
      .where(eq(queries.studentId, session.user.id))
      .orderBy(queries.createdAt);

    return NextResponse.json(studentQueries);
  } catch (error) {
    console.error("[STUDENT_QUERIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = querySchema.parse(body);
    const queryId = uuidv4();

    await db
      .insert(queries)
      .values({
        id: queryId,
        studentId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    // Fetch the created query
    const [createdQuery] = await db
      .select()
      .from(queries)
      .where(eq(queries.id, queryId));

    return NextResponse.json(createdQuery);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    console.error("[STUDENT_QUERIES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 