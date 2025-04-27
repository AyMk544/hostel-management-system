import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const roomSchema = z.object({
  roomNumber: z.string().min(2),
  capacity: z.number().min(1).max(4),
  floor: z.number().min(1),
  is_active: z.boolean().optional(),
  block: z.string().min(1),
});

// GET /api/admin/rooms - Get all rooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allRooms = await db.query.rooms.findMany({
      with: {
        students: true,
      },
    });

    const formattedRooms = allRooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      occupiedSeats: room.occupiedSeats,
      floor: room.floor,
      block: room.block,
      type:
        room.capacity <= 1
          ? "single"
          : room.capacity <= 2
          ? "double"
          : "triple",
      is_active: room.is_active,
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("[ROOMS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/rooms - Create a new room
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = roomSchema.parse(body);

    // Check if room number already exists
    const existingRoom = await db.query.rooms.findFirst({
      where: eq(rooms.roomNumber, validatedData.roomNumber),
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: "Room number already exists" },
        { status: 400 }
      );
    }

    // Create new room
    await db.insert(rooms).values({
      id: uuidv4(),
      ...validatedData,
      occupiedSeats: 0,
      is_active: validatedData.is_active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Room created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ROOM_CREATE]", error);
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

// PUT /api/admin/rooms/:id - Update room details
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = roomSchema.parse(body);

    // Check if room exists
    const existingRoom = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
    });

    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if new room number conflicts with existing ones
    if (validatedData.roomNumber !== existingRoom.roomNumber) {
      const roomWithNumber = await db.query.rooms.findFirst({
        where: eq(rooms.roomNumber, validatedData.roomNumber),
      });

      if (roomWithNumber) {
        return NextResponse.json(
          { error: "Room number already exists" },
          { status: 400 }
        );
      }
    }

    // Check if new capacity is less than current occupancy
    if (validatedData.capacity < existingRoom.occupiedSeats) {
      return NextResponse.json(
        { error: "New capacity cannot be less than current occupancy" },
        { status: 400 }
      );
    }

    // Update room
    await db
      .update(rooms)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, id));

    return NextResponse.json({ message: "Room updated successfully" });
  } catch (error) {
    console.error("[ROOM_UPDATE]", error);
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

// DELETE /api/admin/rooms/:id - Delete a room
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Room ID is required" },
        { status: 400 }
      );
    }

    // Check if room exists and has no occupants
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.occupiedSeats > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with occupants" },
        { status: 400 }
      );
    }

    // Delete room
    await db.delete(rooms).where(eq(rooms.id, id));

    return NextResponse.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("[ROOM_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
