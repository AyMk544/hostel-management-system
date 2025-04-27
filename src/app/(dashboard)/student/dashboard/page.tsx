"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  MessageSquare,
  Mail,
  Phone,
  BookOpen,
  IndianRupee,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/api-utils";

interface PaymentInfo {
  baseHostelFees?: number;
  roomTypeFees?: number;
  total: number;
  paid: number;
  dueDate: string;
  status: "pending" | "partial" | "paid";
}

interface StudentDashboard {
  name: string;
  email: string;
  rollNo: string;
  course: string;
  contactNo: string;
  roomNumber?: string;
  roomType?: string;
  hostelFees: PaymentInfo | null;
  messCharges: PaymentInfo | null;
  pendingQueries: number;
}

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await fetchWithAuth("/api/student/dashboard");

      setDashboard(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center justify-center p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Failed to load dashboard</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error || "An unexpected error occurred"}
        </p>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = [
    {
      title: "Room Number",
      value: dashboard.roomNumber || "Not Assigned",
      icon: Home,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-500/10 to-cyan-600/10",
    },
    {
      title: "Room Type",
      value: dashboard.roomType || "Not Assigned",
      icon: Home,
      color: "from-purple-500 to-violet-600",
      bgColor: "from-purple-500/10 to-violet-600/10",
    },
    {
      title: "Pending Queries",
      value: dashboard.pendingQueries,
      icon: MessageSquare,
      color: "from-amber-500 to-yellow-600",
      bgColor: "from-amber-500/10 to-yellow-600/10",
    },
  ];

  const getStatusBadgeVariant = (status: PaymentInfo["status"]) => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      case "pending":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {dashboard.name}! 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          Here's your hostel overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md hover:shadow-emerald-500/2 transition-all duration-200"
          >
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "rounded-full p-2 bg-gradient-to-br",
                      stat.bgColor
                    )}
                  >
                    <stat.icon
                      className={cn(
                        "size-10 text-gradient bg-gradient-to-br p-2 rounded-lg",
                        stat.color
                      )}
                    />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                </div>
                <h3 className="text-3xl font-bold tracking-tight">
                  {stat.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">
              Personal Information
            </CardTitle>
            <CardDescription>Your student details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-900/20 flex items-center justify-center mr-3">
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground w-24">
                Roll No:
              </span>
              <span>{dashboard.rollNo}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-900/20 flex items-center justify-center mr-3">
                <Mail className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground w-24">Email:</span>
              <span>{dashboard.email}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-900/20 flex items-center justify-center mr-3">
                <BookOpen className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground w-24">
                Course:
              </span>
              <span>{dashboard.course}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-900/20 flex items-center justify-center mr-3">
                <Phone className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-muted-foreground w-24">
                Contact:
              </span>
              <span>{dashboard.contactNo}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">
              Payment Information
            </CardTitle>
            <CardDescription>Hostel and mess fees details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.hostelFees ? (
              <div className="space-y-2 p-4 rounded-md bg-card/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-2 text-emerald-400" />
                    <span className="font-medium">Hostel Fees</span>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(dashboard.hostelFees.status)}
                  >
                    {dashboard.hostelFees.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-col space-y-1 text-sm mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Base Hostel Fees:
                    </span>
                    <span>
                      ₹
                      {dashboard.hostelFees.baseHostelFees?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {dashboard.roomType || "Not Assigned"} Room Fees:
                    </span>
                    <span>
                      ₹
                      {dashboard.hostelFees.roomTypeFees?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t border-border/40 mt-1">
                    <span>Total:</span>
                    <span>₹{dashboard.hostelFees.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid:</span>
                    <span>₹{dashboard.hostelFees.paid.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        Payment Progress
                      </span>
                      <span>
                        {Math.round(
                          (dashboard.hostelFees.paid /
                            dashboard.hostelFees.total) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (dashboard.hostelFees.paid /
                          dashboard.hostelFees.total) *
                        100
                      }
                      className="h-2"
                      indicatorClassName={
                        dashboard.hostelFees.status === "paid"
                          ? "bg-emerald-500"
                          : dashboard.hostelFees.status === "partial"
                          ? "bg-amber-500"
                          : "bg-destructive/50"
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-card/30 border border-border/40 text-center text-muted-foreground">
                No hostel fees information available
              </div>
            )}

            {dashboard.messCharges ? (
              <div className="space-y-2 p-4 rounded-md bg-card/30 border border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-2 text-emerald-400" />
                    <span className="font-medium">Mess Charges</span>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(
                      dashboard.messCharges.status
                    )}
                  >
                    {dashboard.messCharges.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex flex-col space-y-1 text-sm mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>₹{dashboard.messCharges.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid:</span>
                    <span>₹{dashboard.messCharges.paid.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">
                        Payment Progress
                      </span>
                      <span>
                        {Math.round(
                          (dashboard.messCharges.paid /
                            dashboard.messCharges.total) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (dashboard.messCharges.paid /
                          dashboard.messCharges.total) *
                        100
                      }
                      className="h-2"
                      indicatorClassName={
                        dashboard.messCharges.status === "paid"
                          ? "bg-emerald-500"
                          : dashboard.messCharges.status === "partial"
                          ? "bg-amber-500"
                          : "bg-destructive/50"
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-card/30 border border-border/40 text-center text-muted-foreground">
                No mess charges information available
              </div>
            )}

            {dashboard.hostelFees && (
              <div className="flex items-center mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center mr-3">
                  <Calendar className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Due Date</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(dashboard.hostelFees.dueDate)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
