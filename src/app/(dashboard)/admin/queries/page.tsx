"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Query {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  adminResponse: string | null;
  createdAt: string;
  studentName: string;
  studentRollNo: string;
}

export default function QueriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await fetch("/api/admin/queries");
      if (!response.ok) throw new Error("Failed to fetch queries");
      const data = await response.json();
      setQueries(data);
      
      // Calculate stats
      const total = data.length;
      const pending = data.filter((q: Query) => q.status === "pending").length;
      const inProgress = data.filter((q: Query) => q.status === "in_progress").length;
      const resolved = data.filter((q: Query) => q.status === "resolved").length;
      
      setStats({
        total,
        pending,
        inProgress,
        resolved
      });
      
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter(query => 
    query.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    query.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    query.studentRollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Query["status"]) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "in_progress":
        return "text-blue-500";
      case "resolved":
        return "text-green-500";
      default:
        return "";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 text-zinc-900">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center text-zinc-100">
        <Input
          placeholder="Search queries..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueries.map((query) => (
                <TableRow key={query.id}>
                  <TableCell className="font-medium">{query.title}</TableCell>
                  <TableCell>{query.studentName}</TableCell>
                  <TableCell>{query.studentRollNo}</TableCell>
                  <TableCell>
                    <span className={`capitalize ${getStatusColor(query.status)}`}>
                      {query.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(query.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/queries/${query.id}`}>
                      <Button variant="ghost" size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 