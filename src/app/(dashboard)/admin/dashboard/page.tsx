"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Home,
  GraduationCap,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/stats");
        const data = await response.json();
        setStats({
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
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats(defaultStats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: stats?.students?.total?.toString() ?? "0",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Total Rooms",
      value: stats?.rooms?.total?.toString() ?? "0",
      icon: Home,
      color: "bg-green-500",
    },
    {
      title: "Active Rooms",
      value: stats?.rooms?.active?.toString() ?? "0",
      icon: GraduationCap,
      color: "bg-purple-500",
    },
    {
      title: "Pending Queries",
      value: stats?.queries?.pending?.toString() ?? "0",
      icon: MessageSquare,
      color: "bg-yellow-500",
    },
    {
      title: "Occupancy Rate",
      value: (stats?.rooms?.occupancyRate ?? 0).toFixed(1),
      suffix: "%",
      icon: TrendingUp,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6 p-4 text-zinc-900">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your hostel management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-6 shadow-sm text-zinc-900"
            >
              <div className="flex items-center space-x-4">
                <div className={`rounded-full p-2 ${card.color} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${card.color} text-white`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold">
                    {isLoading ? "..." : card.value}
                    {card.suffix || ""}
                  </h3>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium">Recent Activity</h3>
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">New Queries (Last 7 days)</p>
              <p className="text-2xl font-bold">
                {isLoading ? "..." : stats?.recentActivity?.newQueries ?? 0}
              </p>
            </div>
            <div>
              <p className="font-medium">Resolved Queries (Last 7 days)</p>
              <p className="text-2xl font-bold">
                {isLoading
                  ? "..."
                  : stats?.recentActivity?.resolvedQueries ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
