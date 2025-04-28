"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  User,
  Mail,
  Lock,
  AlertCircle,
  BookOpen,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  Info,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

// Updated schema to use courseId instead of course
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    rollNo: z.string(),
    courseId: z.string().min(1, "Please select a course"),
    contactNo: z.string().regex(/^\d{10}$/, "Invalid contact number"),
    dateOfBirth: z.string().refine((date) => {
      const dob = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return age >= 16 && age <= 30;
    }, "Age must be between 16 and 30 years"),
    address: z.string().min(10, "Address must be at least 10 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// Interface for course data
interface Course {
  id: string;
  name: string;
}

// Registration stats (dummy data)
const registrationStats = {
  totalStudents: 1250,
  registeredToday: 15,
  verificationRate: 92,
  averageAge: 21,
};

// Optimized component for the registration form
const RegisterForm = React.memo(
  ({
    onSubmit,
    isLoading,
    error,
  }: {
    onSubmit: (data: RegisterForm) => Promise<void>;
    isLoading: boolean;
    error: string | null;
  }) => {
    const [courses, setCourses] = React.useState<Course[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = React.useState(true);
    const [courseError, setCourseError] = React.useState<string | null>(null);

    const {
      register,
      handleSubmit,
      setValue,
      watch,
      formState: { errors, dirtyFields },
    } = useForm<RegisterForm>({
      resolver: zodResolver(registerSchema),
    });

    // Register the courseId field for react-hook-form
    React.useEffect(() => {
      register("courseId");
    }, [register]);

    // Fetch courses from API
    React.useEffect(() => {
      const fetchCourses = async () => {
        try {
          setIsLoadingCourses(true);
          setCourseError(null);

          const response = await fetch("/api/courses");

          console.log(response);
          if (!response.ok) {
            throw new Error("Failed to fetch courses");
          }

          const data = await response.json();

          const mockCourses: Course[] = [
            { id: "1", name: "B.Tech Computer Science" },
            { id: "2", name: "B.Tech Electronics" },
            { id: "3", name: "B.Tech Mechanical" },
            { id: "4", name: "B.Tech Civil" },
            { id: "5", name: "M.Tech Computer Science" },
            { id: "6", name: "M.Tech Electronics" },
            { id: "7", name: "MBA" },
            { id: "8", name: "BBA" },
          ];

          setCourses(data);
        } catch (error) {
          console.error("Failed to fetch courses:", error);
          setCourseError("Failed to load courses. Please try again.");
        } finally {
          setIsLoadingCourses(false);
        }
      };

      fetchCourses();
    }, []);

    // Calculate form completion percentage
    const totalFields = Object.keys(registerSchema._def.schema.shape).length;
    const completedFields = Object.keys(dirtyFields).length;
    const completionPercentage = Math.round(
      (completedFields / totalFields) * 100
    );

    // Form field groups for better organization
    const formFields = [
      {
        title: "Personal Information",
        fields: [
          {
            name: "name",
            label: "Full Name",
            type: "text",
            placeholder: "John Doe",
            icon: User,
            component: "input",
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "name@example.com",
            icon: Mail,
            component: "input",
          },
          {
            name: "dateOfBirth",
            label: "Date of Birth",
            type: "date",
            placeholder: "",
            icon: Calendar,
            component: "input",
          },
        ],
      },
      {
        title: "Academic Information",
        fields: [
          {
            name: "rollNo",
            label: "Roll Number",
            type: "text",
            placeholder: "IIB2023001",
            icon: BookOpen,
            component: "input",
          },
          {
            name: "courseId",
            label: "Course",
            type: "select",
            placeholder: "Select your course",
            icon: BookOpen,
            component: "select",
          },
        ],
      },
      {
        title: "Contact Information",
        fields: [
          {
            name: "contactNo",
            label: "Contact Number",
            type: "text",
            placeholder: "1234567890",
            icon: Phone,
            component: "input",
          },
          {
            name: "address",
            label: "Address",
            type: "text",
            placeholder: "Enter your full address",
            icon: MapPin,
            component: "input",
          },
        ],
      },
      {
        title: "Security",
        fields: [
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "",
            icon: Lock,
            component: "input",
          },
          {
            name: "confirmPassword",
            label: "Confirm Password",
            type: "password",
            placeholder: "",
            icon: CheckCircle,
            component: "input",
          },
        ],
      },
    ];

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Form completion
            </span>
            <span className="text-sm font-medium">{completionPercentage}%</span>
          </div>
          <Progress
            value={completionPercentage}
            className="h-2 bg-gray-800"
            indicatorClassName="bg-gradient-to-r from-emerald-600 to-teal-600"
          />
        </div>

        {formFields.map((group) => (
          <div key={group.title} className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-emerald-400">
                {group.title}
              </h3>
              <Separator className="flex-1 bg-gray-800" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.name} className="space-y-2 sm:col-span-1">
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label}
                    </Label>

                    {field.component === "input" ? (
                      <div className="relative">
                        <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={field.name}
                          placeholder={field.placeholder}
                          type={field.type}
                          autoCapitalize="none"
                          autoCorrect="off"
                          disabled={isLoading}
                          className="pl-9 bg-gray-950 border-gray-800 focus:border-emerald-800 focus:ring-emerald-500/20"
                          {...register(field.name as keyof RegisterForm)}
                        />
                      </div>
                    ) : field.name === "courseId" ? (
                      <div className="relative">
                        <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                        <Select
                          disabled={isLoading || isLoadingCourses}
                          onValueChange={(value) =>
                            setValue("courseId", value, { shouldDirty: true })
                          }
                        >
                          <SelectTrigger className="pl-9 bg-gray-950 border-gray-800 focus:border-emerald-800 focus:ring-emerald-500/20">
                            <SelectValue
                              placeholder={
                                isLoadingCourses
                                  ? "Loading courses..."
                                  : "Select your course"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-950 border-gray-800">
                            {courseError ? (
                              <div className="p-2 text-sm text-red-400">
                                {courseError}
                              </div>
                            ) : isLoadingCourses ? (
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
                    ) : null}

                    {errors[field.name as keyof RegisterForm] && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors[field.name as keyof RegisterForm]?.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {error && (
          <Alert
            variant="destructive"
            className="bg-red-900/20 text-red-400 border-red-900"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading || isLoadingCourses}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
    );
  }
);
RegisterForm.displayName = "RegisterForm";

// Optimized component for the registration info card
const RegistrationInfoCard = React.memo(() => (
  <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg overflow-hidden">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <Info className="h-4 w-4 text-emerald-400" />
        <span>Registration Information</span>
      </CardTitle>
      <CardDescription>Current registration statistics</CardDescription>
    </CardHeader>
    <CardContent className="pb-2">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Students:</span>
          <span className="font-medium">
            {registrationStats.totalStudents.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Registered Today:</span>
          <span className="font-medium">
            {registrationStats.registeredToday} students
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Verification Rate:</span>
          <span className="font-medium text-emerald-400">
            {registrationStats.verificationRate}%
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Average Age:</span>
          <span className="font-medium">
            {registrationStats.averageAge} years
          </span>
        </div>
      </div>
    </CardContent>
    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
  </Card>
));
RegistrationInfoCard.displayName = "RegistrationInfoCard";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Memoized onSubmit function to prevent unnecessary re-renders
  const onSubmit = React.useCallback(
    async (data: RegisterForm) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        console.log("register result = ", result);

        if (!response.ok) {
          throw new Error(result.message);
        }

        // Check if we have a redirect URL in the response
        if (result.redirect) {
          router.push(result.redirect); // Redirect to verify-request page
        } else {
          // Fallback to login page with success message
          router.push("/login?registered=true");
        }
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An error occurred during registration");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-gray-900 p-4 sm:p-8">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-900/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-900/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
      </div>

      <div className="w-full max-w-6xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2">
            Hostel Management System
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Create your account to access the hostel management portal. Fill in
            your details to get started.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {/* Left column - Registration form */}
          <Card className="md:col-span-3 bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Create an account
              </CardTitle>
              <CardDescription>
                Enter your details to register for hostel accommodation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t border-gray-800 bg-gray-950/50">
              <div className="text-center text-sm w-full">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Sign in
                </Link>
              </div>
              <div className="text-center text-xs text-muted-foreground w-full">
                By registering, you agree to our{" "}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-emerald-400"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="underline underline-offset-4 hover:text-emerald-400"
                >
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Right column - Info cards */}
          <div className="md:col-span-1 space-y-6">
            {/* <RegistrationInfoCard /> */}

            <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span>Registration Guide</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium">Required Documents</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                      <li>Valid student ID card</li>
                      <li>Proof of enrollment</li>
                      <li>Address proof</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Next Steps</h4>
                    <p className="text-muted-foreground">
                      After registration, you'll receive a verification email.
                      Follow the link to verify your account.
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href="/login">
                      <Button
                        variant="outline"
                        className="w-full gap-2 border-gray-800 bg-gray-950 hover:bg-gray-900 hover:text-emerald-400"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back to Login</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Hostel Management System. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
