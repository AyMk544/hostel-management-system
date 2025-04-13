import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Check route types
    const isAdminRoute = pathname.startsWith("/admin");
    const isStudentRoute = pathname.startsWith("/student");
    const isApiRoute = pathname.startsWith("/api");
    const isAdminApiRoute = pathname.startsWith("/api/admin");
    const isStudentApiRoute = pathname.startsWith("/api/student");

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
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/api/:path*"
  ],
};