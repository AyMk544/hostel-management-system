"use client";

import { useEffect, useState } from "react";
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
import { Eye, PencilIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  course: string;
  contactNumber: string;
  roomNumber: string | null;
  hostelFeeStatus?: 'pending' | 'partial' | 'paid';
  messFeeStatus?: 'pending' | 'partial' | 'paid';
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    withRoom: 0,
    withoutRoom: 0
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/admin/students");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();
      setStudents(data);
      
      // Calculate stats
      const total = data.length;
      const withRoom = data.filter((s: Student) => s.roomNumber).length;
      setStats({
        total,
        withRoom,
        withoutRoom: total - withRoom
      });
      
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    (student.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (student.rollNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (student.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "partial":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 text-zinc-900">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withRoom}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Without Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withoutRoom}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center text-zinc-100">
        <Input
          placeholder="Search students..."
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
                <TableHead>Name</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Hostel Fee</TableHead>
                <TableHead>Mess Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.course}</TableCell>
                  <TableCell>{student.roomNumber || "Not Assigned"}</TableCell>
                  <TableCell>
                    <span className={getStatusColor(student.hostelFeeStatus || 'pending')}>
                      {student.hostelFeeStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={getStatusColor(student.messFeeStatus || 'pending')}>
                      {student.messFeeStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/students/${student.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/students/${student.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <PencilIcon className="h-4 w-4" />
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