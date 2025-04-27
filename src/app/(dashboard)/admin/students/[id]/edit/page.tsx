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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Check, AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  occupiedSeats: number;
  block: string;
  type: "single" | "double" | "triple";
}

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
    status: "pending" | "partial" | "paid";
  };
  messFees: {
    id: string;
    amount: number;
    dueDate: string;
    paidAmount: number;
    status: "pending" | "partial" | "paid";
  };
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNo: z.string().min(1, "Roll number is required"),
  course: z.string().min(1, "Course is required"),
  contactNo: z.string().min(10, "Contact number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  roomId: z.string().nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function StudentManagementPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFees | null>(null);
  const [updatingHostel, setUpdatingHostel] = useState(false);
  const [updatingMess, setUpdatingMess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const roomId = watch("roomId");

  useEffect(() => {
    fetchStudentAndRooms();
    fetchFees();
  }, [params.id]);

  const fetchStudentAndRooms = async () => {
    try {
      // Fetch student details
      const studentResponse = await fetch(`/api/admin/students/${params.id}`);
      if (!studentResponse.ok) throw new Error("Failed to fetch student");
      const studentData = await studentResponse.json();

      // Format the date to YYYY-MM-DD for the input field
      const formattedData = {
        ...studentData,
        dateOfBirth: new Date(studentData.dateOfBirth)
          .toISOString()
          .split("T")[0],
      };

      // Set form data
      reset(formattedData);

      // Fetch available rooms
      const roomsResponse = await fetch("/api/admin/rooms");
      if (!roomsResponse.ok) throw new Error("Failed to fetch rooms");
      const roomsData = await roomsResponse.json();
      setAvailableRooms(roomsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load student data");
      setError(
        error instanceof Error ? error.message : "Failed to load student data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await fetch(`/api/admin/students/${params.id}/fees`);
      if (!response.ok) throw new Error("Failed to fetch fees");
      const data = await response.json();
      setStudentFees(data);
    } catch (error) {
      console.error("Error in fetchFees:", error);
      // Don't set error state here as we want to show the profile tab even if fees fail to load
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      // Only send the roomId in the update
      const response = await fetch(`/api/admin/students/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: data.roomId }),
      });

      if (!response.ok) throw new Error("Failed to update student");

      toast.success("Room assignment updated successfully");
      await fetchFees(); // Refresh fees data as room assignment affects fees
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStudent = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/students/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete student");

      toast.success("Student deleted successfully");
      router.push("/admin/students");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const payFullAmount = async (type: "hostel" | "mess") => {
    try {
      // Check if already paid or paying
      const currentFee =
        type === "hostel" ? studentFees?.hostelFees : studentFees?.messFees;

      if (currentFee?.status === "paid") {
        toast.info(
          `${type === "hostel" ? "Hostel" : "Mess"} fees already paid`
        );
        return;
      }

      if (type === "hostel") {
        setUpdatingHostel(true);
      } else {
        setUpdatingMess(true);
      }

      const amount =
        type === "hostel"
          ? studentFees?.hostelFees.amount || 0
          : studentFees?.messFees.amount || 0;

      const response = await fetch(`/api/admin/students/${params.id}/fees`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, paidAmount: amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update fees");
      }

      toast.success(
        `${type === "hostel" ? "Hostel" : "Mess"} fees paid successfully`
      );
      await fetchFees(); // Reload data after successful payment
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update fees"
      );
    } finally {
      if (type === "hostel") {
        setUpdatingHostel(false);
      } else {
        setUpdatingMess(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "partial":
        return "warning";
      default:
        return "destructive";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/students">
            <Button variant="outline" size="sm" className="h-9">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="flex items-center justify-center p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">Failed to load student</h3>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <Button onClick={fetchStudentAndRooms}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Link href="/admin/students">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-9">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Student
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                student account, profile, and all associated data including
                payment records and queries. The student will no longer be able
                to access the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteStudent}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{watch("name")}</h2>
        <p className="text-muted-foreground mt-1">
          Roll Number: {watch("rollNo")}
        </p>
      </div>

      <Tabs
        defaultValue="profile"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile & Room</TabsTrigger>
          <TabsTrigger value="fees">Fees Management</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">
                Student Profile
              </CardTitle>
              <CardDescription>
                Manage room assignment for this student. Other details can only
                be edited by the student.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="John Doe"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="john@example.com"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rollNo">Roll Number</Label>
                    <Input
                      id="rollNo"
                      {...register("rollNo")}
                      placeholder="12345"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      {...register("course")}
                      placeholder="B.Tech Computer Science"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNo">Contact Number</Label>
                    <Input
                      id="contactNo"
                      {...register("contactNo")}
                      placeholder="+91 9876543210"
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomId">Room Assignment</Label>
                    <Select
                      onValueChange={(value) =>
                        setValue("roomId", value === "none" ? null : value)
                      }
                      value={roomId?.toString() || "none"}
                    >
                      <SelectTrigger id="roomId">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Room Assigned</SelectItem>
                        {availableRooms.map((room) => (
                          <SelectItem
                            key={room.id}
                            value={room.id}
                            disabled={
                              room.occupiedSeats >= room.capacity &&
                              room.id !== roomId
                            }
                          >
                            Room {room.roomNumber} - Block {room.block} (
                            {room.occupiedSeats}/{room.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.roomId && (
                      <p className="text-destructive text-sm">
                        {errors.roomId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="123 Main St, City, State"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Room Assignment"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="mt-6">
          {!studentFees ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">
                Loading fees information...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold">
                        Hostel Fees
                      </CardTitle>
                      <Badge
                        variant={getStatusBadgeVariant(
                          studentFees.hostelFees.status
                        )}
                      >
                        {studentFees.hostelFees.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Due for {formatDate(studentFees.hostelFees.dueDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-muted-foreground">
                            Room Type:
                          </span>
                          <span>{studentFees.roomType || "Not Assigned"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Base Hostel Fee:
                          </span>
                          <span>
                            ₹
                            {studentFees.hostelFees.baseHostelFee?.toLocaleString() ||
                              0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Room Type Fee:
                          </span>
                          <span>
                            ₹
                            {studentFees.hostelFees.roomTypeFee?.toLocaleString() ||
                              0}
                          </span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-border/40">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-medium">
                            ₹{studentFees.hostelFees.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Paid Amount:
                          </span>
                          <span>
                            ₹
                            {studentFees.hostelFees.paidAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Payment Progress
                            </span>
                            <span>
                              {Math.round(
                                (studentFees.hostelFees.paidAmount /
                                  studentFees.hostelFees.amount) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (studentFees.hostelFees.paidAmount /
                                studentFees.hostelFees.amount) *
                              100
                            }
                            className="h-2"
                            indicatorClassName={
                              studentFees.hostelFees.status === "paid"
                                ? "bg-emerald-500"
                                : studentFees.hostelFees.status === "partial"
                                ? "bg-amber-500"
                                : "bg-destructive/50"
                            }
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        {studentFees.hostelFees.status === "paid" ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-950/20 py-2 rounded-md">
                            <Check className="h-5 w-5" />
                            <span>Fully Paid</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => payFullAmount("hostel")}
                            disabled={updatingHostel}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            {updatingHostel ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Pay Full Amount (₹
                            {studentFees.hostelFees.amount.toLocaleString()})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-semibold">
                        Mess Fees
                      </CardTitle>
                      <Badge
                        variant={getStatusBadgeVariant(
                          studentFees.messFees.status
                        )}
                      >
                        {studentFees.messFees.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      Due for {formatDate(studentFees.messFees.dueDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between mt-2">
                          <span className="font-medium">Total Amount:</span>
                          <span className="font-medium">
                            ₹{studentFees.messFees.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Paid Amount:
                          </span>
                          <span>
                            ₹{studentFees.messFees.paidAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              Payment Progress
                            </span>
                            <span>
                              {Math.round(
                                (studentFees.messFees.paidAmount /
                                  studentFees.messFees.amount) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (studentFees.messFees.paidAmount /
                                studentFees.messFees.amount) *
                              100
                            }
                            className="h-2"
                            indicatorClassName={
                              studentFees.messFees.status === "paid"
                                ? "bg-emerald-500"
                                : studentFees.messFees.status === "partial"
                                ? "bg-amber-500"
                                : "bg-destructive/50"
                            }
                          />
                        </div>
                      </div>
                      <div className="pt-2">
                        {studentFees.messFees.status === "paid" ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-950/20 py-2 rounded-md">
                            <Check className="h-5 w-5" />
                            <span>Fully Paid</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => payFullAmount("mess")}
                            disabled={updatingMess}
                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            {updatingMess ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Pay Full Amount (₹
                            {studentFees.messFees.amount.toLocaleString()})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-semibold">
                    Payment Summary
                  </CardTitle>
                  <CardDescription>
                    Overview of all fees for this semester
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Fees
                        </p>
                        <p className="text-2xl font-bold">
                          ₹
                          {(
                            studentFees.hostelFees.amount +
                            studentFees.messFees.amount
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total Paid
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">
                          ₹
                          {(
                            studentFees.hostelFees.paidAmount +
                            studentFees.messFees.paidAmount
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Balance Due
                        </p>
                        <p className="text-2xl font-bold text-amber-400">
                          ₹
                          {(
                            studentFees.hostelFees.amount +
                            studentFees.messFees.amount -
                            studentFees.hostelFees.paidAmount -
                            studentFees.messFees.paidAmount
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          Overall Payment Progress
                        </span>
                        <span>
                          {Math.round(
                            ((studentFees.hostelFees.paidAmount +
                              studentFees.messFees.paidAmount) /
                              (studentFees.hostelFees.amount +
                                studentFees.messFees.amount)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          ((studentFees.hostelFees.paidAmount +
                            studentFees.messFees.paidAmount) /
                            (studentFees.hostelFees.amount +
                              studentFees.messFees.amount)) *
                          100
                        }
                        className="h-2"
                        indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
