"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Save,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Course {
  id: string;
  name: string;
}

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNo: z.string().min(1, "Roll number is required"),
  courseId: z.string().min(1, "Course is required"),
  contactNo: z.string().min(10, "Contact number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "error" | null
  >(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [courseName, setCourseName] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Watch all form fields for changes
  const formValues = watch();

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        const response = await fetch("/api/courses");
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses", {
          description: "Please try refreshing the page.",
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        });
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Register courseId field
  useEffect(() => {
    register("courseId");
  }, [register]);

  // Update courseName when courseId changes
  useEffect(() => {
    if (formValues.courseId && courses.length > 0) {
      const selectedCourse = courses.find(
        (course) => course.id === formValues.courseId
      );
      if (selectedCourse) {
        setCourseName(selectedCourse.name);
      }
    }
  }, [formValues.courseId, courses]);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Add this effect to update courseName whenever courses load
  useEffect(() => {
    if (formValues.courseId && courses.length > 0) {
      const selectedCourse = courses.find(
        (course) => course.id === formValues.courseId
      );
      if (selectedCourse) {
        setCourseName(selectedCourse.name);
      }
    }
  }, [courses, formValues.courseId]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/student/profile");
      const data = await response.json();
      console.log("profile fetched data: ", data);

      // Set the courseId and update the form
      reset({
        name: data.name,
        email: data.email,
        rollNo: data.rollNo,
        courseId: data.courseId,
        contactNo: data.contactNo,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
      });

      console.log("Course id = ", data.courseId);

      // Store the course name for display
      if (data.courseName) {
        setCourseName(data.courseName);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile", {
        description: "Please try refreshing the page.",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  const onSubmit = async (data: ProfileFormData) => {
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

      console.log("Profile response: ", response);

      setSaveStatus("saved");
      toast.success("Changes saved successfully", {
        description: "Your profile information has been updated.",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveStatus("error");
      toast.error("Failed to save changes", {
        description: "Please try again later.",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
      });
    } finally {
      // Reset the save status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-emerald-400 animate-pulse">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          My Profile
        </h2>
        <p className="text-muted-foreground">
          View and update your personal information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-400" />
              <span>Profile Summary</span>
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 border-4 border-emerald-500/20">
              <AvatarImage
                src="/placeholder.svg?height=128&width=128"
                alt={formValues.name}
              />
              <AvatarFallback className="text-3xl bg-emerald-900/30 text-emerald-400">
                {formValues.name ? getInitials(formValues.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{formValues.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formValues.email}
              </p>
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Roll Number:</span>
                <span className="font-medium">{formValues.rollNo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">{courseName}</span>
              </div>
              <Separator className="my-2 bg-gray-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  <Badge
                    variant="outline"
                    className="bg-emerald-900/20 text-emerald-400 border-emerald-800"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 border-gray-800 bg-gray-950 hover:bg-gray-900 gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Profile</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {saveStatus === "saving" && (
                <div className="flex items-center text-amber-400">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">Failed to save</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="John Doe"
                    className="bg-gray-950 border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john@example.com"
                    disabled
                    className="bg-gray-900 border-gray-800 text-gray-500"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rollNo" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span>Roll Number</span>
                  </Label>
                  <Input
                    id="rollNo"
                    {...register("rollNo")}
                    placeholder="12345"
                    disabled
                    className="bg-gray-900 border-gray-800 text-gray-500"
                  />
                  {errors.rollNo && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.rollNo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseId" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-emerald-400" />
                    <span>Course</span>
                  </Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                    <Select
                      value={formValues.courseId}
                      onValueChange={(value) => {
                        setValue("courseId", value, { shouldDirty: true });
                        const selectedCourse = courses.find(
                          (course) => course.id === value
                        );
                        if (selectedCourse) {
                          setCourseName(selectedCourse.name);
                        }
                      }}
                      disabled={isLoadingCourses}
                    >
                      <SelectTrigger className="pl-9 bg-gray-950 border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20">
                        <SelectValue
                          placeholder={
                            isLoadingCourses
                              ? "Loading courses..."
                              : "Select your course"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-800">
                        {isLoadingCourses ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading courses...</span>
                          </div>
                        ) : courses.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No courses available
                          </div>
                        ) : (
                          courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.courseId && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.courseId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="contactNo"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-emerald-400" />
                    <span>Contact Number</span>
                  </Label>
                  <Input
                    id="contactNo"
                    {...register("contactNo")}
                    placeholder="+91 9876543210"
                    className="bg-gray-950 border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  {errors.contactNo && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.contactNo.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="dateOfBirth"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span>Date of Birth</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                    className="bg-gray-950 border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>Address</span>
                  </Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="123 Main St, City, State"
                    className="bg-gray-950 border-gray-800 focus:border-emerald-500 focus:ring-emerald-500/20 min-h-[100px]"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-0 gap-2"
                  disabled={!isDirty || saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
