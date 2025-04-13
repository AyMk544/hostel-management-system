"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Home,
  MessageSquare,
  LogOut,
  IndianRupee,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "Rooms",
    href: "/admin/rooms",
    icon: Home,
  },
  {
    title: "Fee Structure",
    href: "/admin/fees",
    icon: IndianRupee,
  },
  {
    title: "Queries",
    href: "/admin/queries",
    icon: MessageSquare,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 bg-gray-900 text-white lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b border-gray-800 px-4">
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {sidebarItems.map((item) => {
              const is_active = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 rounded-lg px-2 py-2 text-sm font-medium ${
                    is_active
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-800 p-4">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={() => signOut()}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <div className="container mx-auto py-6">{children}</div>
      </main>
    </div>
  );
} 