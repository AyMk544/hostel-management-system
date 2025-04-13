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
import { ArrowLeft, Loader2, IndianRupee } from "lucide-react";
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

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  occupiedSeats: number;
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

export default function EditStudentPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

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
        dateOfBirth: new Date(studentData.dateOfBirth).toISOString().split('T')[0]
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
    } finally {
      setIsLoading(false);
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
      router.push("/admin/students");
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-zinc-900">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/students" className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Link>
        <Link href={`/admin/students/${params.id}/fees`} className="flex items-center gap-2 text-sm bg-blue-100 px-3 py-2 rounded-md hover:bg-blue-200 text-blue-600">
          <IndianRupee className="h-4 w-4" />
          Manage Fees
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Student</CardTitle>
          <CardDescription>
            Manage room assignment for this student. Other details can only be edited by the student.
            For payment management, use the "Manage Fees" button above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="John Doe"
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
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
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll Number</Label>
                <Input
                  id="rollNo"
                  {...register("rollNo")}
                  placeholder="12345"
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  {...register("course")}
                  placeholder="B.Tech Computer Science"
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input
                  id="contactNo"
                  {...register("contactNo")}
                  placeholder="+91 9876543210"
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomId">Room Assignment</Label>
                <Select
                  onValueChange={(value) => setValue("roomId", value === "none" ? null : value)}
                  value={roomId?.toString() || "none"}
                >
                  <SelectTrigger className="bg-white text-zinc-900 border-zinc-200">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none" className="text-zinc-900">No Room Assigned</SelectItem>
                    {availableRooms.map((room) => (
                      <SelectItem
                        key={room.id}
                        value={room.id}
                        disabled={room.occupiedSeats >= room.capacity}
                        className="text-zinc-900"
                      >
                        Room {room.roomNumber} ({room.occupiedSeats || 0}/{room.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="123 Main St, City, State"
                  className="bg-gray-50 text-zinc-900 border-zinc-200"
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-between space-x-4 mt-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Delete Student
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the student account,
                      profile, and all associated data including payment records and queries.
                      The student will no longer be able to access the system.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteStudent} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex ml-auto space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/students")}
                  className="text-zinc-100"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Room Assignment
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 