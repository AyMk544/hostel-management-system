import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { studentProfiles, users, payments, rooms, feeStructures } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get student details with room information
    const [student] = await db
      .select({
        id: users.id,
        name: users.name,
        rollNo: studentProfiles.rollNo,
        roomId: studentProfiles.roomId,
        roomNumber: rooms.roomNumber,
        roomCapacity: rooms.capacity
      })
      .from(users)
      .innerJoin(studentProfiles, eq(users.id, studentProfiles.userId))
      .leftJoin(rooms, eq(studentProfiles.roomId, rooms.id))
      .where(eq(users.id, id));

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get the latest fee structure
    const [latestFeeStructure] = await db
      .select()
      .from(feeStructures)
      .orderBy(desc(feeStructures.year), desc(feeStructures.createdAt))
      .limit(1);

    // Default fees
    const defaultSingleRoomFee = 15000;
    const defaultDoubleRoomFee = 12000;
    const defaultTripleRoomFee = 10000;
    const defaultBaseHostelFee = 8000;
    const defaultMessFee = 6000;

    // Calculate room fee based on room type
    let roomFee = 0;
    let roomType = "Not Assigned";

    if (student.roomCapacity) {
      if (student.roomCapacity === 1) {
        roomType = "Single";
        roomFee = latestFeeStructure ? latestFeeStructure.singleRoomFees || 0 : defaultSingleRoomFee;
      } else if (student.roomCapacity === 2) {
        roomType = "Double";
        roomFee = latestFeeStructure ? latestFeeStructure.doubleRoomFees || 0: defaultDoubleRoomFee;
      } else {
        roomType = "Triple";
        roomFee = latestFeeStructure ? latestFeeStructure.tripleRoomFees || 0 : defaultTripleRoomFee;
      }
    }

    // Calculate base hostel fee
    const baseHostelFee = latestFeeStructure 
      ? latestFeeStructure.hostelFees || 0
      : defaultBaseHostelFee;

    // Get current month's fees
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1); // First day of next month

    const [hostelFees] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.studentId, id),
          eq(payments.type, "hostel"),
          eq(payments.dueDate, currentMonth)
        )
      );

    const [messFees] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.studentId, id),
          eq(payments.type, "mess"),
          eq(payments.dueDate, currentMonth)
        )
      );

    // Calculate total hostel fees (base + room type)
    const totalHostelFees = baseHostelFee + roomFee;

    return NextResponse.json({
      ...student,
      roomType,
      hostelFees: hostelFees || {
        id: "",
        amount: totalHostelFees, // Combined hostel and room fees
        baseHostelFee: baseHostelFee,
        roomTypeFee: roomFee,
        dueDate: currentMonth.toISOString(),
        paidAmount: 0,
        status: "pending",
      },
      messFees: messFees || {
        id: "",
        amount: latestFeeStructure ? ( latestFeeStructure.messFees || 0 ): defaultMessFee,
        dueDate: currentMonth.toISOString(),
        paidAmount: 0,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("[STUDENT_FEES_GET]", error);
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
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { type, paidAmount } = data;

    if (!type || typeof paidAmount !== "number") {
      return NextResponse.json(
        { error: "Invalid data provided" },
        { status: 400 }
      );
    }

    // Get current fee record
    const currentDate = new Date();
    currentDate.setDate(1); // First day of current month
    
    const [currentFee] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.studentId, id),
          eq(payments.type, type),
          eq(payments.dueDate, currentDate)
        )
      );

    // Determine default amount based on type
    const defaultAmount = type === 'hostel' ? 10000 : 3000;

    // Determine status based on paid amount
    let status: 'pending' | 'partial' | 'paid' = 'pending';
    const currentAmount = currentFee ? Number(currentFee.amount) : defaultAmount;
    if (paidAmount >= currentAmount) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    if (!currentFee) {
      // Create new payment record if it doesn't exist
      const paymentId = crypto.randomUUID();
      await db
        .insert(payments)
        .values({
          id: paymentId,
          studentId: id,
          type,
          amount: defaultAmount.toString(),
          paidAmount: paidAmount.toString(),
          dueDate: currentDate,
          status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    } else {
      // Update existing payment record
      await db
        .update(payments)
        .set({
          paidAmount: paidAmount.toString(),
          status,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, currentFee.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STUDENT_FEES_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 