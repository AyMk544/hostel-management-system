import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { and, eq, lte, gte, desc } from "drizzle-orm";
import { studentProfiles, queries, payments, feeStructures } from "@/db/schema";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile with user information
    const student = await db.query.studentProfiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.userId, session.user.id),
      with: {
        user: true,
        room: true,
        course: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get pending queries count
    const pendingQueries = await db.query.queries.findMany({
      where: (queries, { and, eq }) =>
        and(
          eq(queries.studentId, session.user.id),
          eq(queries.status, "pending")
        ),
    });

    // Get current month's payments
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get the latest fee structure
    const [latestFeeStructure] = await db
      .select()
      .from(feeStructures)
      .orderBy(desc(feeStructures.year), desc(feeStructures.createdAt))
      .limit(1);

    // For debugging
    console.log("Latest fee structure found:", latestFeeStructure);

    // Add more detailed logging
    if (!latestFeeStructure) {
      console.log(
        "No fee structure found, using default values for fee calculations"
      );
    }

    // Calculate room fee based on room type
    let roomFee = 0;
    const defaultSingleRoomFee = 15000;
    const defaultDoubleRoomFee = 12000;
    const defaultTripleRoomFee = 10000;
    const defaultBaseHostelFee = 8000;
    const defaultMessFee = 6000;

    if (student.room) {
      const capacity = student.room.capacity;

      if (latestFeeStructure) {
        // Use fee structure if available
        if (capacity === 1) {
          roomFee = latestFeeStructure.singleRoomFees;
        } else if (capacity === 2) {
          roomFee = latestFeeStructure.doubleRoomFees;
        } else {
          roomFee = latestFeeStructure.tripleRoomFees;
        }
      } else {
        // Use default values if no fee structure exists
        if (capacity === 1) {
          roomFee = defaultSingleRoomFee;
        } else if (capacity === 2) {
          roomFee = defaultDoubleRoomFee;
        } else {
          roomFee = defaultTripleRoomFee;
        }
      }
    }

    const [hostelPayment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.studentId, session.user.id),
          eq(payments.type, "hostel"),
          gte(payments.dueDate, startOfMonth),
          lte(payments.dueDate, endOfMonth)
        )
      );

    const [messPayment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.studentId, session.user.id),
          eq(payments.type, "mess"),
          gte(payments.dueDate, startOfMonth),
          lte(payments.dueDate, endOfMonth)
        )
      );

    // Calculate total hostel fees (base hostel fees + room type fee)
    const baseHostelFees = latestFeeStructure
      ? latestFeeStructure.hostelFees
      : defaultBaseHostelFee;

    const roomTypeFees = roomFee;

    // Calculate mess fees from fee structure or use the payment amount
    const totalMessFees = latestFeeStructure
      ? latestFeeStructure.messFees
      : messPayment?.amount
      ? Number(messPayment.amount)
      : defaultMessFee;

    let roomType = "Not Assigned";
    if (student.room) {
      const capacity = student.room.capacity;
      if (capacity === 1) {
        roomType = "Single";
      } else if (capacity === 2) {
        roomType = "Double";
      } else {
        roomType = "Triple";
      }
    }

    // Only show fees if there's a fee structure or payment record
    const showFees = latestFeeStructure || hostelPayment || messPayment;

    const dashboardData = {
      name: student.user.name,
      email: student.user.email,
      rollNo: student.rollNo,
      course: student.course.name,
      contactNo: student.contactNo,
      roomNumber: student.room?.roomNumber,
      roomType,
      hostelFees: showFees
        ? {
            baseHostelFees: baseHostelFees,
            roomTypeFees: roomTypeFees,
            total: baseHostelFees + roomTypeFees,
            paid: hostelPayment?.paidAmount
              ? Number(hostelPayment.paidAmount)
              : 0,
            dueDate:
              hostelPayment?.dueDate ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: hostelPayment?.status || "pending",
          }
        : null,
      messCharges: showFees
        ? {
            total: totalMessFees,
            paid: messPayment?.paidAmount ? Number(messPayment.paidAmount) : 0,
            dueDate:
              messPayment?.dueDate ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: messPayment?.status || "pending",
          }
        : null,
      pendingQueries: pendingQueries.length,
      attendance: 85, // You can add attendance tracking in your schema
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("[STUDENT_DASHBOARD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
