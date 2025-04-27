"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
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
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  ShieldCheck,
  Info,
  ArrowRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

// Stats for the login page (dummy data)
const loginStats = {
  totalUsers: 1250,
  activeToday: 78,
  securityLevel: "High",
  lastUpdated: "2 hours ago",
};

// Optimized component for the login form
const LoginForm = React.memo(
  ({
    onSubmit,
    isLoading,
    error,
  }: {
    onSubmit: (data: LoginForm) => Promise<void>;
    isLoading: boolean;
    error: string | null;
  }) => {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm<LoginForm>({
      resolver: zodResolver(loginSchema),
    });

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              className="pl-9 bg-gray-950 border-gray-800 focus:border-emerald-800 focus:ring-emerald-500/20"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              className="pl-9 bg-gray-950 border-gray-800 focus:border-emerald-800 focus:ring-emerald-500/20"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

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
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    );
  }
);
LoginForm.displayName = "LoginForm";

// Optimized component for the security info card
const SecurityInfoCard = React.memo(() => (
  <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg overflow-hidden">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Security Information</span>
      </CardTitle>
      <CardDescription>System status and security</CardDescription>
    </CardHeader>
    <CardContent className="pb-2">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Security Level:</span>
          <span className="font-medium text-emerald-400">
            {loginStats.securityLevel}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Total Users:</span>
          <span className="font-medium">
            {loginStats.totalUsers.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Active Today:</span>
          <span className="font-medium">{loginStats.activeToday} users</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Last Updated:</span>
          <span className="font-medium">{loginStats.lastUpdated}</span>
        </div>
      </div>
    </CardContent>
    <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
  </Card>
));
SecurityInfoCard.displayName = "SecurityInfoCard";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Memoized onSubmit function to prevent unnecessary re-renders
  const onSubmit = React.useCallback(
    async (data: LoginForm) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
          return;
        }

        router.refresh();
        router.push("/");
      } catch (error) {
        setError("An error occurred. Please try again.");
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

      <div className="w-full max-w-5xl z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-2">
            Hostel Management System
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Secure access to the hostel management portal. Sign in with your
            credentials to continue.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Left column - Login form */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Welcome back
              </CardTitle>
              <CardDescription>
                Enter your credentials to sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm
                onSubmit={onSubmit}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 border-t border-gray-800 bg-gray-950/50">
              <div className="text-center text-sm w-full">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Register
                </Link>
              </div>
              <div className="text-center text-xs text-muted-foreground w-full">
                By signing in, you agree to our{" "}
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
