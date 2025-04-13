import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  FaUserGraduate, 
  FaDoorOpen, 
  FaQuestionCircle, 
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaSpinner
} from "react-icons/fa";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Admin Dashboard | HMS",
  description: "Admin dashboard for Hostel Management System",
};

// Default stats object
const defaultStats = {
  students: {
    total: 0,
  },
  rooms: {
    total: 0,
    active: 0,
    totalCapacity: 0,
    occupied: 0,
    available: 0,
    occupancyRate: 0,
  },
  queries: {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  },
  recentActivity: {
    newQueries: 0,
    resolvedQueries: 0,
  },
};

async function getStats() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return defaultStats;
    }

    const data = await response.json();
    return {
      students: {
        total: data.students?.total ?? 0,
      },
      rooms: {
        total: data.rooms?.total ?? 0,
        active: data.rooms?.active ?? 0,
        totalCapacity: data.rooms?.totalCapacity ?? 0,
        occupied: data.rooms?.occupied ?? 0,
        available: data.rooms?.available ?? 0,
        occupancyRate: data.rooms?.occupancyRate ?? 0,
      },
      queries: {
        total: data.queries?.total ?? 0,
        pending: data.queries?.pending ?? 0,
        inProgress: data.queries?.inProgress ?? 0,
        resolved: data.queries?.resolved ?? 0,
      },
      recentActivity: {
        newQueries: data.recentActivity?.newQueries ?? 0,
        resolvedQueries: data.recentActivity?.resolvedQueries ?? 0,
      },
    };
  } catch (error) {
    console.error("[STATS_GET]", error);
    return defaultStats;
  }
}

function StatsContent({ stats }: { stats: typeof defaultStats }) {
  return (
    <>
      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <FaUserGraduate className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Room Occupancy</CardTitle>
            <FaDoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rooms.occupancyRate.toFixed(1)}%</div>
            <Progress value={stats.rooms.occupancyRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.rooms.occupied} of {stats.rooms.totalCapacity} beds occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Rooms</CardTitle>
            <FaDoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rooms.active}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Out of {stats.rooms.total} total rooms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <FaQuestionCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queries.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Query Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Queries</CardTitle>
            <FaClock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queries.pending}</div>
            <Progress 
              value={stats.queries.total ? (stats.queries.pending / stats.queries.total) * 100 : 0} 
              className="mt-2 bg-yellow-100" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <FaSpinner className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queries.inProgress}</div>
            <Progress 
              value={stats.queries.total ? (stats.queries.inProgress / stats.queries.total) * 100 : 0} 
              className="mt-2 bg-blue-100" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolved Queries</CardTitle>
            <FaCheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queries.resolved}</div>
            <Progress 
              value={stats.queries.total ? (stats.queries.resolved / stats.queries.total) * 100 : 0} 
              className="mt-2 bg-green-100" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaExclamationCircle className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm font-medium">New Queries</span>
                </div>
                <span className="text-2xl font-bold">{stats.recentActivity.newQueries}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium">Resolved Queries</span>
                </div>
                <span className="text-2xl font-bold">{stats.recentActivity.resolvedQueries}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Capacity</span>
                <span className="text-2xl font-bold">{stats.rooms.totalCapacity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Available Beds</span>
                <span className="text-2xl font-bold">{stats.rooms.available}</span>
              </div>
              <Progress 
                value={stats.rooms.totalCapacity ? (stats.rooms.available / stats.rooms.totalCapacity) * 100 : 0} 
                className="mt-2" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function LoadingStats() {
  return <div className="animate-pulse">{/* Use the same layout with skeleton loading */}
    <StatsContent stats={defaultStats} />
  </div>;
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    redirect("/");
  }

  const stats = await getStats();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      <Suspense fallback={<LoadingStats />}>
        <StatsContent stats={stats} />
      </Suspense>
    </div>
  );
} 