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

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  rollNo: z.string().regex(/^[A-Z]{3}\d{7}$/, "Invalid roll number format (e.g., IIB2023001)"),
  course: z.string().min(2, "Course name is required"),
  contactNo: z.string().regex(/^\d{10}$/, "Invalid contact number"),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    return age >= 16 && age <= 30;
  }, "Age must be between 16 and 30 years"),
  address: z.string().min(10, "Address must be at least 10 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      router.push("/login?registered=true");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to register
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  disabled={isLoading}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="rollNo">Roll Number</Label>
                <Input
                  id="rollNo"
                  placeholder="IIB2023001"
                  disabled={isLoading}
                  {...register("rollNo")}
                />
                {errors.rollNo && (
                  <p className="text-sm text-red-500">{errors.rollNo.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  placeholder="B.Tech Computer Science"
                  disabled={isLoading}
                  {...register("course")}
                />
                {errors.course && (
                  <p className="text-sm text-red-500">{errors.course.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactNo">Contact Number</Label>
                <Input
                  id="contactNo"
                  placeholder="1234567890"
                  disabled={isLoading}
                  {...register("contactNo")}
                />
                {errors.contactNo && (
                  <p className="text-sm text-red-500">{errors.contactNo.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  disabled={isLoading}
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter your full address"
                  disabled={isLoading}
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center">{error}</div>
              )}

              <Button disabled={isLoading}>
                {isLoading && (
                  <div className="mr-2 h-4 w-4 animate-spin" />
                )}
                Register
              </Button>
            </div>
          </form>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 