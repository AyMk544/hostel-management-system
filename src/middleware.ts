import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Define public routes
    const isPublicRoute1 = pathname === "/api/register";
    const isPublicRoute2 = pathname === "/api/courses";

    // Skip middleware for public routes
    if (isPublicRoute1 || isPublicRoute2) {
      return NextResponse.next();
    }

    // Check route types
    const isAdminRoute = pathname.startsWith("/admin");
    const isStudentRoute = pathname.startsWith("/student");
    const isApiRoute = pathname.startsWith("/api");
    const isAdminApiRoute = pathname.startsWith("/api/admin");
    const isStudentApiRoute = pathname.startsWith("/api/student");

    // Check if email is verified
    const isEmailVerified =
      token?.emailVerified !== null && token?.emailVerified !== undefined;

    // If email is not verified, restrict access to protected routes
    if (!isEmailVerified && (isAdminRoute || isStudentRoute || isApiRoute)) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: "Email verification required" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/register", req.url));
    }

    // Admin routes require admin role
    if (isAdminRoute || isAdminApiRoute) {
      if (token?.role !== "admin") {
        if (isApiRoute) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Student routes require authentication
    if (isStudentRoute || isStudentApiRoute) {
      if (!token) {
        if (isApiRoute) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // General API routes require authentication
    if (isApiRoute && !isAdminApiRoute && !isStudentApiRoute) {
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow the middleware to proceed to our handler
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/api/:path*"],
};
