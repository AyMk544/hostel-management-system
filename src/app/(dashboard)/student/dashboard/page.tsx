"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Home,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  BookOpen,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/api-utils";

interface PaymentInfo {
  baseHostelFees?: number;
  roomTypeFees?: number;
  total: number;
  paid: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid';
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
      setError(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              {error || "Failed to load dashboard. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Room Number",
      value: dashboard.roomNumber || "Not Assigned",
      icon: Home,
      color: "text-blue-500",
    },
    {
      title: "Pending Queries",
      value: dashboard.pendingQueries,
      icon: MessageSquare,
      color: "text-yellow-500",
    }
  ];

  const getStatusColor = (status: PaymentInfo['status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-500';
      case 'partial':
        return 'text-yellow-500';
      case 'pending':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 text-zinc-900">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back, {dashboard.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's your hostel overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your student details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-500 w-24">Roll No:</span>
              <span>{dashboard.rollNo}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-500 w-24">Email:</span>
              <span>{dashboard.email}</span>
            </div>
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-500 w-24">Course:</span>
              <span>{dashboard.course}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-500 w-24">Contact:</span>
              <span>{dashboard.contactNo}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Hostel and mess fees details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.hostelFees ? (
              <div className="space-y-2 p-3 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="font-medium">Hostel Fees</span>
                  </div>
                  <span className={getStatusColor(dashboard.hostelFees.status)}>
                    {dashboard.hostelFees.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col space-y-1 text-sm mt-2">
                  <div className="flex justify-between">
                    <span>Base Hostel Fees:</span>
                    <span>₹{dashboard.hostelFees.baseHostelFees?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{dashboard.roomType || 'Not Assigned'} Room Fees:</span>
                    <span>₹{dashboard.hostelFees.roomTypeFees?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-1 border-t mt-1">
                    <span>Total:</span>
                    <span>₹{dashboard.hostelFees.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>₹{dashboard.hostelFees.paid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-gray-50 text-center text-gray-500">
                No hostel fees information available
              </div>
            )}

            {dashboard.messCharges ? (
              <div className="space-y-2 p-3 rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-2 text-green-500" />
                    <span className="font-medium">Mess Charges</span>
                  </div>
                  <span className={getStatusColor(dashboard.messCharges.status)}>
                    {dashboard.messCharges.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col space-y-1 text-sm mt-2">
                  <div className="flex justify-between font-medium pt-1">
                    <span>Total:</span>
                    <span>₹{dashboard.messCharges.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid:</span>
                    <span>₹{dashboard.messCharges.paid.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md bg-gray-50 text-center text-gray-500">
                No mess charges information available
              </div>
            )}

            {dashboard.hostelFees && (
              <div className="flex items-center mt-4 p-2 rounded-md bg-red-50">
                <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-sm text-red-500">
                  Due Date: {formatDate(dashboard.hostelFees.dueDate)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 