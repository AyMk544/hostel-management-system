"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, AlertCircle, Check } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/api-utils";

interface StudentFees {
  id: string;
  name: string;
  rollNo: string;
  roomType: string;
  roomNumber: string | null;
  hostelFees: {
    id: string;
    amount: number;
    baseHostelFee?: number;
    roomTypeFee?: number;
    dueDate: string;
    paidAmount: number;
    status: 'pending' | 'partial' | 'paid';
  };
  messFees: {
    id: string;
    amount: number;
    dueDate: string;
    paidAmount: number;
    status: 'pending' | 'partial' | 'paid';
  };
}

export default function StudentFeesPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentFees, setStudentFees] = useState<StudentFees | null>(null);
  const [updatingHostel, setUpdatingHostel] = useState(false);
  const [updatingMess, setUpdatingMess] = useState(false);

  useEffect(() => {
    fetchFees();
  }, [params.id]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching fees for student:", params.id);
      const data = await fetchWithAuth(`/api/admin/students/${params.id}/fees`);
      console.log("Received data:", data);
      
      setStudentFees(data);
    } catch (error) {
      console.error("Error in fetchFees:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const payFullAmount = async (type: "hostel" | "mess") => {
    try {
      // Check if already paid or paying
      const currentFee = type === "hostel" ? studentFees?.hostelFees : studentFees?.messFees;
      
      if (currentFee?.status === 'paid') {
        toast.info(`${type === "hostel" ? "Hostel" : "Mess"} fees already paid`);
        return;
      }
      
      if (type === "hostel") {
        setUpdatingHostel(true);
      } else {
        setUpdatingMess(true);
      }
      
      const amount = type === "hostel" 
        ? studentFees?.hostelFees.amount || 0 
        : studentFees?.messFees.amount || 0;
      
      const response = await fetchWithAuth(`/api/admin/students/${params.id}/fees`, {
        method: "PUT",
        body: JSON.stringify({ type, paidAmount: amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update fees");
      }

      toast.success(`${type === "hostel" ? "Hostel" : "Mess"} fees paid successfully`);
      await fetchFees(); // Reload data after successful payment
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update fees");
    } finally {
      if (type === "hostel") {
        setUpdatingHostel(false);
      } else {
        setUpdatingMess(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  if (!studentFees) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "partial":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <div className="p-6 text-zinc-900">
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center text-sm text-zinc-900 hover:text-zinc-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">{studentFees.name}</h1>
        <p className="text-zinc-500">Roll Number: {studentFees.rollNo}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fee Management</h2>
          <p className="text-muted-foreground">
            Manage hostel and mess fees for {studentFees.name} ({studentFees.rollNo})
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hostel Fees</CardTitle>
              <CardDescription>
                Due for {formatDate(studentFees.hostelFees.dueDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Room Type:</span>
                    <span>{studentFees.roomType || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Base Hostel Fee:</span>
                    <span>₹{studentFees.hostelFees.baseHostelFee?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Room Type Fee:</span>
                    <span>₹{studentFees.hostelFees.roomTypeFee?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>₹{studentFees.hostelFees.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount:</span>
                    <span>₹{studentFees.hostelFees.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={getStatusColor(studentFees.hostelFees.status)}>
                      {studentFees.hostelFees.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  {studentFees.hostelFees.status === 'paid' ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span>Fully Paid</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => payFullAmount("hostel")}
                      disabled={updatingHostel}
                      className="w-full cursor-pointer"
                    >
                      {updatingHostel ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Pay Full Amount (₹{studentFees.hostelFees.amount.toLocaleString()})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mess Fees</CardTitle>
              <CardDescription>
                Due for {formatDate(studentFees.messFees.dueDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between mt-2">
                    <span>Total Amount:</span>
                    <span>₹{studentFees.messFees.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid Amount:</span>
                    <span>₹{studentFees.messFees.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={getStatusColor(studentFees.messFees.status)}>
                      {studentFees.messFees.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  {studentFees.messFees.status === 'paid' ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="h-5 w-5" />
                      <span>Fully Paid</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => payFullAmount("mess")}
                      disabled={updatingMess}
                      className="w-full cursor-pointer"
                    >
                      {updatingMess ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Pay Full Amount (₹{studentFees.messFees.amount.toLocaleString()})
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 