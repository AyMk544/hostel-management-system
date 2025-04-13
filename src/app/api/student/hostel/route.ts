import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { rooms, studentProfiles, feeStructures } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // First, get the student's room information
    const [studentRoom] = await db
      .select({
        roomId: studentProfiles.roomId,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, session.user.id));

    if (!studentRoom?.roomId) {
      return NextResponse.json({
        hasRoom: false,
        message: "No room assigned"
      });
    }

    // Get room details
    const [roomDetails] = await db
      .select({
        roomNumber: rooms.roomNumber,
        capacity: rooms.capacity,
        occupiedSeats: rooms.occupiedSeats,
        floor: rooms.floor,
      })
      .from(rooms)
      .where(eq(rooms.id, studentRoom.roomId));

    if (!roomDetails) {
      return NextResponse.json(
        { error: "Room not found" },
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

    // Calculate room fee based on room type
    let roomFee = 0;
    let roomType = "Not Assigned";

    if (roomDetails.capacity) {
      if (roomDetails.capacity === 1) {
        roomType = "Single";
        roomFee = latestFeeStructure?.singleRoomFees ?? defaultSingleRoomFee;
      } else if (roomDetails.capacity === 2) {
        roomType = "Double";
        roomFee = latestFeeStructure?.doubleRoomFees ?? defaultDoubleRoomFee;
      } else {
        roomType = "Triple";
        roomFee = latestFeeStructure?.tripleRoomFees ?? defaultTripleRoomFee;
      }
    }

    // Calculate hostel fees
    const baseHostelFee = latestFeeStructure?.hostelFees ?? defaultBaseHostelFee;
    const totalFees = baseHostelFee + roomFee;

    // Add static facilities and rules (in a real app, these might come from the database)
    const hostelDetails = {
      hasRoom: true,
      ...roomDetails,
      blockName: "Block A", // This could come from a blocks table in the future
      roomType,
      fees: {
        baseHostelFee,
        roomTypeFee: roomFee,
        totalFees,
      },
      facilities: [
        "WiFi",
        "24/7 Power Backup",
        "Hot Water",
        "Laundry Service",
        "Common Room",
        "Reading Room",
        "Cafeteria",
        "Security"
      ],
      rules: [
        "Maintain silence in corridors and rooms",
        "No visitors allowed after 8:00 PM",
        "Keep your rooms clean and tidy",
        "No cooking allowed in rooms",
        "Report any maintenance issues immediately",
        "Follow the entry/exit timings strictly",
        "Conserve electricity and water",
        "No ragging or harassment will be tolerated"
      ]
    };

    return NextResponse.json(hostelDetails);
  } catch (error) {
    console.error("[HOSTEL_DETAILS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 