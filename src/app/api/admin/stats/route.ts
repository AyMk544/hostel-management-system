import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users, rooms, queries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// GET /api/admin/stats - Get dashboard statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total students count
    const [studentsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "student"));

    // Get rooms statistics using MySQL compatible syntax
    const [roomsStats] = await db
      .select({
        totalRooms: sql<number>`count(*)`,
        totalCapacity: sql<number>`sum(${rooms.capacity})`,
        totalOccupied: sql<number>`sum(${rooms.occupiedSeats})`,
        activeRooms: sql<number>`sum(case when ${rooms.is_active} = true then 1 else 0 end)`,
      })
      .from(rooms);

    // Get queries statistics using MySQL compatible syntax
    const [queriesStats] = await db
      .select({
        totalQueries: sql<number>`count(*)`,
        pendingQueries: sql<number>`sum(case when ${queries.status} = 'pending' then 1 else 0 end)`,
        inProgressQueries: sql<number>`sum(case when ${queries.status} = 'in_progress' then 1 else 0 end)`,
        resolvedQueries: sql<number>`sum(case when ${queries.status} = 'resolved' then 1 else 0 end)`,
      })
      .from(queries);

    // Calculate occupancy rate
    const occupancyRate =
      roomsStats.totalCapacity > 0
        ? (roomsStats.totalOccupied / roomsStats.totalCapacity) * 100
        : 0;

    // Get recent activity counts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent activity using MySQL compatible syntax
    const [recentActivity] = await db
      .select({
        newQueries: sql<number>`sum(case when ${queries.createdAt} >= ${sevenDaysAgo} then 1 else 0 end)`,
        resolvedQueries: sql<number>`sum(case when ${queries.status} = 'resolved' and ${queries.updatedAt} >= ${sevenDaysAgo} then 1 else 0 end)`,
      })
      .from(queries);

    return NextResponse.json({
      students: {
        total: studentsCount.count,
      },
      rooms: {
        total: roomsStats.totalRooms,
        active: roomsStats.activeRooms,
        totalCapacity: roomsStats.totalCapacity || 0,
        occupied: roomsStats.totalOccupied || 0,
        available:
          (roomsStats.totalCapacity || 0) - (roomsStats.totalOccupied || 0),
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      },
      queries: {
        total: queriesStats.totalQueries || 0,
        pending: queriesStats.pendingQueries || 0,
        inProgress: queriesStats.inProgressQueries || 0,
        resolved: queriesStats.resolvedQueries || 0,
      },
      recentActivity: {
        newQueries: recentActivity.newQueries || 0,
        resolvedQueries: recentActivity.resolvedQueries || 0,
      },
    });
  } catch (error) {
    console.error("[STATS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
