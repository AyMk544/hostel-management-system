"use client";

import { useMemo } from "react";
import {
  Users,
  Home,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardStats {
  students: {
    total: number;
  };
  rooms: {
    total: number;
    active: number;
    totalCapacity: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  queries: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
  };
  recentActivity: {
    newQueries: number;
    resolvedQueries: number;
  };
}

const defaultStats: DashboardStats = {
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

// Fetch function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  return res.json();
};

export default function AdminDashboardPage() {
  // Use SWR for data fetching with caching and revalidation
  const { data, error, isLoading } = useSWR("/api/admin/stats", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  // Process data with useMemo to avoid unnecessary recalculations
  const stats = useMemo(() => {
    if (!data) return defaultStats;

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
  }, [data]);

  // Define stat cards with memoization
  const statCards = useMemo(
    () => [
      {
        title: "Total Students",
        value: stats?.students?.total?.toString() ?? "0",
        icon: Users,
        color: "from-emerald-500 to-teal-600",
        bgColor: "from-emerald-500/10 to-teal-600/10",
      },
      {
        title: "Total Rooms",
        value: stats?.rooms?.total?.toString() ?? "0",
        icon: Home,
        color: "from-blue-500 to-cyan-600",
        bgColor: "from-blue-500/10 to-cyan-600/10",
      },
      {
        title: "Active Rooms",
        value: stats?.rooms?.active?.toString() ?? "0",
        icon: GraduationCap,
        color: "from-purple-500 to-violet-600",
        bgColor: "from-purple-500/10 to-violet-600/10",
      },
      {
        title: "Pending Queries",
        value: stats?.queries?.pending?.toString() ?? "0",
        icon: MessageSquare,
        color: "from-amber-500 to-yellow-600",
        bgColor: "from-amber-500/10 to-yellow-600/10",
      },
      {
        title: "Occupancy Rate",
        value: (stats?.rooms?.occupancyRate ?? 0).toFixed(1),
        suffix: "%",
        icon: TrendingUp,
        color: "from-emerald-500 to-teal-600",
        bgColor: "from-emerald-500/10 to-teal-600/10",
        showProgress: true,
        progressValue: stats?.rooms?.occupancyRate ?? 0,
      },
    ],
    [stats]
  );

  // Error state
  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <h3 className="text-xl font-semibold">
                Failed to load dashboard data
              </h3>
              <p className="text-muted-foreground">
                There was an error loading the dashboard statistics. Please try
                refreshing the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Overview of your hostel management system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "rounded-full p-2 bg-gradient-to-br",
                        card.bgColor
                      )}
                    >
                      <Icon className={cn("h-5 w-5", card.color)} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                  </div>

                  <h3 className="text-3xl font-bold tracking-tight">
                    {card.value}
                    {card.suffix || ""}
                  </h3>

                  {card.showProgress && (
                    <div className="space-y-2">
                      <Progress
                        value={card.progressValue}
                        className="h-2 bg-muted"
                        indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-600"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Room Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">
              Room Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Capacity</span>
                  <span className="font-medium">
                    {stats.rooms.totalCapacity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Occupied</span>
                  <span className="font-medium">{stats.rooms.occupied}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium text-emerald-400">
                    {stats.rooms.available}
                  </span>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">
                      {stats.rooms.occupancyRate}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                      style={{ width: `${stats.rooms.occupancyRate}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-medium">New Queries</span>
                    </div>
                    <p className="mt-3 text-2xl font-bold">
                      {stats.recentActivity.newQueries}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 7 days
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/50 bg-card p-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-emerald-400" />
                      <span className="text-sm font-medium">Resolved</span>
                    </div>
                    <p className="mt-3 text-2xl font-bold">
                      {stats.recentActivity.resolvedQueries}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last 7 days
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Resolution Rate
                    </span>
                    <span className="font-medium">
                      {stats.recentActivity.newQueries > 0
                        ? Math.round(
                            (stats.recentActivity.resolvedQueries /
                              stats.recentActivity.newQueries) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.recentActivity.newQueries > 0
                        ? (stats.recentActivity.resolvedQueries /
                            stats.recentActivity.newQueries) *
                          100
                        : 0
                    }
                    className="h-2 bg-muted"
                    indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-600"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Query Status */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Query Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.queries.pending}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    In Progress
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.queries.inProgress}
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card p-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Resolved
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.queries.resolved}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Resolution Progress
                  </span>
                  <span className="font-medium">
                    {stats.queries.total > 0
                      ? Math.round(
                          (stats.queries.resolved / stats.queries.total) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${
                        stats.queries.total > 0
                          ? (stats.queries.pending / stats.queries.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${
                        stats.queries.total > 0
                          ? (stats.queries.inProgress / stats.queries.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${
                        stats.queries.total > 0
                          ? (stats.queries.resolved / stats.queries.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mr-1"></div>
                    <span>Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-1"></div>
                    <span>Resolved</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
