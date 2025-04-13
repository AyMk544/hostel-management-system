import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { feeStructures } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const feeStructureSchema = z.object({
  year: z.number().min(2000).max(2100),
  semester: z.enum(["JAN-MAY", "JUL-DEC"]),
  singleRoomFees: z.number().min(0),
  doubleRoomFees: z.number().min(0),
  tripleRoomFees: z.number().min(0),
  hostelFees: z.number().min(0),
  messFees: z.number().min(0),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

interface FeeStructureData {
  id?: string;
  year: number;
  semester: "JAN-MAY" | "JUL-DEC";
  singleRoomFees: number;
  doubleRoomFees: number;
  tripleRoomFees: number;
  hostelFees: number;
  messFees: number;
  dueDate: string;
  createdAt?: Date;
  updatedAt?: Date | null;
}

// GET /api/admin/fees - Get all fee structures
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const allFeeStructures = await db.query.feeStructures.findMany({
      orderBy: (feeStructures, { desc }) => [
        desc(feeStructures.year),
        desc(feeStructures.createdAt)
      ],
    });

    return NextResponse.json(allFeeStructures);
  } catch (error) {
    console.error("[FEES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/fees - Create a new fee structure
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const data = await request.json();
    const validatedData = feeStructureSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid data provided", details: validatedData.error.errors },
        { status: 400 }
      );
    }

    // Check if a fee structure for this year and semester already exists
    const existingFeeStructure = await db
      .select({ id: feeStructures.id })
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.year, validatedData.data.year),
          eq(feeStructures.semester, validatedData.data.semester)
        )
      )
      .limit(1);

    if (existingFeeStructure.length > 0) {
      return NextResponse.json(
        { 
          error: "Duplicate fee structure", 
          message: `A fee structure for ${validatedData.data.year} (${validatedData.data.semester}) already exists` 
        },
        { status: 409 }
      );
    }

    // Generate ID for new fee structure
    const newId = uuidv4();

    // Insert new fee structure
    const result = await db.insert(feeStructures).values({
      id: newId,
      year: validatedData.data.year,
      semester: validatedData.data.semester,
      singleRoomFees: validatedData.data.singleRoomFees,
      doubleRoomFees: validatedData.data.doubleRoomFees,
      tripleRoomFees: validatedData.data.tripleRoomFees,
      hostelFees: validatedData.data.hostelFees,
      messFees: validatedData.data.messFees,
      dueDate: new Date(validatedData.data.dueDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ id: newId });
  } catch (error) {
    console.error("[FEES_POST]", error);
    
    // Handle database constraint error
    if (error instanceof Error && error.message.includes('unique_year_semester')) {
      return NextResponse.json(
        { 
          error: "Duplicate fee structure", 
          message: "A fee structure for this year and semester already exists" 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/fees/:id - Update a fee structure
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
        { error: "Fee structure ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = feeStructureSchema.parse(body);

    // Check if fee structure exists
    const existingFeeStructure = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.id, id),
    });

    if (!existingFeeStructure) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }

    // Check if another fee structure with the same year/semester exists (excluding current one)
    const duplicateStructures = await db
      .select()
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.year, validatedData.year),
          eq(feeStructures.semester, validatedData.semester),
          not(eq(feeStructures.id, id))
        )
      );
    
    if (duplicateStructures.length > 0) {
      return NextResponse.json(
        { 
          error: "Duplicate fee structure", 
          message: `A fee structure for ${validatedData.year} (${validatedData.semester}) already exists` 
        },
        { status: 409 }
      );
    }

    // Update fee structure
    const result = await db
      .update(feeStructures)
      .set({
        year: validatedData.year,
        semester: validatedData.semester,
        singleRoomFees: validatedData.singleRoomFees,
        doubleRoomFees: validatedData.doubleRoomFees,
        tripleRoomFees: validatedData.tripleRoomFees,
        hostelFees: validatedData.hostelFees,
        messFees: validatedData.messFees,
        dueDate: new Date(validatedData.dueDate),
        updatedAt: new Date(),
      })
      .where(eq(feeStructures.id, id));

    return NextResponse.json({ message: "Fee structure updated successfully" });
  } catch (error) {
    console.error("[FEE_STRUCTURE_UPDATE]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    
    // Handle database constraint error
    if (error instanceof Error && error.message.includes('unique_year_semester')) {
      return NextResponse.json(
        { 
          error: "Duplicate fee structure", 
          message: "A fee structure for this year and semester already exists" 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/fees/:id - Delete a fee structure
export async function DELETE(req: Request) {
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
        { error: "Fee structure ID is required" },
        { status: 400 }
      );
    }

    // Check if fee structure exists
    const existingFeeStructure = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.id, id),
    });

    if (!existingFeeStructure) {
      return NextResponse.json(
        { error: "Fee structure not found" },
        { status: 404 }
      );
    }

    // Delete fee structure
    await db
      .delete(feeStructures)
      .where(eq(feeStructures.id, id));

    return NextResponse.json({ message: "Fee structure deleted successfully" });
  } catch (error) {
    console.error("[FEE_STRUCTURE_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 