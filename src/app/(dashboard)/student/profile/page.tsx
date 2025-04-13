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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface StudentProfile {
  name: string;
  email: string;
  rollNo: string;
  course: string;
  contactNo: string;
  dateOfBirth: string;
  address: string;
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNo: z.string().min(1, "Roll number is required"),
  course: z.string().min(1, "Course is required"),
  contactNo: z.string().min(10, "Contact number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Watch all form fields for changes
  const formValues = watch();

  // Debounced save function
  const debouncedSave = useDebouncedCallback(async (data: ProfileFormData) => {
    if (!isDirty) return;
    
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/student/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSaveStatus("saved");
        toast.success("Changes saved", { duration: 2000 });
      } else {
        setSaveStatus("error");
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveStatus("error");
      toast.error("Failed to save changes");
    }
  }, 1000); // 1 second delay

  // Auto-save when form values change
  useEffect(() => {
    if (isDirty) {
      const validationResult = profileSchema.safeParse(formValues);
      if (validationResult.success) {
        debouncedSave(formValues);
      }
    }
  }, [formValues, isDirty, debouncedSave]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/student/profile");
      const data = await response.json();
      reset(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-zinc-900">My Profile</CardTitle>
            <CardDescription className="text-zinc-100">
              Update your personal information here.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {saveStatus === "saving" && (
              <div className="flex items-center text-zinc-100">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
            {saveStatus === "saved" && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="text-sm">Saved</span>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="text-sm text-red-500">
                Failed to save
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-900">Full Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="John Doe"
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-900">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="john@example.com"
                  disabled
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rollNo" className="text-zinc-900">Roll Number</Label>
                <Input
                  id="rollNo"
                  {...register("rollNo")}
                  placeholder="12345"
                  disabled
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.rollNo && (
                  <p className="text-sm text-red-500">{errors.rollNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="course" className="text-zinc-900">Course</Label>
                <Input
                  id="course"
                  {...register("course")}
                  placeholder="B.Tech Computer Science"
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.course && (
                  <p className="text-sm text-red-500">{errors.course.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNo" className="text-zinc-900">Contact Number</Label>
                <Input
                  id="contactNo"
                  {...register("contactNo")}
                  placeholder="+91 9876543210"
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.contactNo && (
                  <p className="text-sm text-red-500">{errors.contactNo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="text-zinc-900">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-zinc-900">Address</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="123 Main St, City, State"
                  className="bg-white text-zinc-900 border-zinc-200"
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 