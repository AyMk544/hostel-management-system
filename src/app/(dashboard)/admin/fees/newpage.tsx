"use client";

import type React from "react";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  Trash2,
  IndianRupee,
  Calendar,
  Home,
  Users,
  TrendingUp,
  ArrowUpRight,
  Info,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-select";
import { fetchWithAuth } from "@/lib/api-utils";

interface FeeStructure {
  id: string;
  year: number;
  semester: "JUL-DEC" | "JAN-MAY";
  hostelFees: string;
  messFees: string;
  singleRoomFees: string;
  doubleRoomFees: string;
  tripleRoomFees: string;
  dueDate?: string;
}

export default function FeesPage() {
  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedSemester, setSelectedSemester] = useState<
    "JUL-DEC" | "JAN-MAY"
  >("JUL-DEC");
  const [isUpdating, setIsUpdating] = useState(false);
  const [existingFeeId, setExistingFeeId] = useState<string | null>(null);
  const [hostelFees, setHostelFees] = useState("");
  const [messFees, setMessFees] = useState("");
  const [singleRoomFees, setSingleRoomFees] = useState("");
  const [doubleRoomFees, setDoubleRoomFees] = useState("");
  const [tripleRoomFees, setTripleRoomFees] = useState("");
  const [dueDate, setDueDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Memoized stats to prevent unnecessary recalculations
  const stats = useMemo(() => {
    if (feeStructures.length === 0) return null;

    // Calculate average fees
    const avgHostelFees =
      feeStructures.reduce(
        (sum, fee) => sum + Number.parseFloat(fee.hostelFees),
        0
      ) / feeStructures.length;
    const avgMessFees =
      feeStructures.reduce(
        (sum, fee) => sum + Number.parseFloat(fee.messFees),
        0
      ) / feeStructures.length;

    // Find latest fee structure
    const latestFee = [...feeStructures].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return a.semester === "JUL-DEC" ? -1 : 1;
    })[0];

    // Calculate total fees for different room types
    const singleRoomTotal =
      Number.parseFloat(latestFee.hostelFees) +
      Number.parseFloat(latestFee.messFees) +
      Number.parseFloat(latestFee.singleRoomFees);
    const doubleRoomTotal =
      Number.parseFloat(latestFee.hostelFees) +
      Number.parseFloat(latestFee.messFees) +
      Number.parseFloat(latestFee.doubleRoomFees);
    const tripleRoomTotal =
      Number.parseFloat(latestFee.hostelFees) +
      Number.parseFloat(latestFee.messFees) +
      Number.parseFloat(latestFee.tripleRoomFees);

    // Calculate percentage increase from previous year if available
    let percentageIncrease = 0;
    const previousYearFee = feeStructures.find(
      (fee) =>
        fee.year === latestFee.year - 1 && fee.semester === latestFee.semester
    );

    if (previousYearFee) {
      const prevTotal =
        Number.parseFloat(previousYearFee.hostelFees) +
        Number.parseFloat(previousYearFee.messFees);
      const currentTotal =
        Number.parseFloat(latestFee.hostelFees) +
        Number.parseFloat(latestFee.messFees);
      percentageIncrease = ((currentTotal - prevTotal) / prevTotal) * 100;
    }

    return {
      avgHostelFees,
      avgMessFees,
      latestFee,
      singleRoomTotal,
      doubleRoomTotal,
      tripleRoomTotal,
      percentageIncrease,
      upcomingDueDate: latestFee.dueDate ? new Date(latestFee.dueDate) : null,
    };
  }, [feeStructures]);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    // Find and set existing fees when year or semester changes
    const existingFee = feeStructures.find(
      (fee) => fee.year === selectedYear && fee.semester === selectedSemester
    );
    if (existingFee) {
      setIsUpdating(true);
      setExistingFeeId(existingFee.id);
      setHostelFees(existingFee.hostelFees);
      setMessFees(existingFee.messFees);
      setSingleRoomFees(existingFee.singleRoomFees || "");
      setDoubleRoomFees(existingFee.doubleRoomFees || "");
      setTripleRoomFees(existingFee.tripleRoomFees || "");

      if (existingFee.dueDate) {
        const existingDueDate = new Date(existingFee.dueDate);
        const minDueDate = new Date();
        minDueDate.setDate(minDueDate.getDate() + 10);

        if (existingDueDate < minDueDate) {
          setDueDate(getMinDueDate());
        } else {
          setDueDate(existingFee.dueDate);
        }
      } else {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        setDueDate(date.toISOString().split("T")[0]);
      }
    } else {
      setIsUpdating(false);
      setExistingFeeId(null);
      setHostelFees("");
      setMessFees("");
      setSingleRoomFees("");
      setDoubleRoomFees("");
      setTripleRoomFees("");

      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [selectedYear, selectedSemester, feeStructures]);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithAuth("/api/admin/fees");
      setFeeStructures(data);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHostelFees("");
    setMessFees("");
    setSingleRoomFees("");
    setDoubleRoomFees("");
    setTripleRoomFees("");
    setDueDate("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("handle submit");

    if (
      !selectedYear ||
      !selectedSemester ||
      !hostelFees ||
      !messFees ||
      !singleRoomFees ||
      !doubleRoomFees ||
      !tripleRoomFees
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Validate due date is at least 10 days from now
    const currentDate = new Date();
    const selectedDueDate = new Date(dueDate);
    const minDueDate = new Date();
    minDueDate.setDate(currentDate.getDate() + 10);
    if (selectedDueDate < minDueDate) {
      toast.error("Due date must be at least 10 days from the current date");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        year: selectedYear,
        semester: selectedSemester,
        hostelFees: parseFloat(hostelFees),
        messFees: parseFloat(messFees),
        singleRoomFees: parseFloat(singleRoomFees),
        doubleRoomFees: parseFloat(doubleRoomFees),
        tripleRoomFees: parseFloat(tripleRoomFees),
        dueDate,
      };

      let response: Response;
      console.log("before deciding");
      if (isUpdating && existingFeeId) {
        console.log("updating");
        response = await fetch(`/api/admin/fees?id=${existingFeeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...payload, id: existingFeeId }),
        });
      } else {
        console.log("creating");
        response = await fetch("/api/admin/fees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();
      console.log("Data after creating fee structure = ", data);
      if (!response.ok) {
        if (response.status === 409) {
          toast.error(
            data.message ||
              "A fee structure for this year and semester already exists"
          );
        } else if (response.status === 400) {
          toast.error(data.error || "Invalid data provided");
          console.error("Validation error details:", data.details);
        } else {
          toast.error(data.error || "Failed to save fee structure");
        }
        return;
      }

      toast.success(
        isUpdating
          ? "Fee structure updated successfully"
          : "Fee structure created successfully"
      );

      resetForm();
      await fetchFeeStructures(); // Refresh the list from server
    } catch (error) {
      console.error("Error saving fee structure:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setError("Failed to save fee structure. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (feeId: string) => {
    setFeeToDelete(feeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!feeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetchWithAuth(
        `/api/admin/fees?id=${feeToDelete}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        const msg = data.error || "Failed to delete fee structure";
        throw new Error(msg);
      }

      toast.success("Fee structure deleted successfully");
      setDeleteDialogOpen(false);
      await fetchFeeStructures();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete fee structure"
      );
    } finally {
      setDeleting(false);
    }
  };

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() + i
  );

  const getMinDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date.toISOString().split("T")[0];
  };

  // Calculate days until next due date
  const getDaysUntilDueDate = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-emerald-400 animate-pulse">
            Loading fee structures...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          Fee Structure Management
        </h2>
        <p className="text-muted-foreground">
          Configure and manage hostel and mess fees for different semesters
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-400"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="data-[state=active]:bg-emerald-900/30 data-[state=active]:text-emerald-400"
          >
            Manage Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Latest Fee Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">
                          {stats.latestFee.year} ({stats.latestFee.semester})
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated recently
                        </span>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Hostel Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">
                          ₹
                          {stats.avgHostelFees.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Per semester
                        </span>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center">
                        <Home className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Mess Fees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">
                          ₹
                          {stats.avgMessFees.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Per semester
                        </span>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-900/30 flex items-center justify-center">
                        <IndianRupee className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-400" />
                      <span>Room Type Comparison</span>
                    </CardTitle>
                    <CardDescription>
                      Total fees by room type for {stats.latestFee.year} (
                      {stats.latestFee.semester})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Single Room
                          </span>
                          <span className="text-sm font-medium">
                            ₹{stats.singleRoomTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Double Room
                          </span>
                          <span className="text-sm font-medium">
                            ₹{stats.doubleRoomTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{
                              width: `${
                                (stats.doubleRoomTotal /
                                  stats.singleRoomTotal) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Triple Room
                          </span>
                          <span className="text-sm font-medium">
                            ₹{stats.tripleRoomTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{
                              width: `${
                                (stats.tripleRoomTotal /
                                  stats.singleRoomTotal) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-900/30 flex items-center justify-center">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              Year-over-Year Change
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Compared to previous year
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1 px-2 py-1",
                            stats.percentageIncrease > 0
                              ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                              : "bg-red-900/20 text-red-400 border-red-800"
                          )}
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>{stats.percentageIncrease.toFixed(1)}%</span>
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg hover:shadow-emerald-900/10 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-400" />
                      <span>Fee Structure Timeline</span>
                    </CardTitle>
                    <CardDescription>
                      Overview of all configured fee structures
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {feeStructures.map((fee, index) => (
                        <div
                          key={fee.id}
                          className="relative pl-6 pb-4 before:absolute before:left-[7px] before:top-2 before:h-full before:w-[2px] before:bg-gray-800 last:before:hidden"
                        >
                          <div className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full bg-emerald-900 border-2 border-emerald-500" />
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-gray-900/50 rounded-lg p-3 border border-gray-800 hover:border-emerald-900/50 transition-colors">
                            <div>
                              <h4 className="font-medium text-sm flex items-center gap-2">
                                {fee.year} ({fee.semester})
                                {index === 0 && (
                                  <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">
                                    Latest
                                  </Badge>
                                )}
                              </h4>
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Home className="h-3 w-3" />
                                  <span>
                                    Hostel: ₹
                                    {Number.parseFloat(
                                      fee.hostelFees
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>
                                    Mess: ₹
                                    {Number.parseFloat(
                                      fee.messFees
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {fee.dueDate && (
                              <div className="flex items-center gap-2 text-xs bg-gray-800/50 px-2 py-1 rounded-md">
                                <Calendar className="h-3 w-3 text-emerald-400" />
                                <span>
                                  Due:{" "}
                                  {new Date(fee.dueDate).toLocaleDateString()}
                                </span>
                                {new Date(fee.dueDate) > new Date() && (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-900/20 text-emerald-400 border-emerald-800 text-[10px] px-1"
                                  >
                                    {getDaysUntilDueDate(fee.dueDate)} days left
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-emerald-400" />
                <span>
                  {isUpdating ? "Update Fee Structure" : "Create Fee Structure"}
                </span>
              </CardTitle>
              <CardDescription>
                {isUpdating
                  ? "Update existing fee structure"
                  : "Configure fees for a specific semester"}
                {isUpdating && (
                  <span className="mt-1 block text-amber-500 font-medium">
                    You are updating an existing fee structure for{" "}
                    {selectedYear} ({selectedSemester})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  console.log("🔥 form onSubmit fired");
                  handleSubmit(e);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) =>
                        setSelectedYear(Number.parseInt(value))
                      }
                    >
                      <SelectTrigger
                        id="year"
                        className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-800">
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select
                      value={selectedSemester}
                      onValueChange={(value) =>
                        setSelectedSemester(value as "JUL-DEC" | "JAN-MAY")
                      }
                    >
                      <SelectTrigger
                        id="semester"
                        className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                      >
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-950 border-gray-800">
                        <SelectItem value="JUL-DEC">July - December</SelectItem>
                        <SelectItem value="JAN-MAY">January - May</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hostelFees">Hostel Fees (₹)</Label>
                    <Input
                      id="hostelFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={hostelFees}
                      onChange={(e) => setHostelFees(e.target.value)}
                      placeholder="Enter hostel fees"
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="messFees">Mess Fees (₹)</Label>
                    <Input
                      id="messFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={messFees}
                      onChange={(e) => setMessFees(e.target.value)}
                      placeholder="Enter mess fees"
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="singleRoomFees">Single Room Fees (₹)</Label>
                    <Input
                      id="singleRoomFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={singleRoomFees}
                      onChange={(e) => setSingleRoomFees(e.target.value)}
                      placeholder="Enter single room fees"
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doubleRoomFees">Double Room Fees (₹)</Label>
                    <Input
                      id="doubleRoomFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={doubleRoomFees}
                      onChange={(e) => setDoubleRoomFees(e.target.value)}
                      placeholder="Enter double room fees"
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tripleRoomFees">Triple Room Fees (₹)</Label>
                    <Input
                      id="tripleRoomFees"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tripleRoomFees}
                      onChange={(e) => setTripleRoomFees(e.target.value)}
                      placeholder="Enter triple room fees"
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      min={getMinDueDate()}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-gray-950 border-gray-800 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Due date must be at least 10 days from today
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {saving
                    ? "Saving..."
                    : isUpdating
                    ? "Update Fee Structure"
                    : "Create Fee Structure"}
                </button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
                <span>Current Fee Structures</span>
              </CardTitle>
              <CardDescription>
                Overview of all configured fee structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feeStructures.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                      <AlertCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">
                      No fee structures found
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Create your first fee structure using the form above
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {feeStructures.map((fee) => (
                      <div
                        key={fee.id}
                        className="flex flex-col p-4 border border-gray-800 rounded-lg bg-gray-900/50 hover:border-emerald-900/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold flex items-center gap-2">
                            <span>
                              {fee.year} ({fee.semester})
                            </span>
                            {fee.dueDate &&
                              new Date(fee.dueDate) > new Date() && (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-900/20 text-emerald-400 border-emerald-800"
                                >
                                  Upcoming
                                </Badge>
                              )}
                          </h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(fee.id)}
                            className="h-8 bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>

                        <Separator className="bg-gray-800 my-2" />

                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Hostel Fees:
                            </span>
                          </div>
                          <div className="font-medium">
                            ₹
                            {Number.parseFloat(fee.hostelFees).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Mess Fees:
                            </span>
                          </div>
                          <div className="font-medium">
                            ₹{Number.parseFloat(fee.messFees).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Single Room:
                            </span>
                          </div>
                          <div className="font-medium">
                            ₹
                            {Number.parseFloat(
                              fee.singleRoomFees
                            ).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Double Room:
                            </span>
                          </div>
                          <div className="font-medium">
                            ₹
                            {Number.parseFloat(
                              fee.doubleRoomFees
                            ).toLocaleString()}
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span className="text-muted-foreground">
                              Triple Room:
                            </span>
                          </div>
                          <div className="font-medium">
                            ₹
                            {Number.parseFloat(
                              fee.tripleRoomFees
                            ).toLocaleString()}
                          </div>
                        </div>

                        {fee.dueDate && (
                          <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-emerald-400" />
                              <span className="text-muted-foreground">
                                Due Date:
                              </span>
                            </div>
                            <Badge
                              className={cn(
                                "font-medium",
                                new Date(fee.dueDate) > new Date()
                                  ? "bg-emerald-900/20 text-emerald-400 border-emerald-800"
                                  : "bg-red-900/20 text-red-400 border-red-800"
                              )}
                            >
                              {new Date(fee.dueDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the fee
              structure. Students who have already been charged based on this
              fee structure will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-900 border-gray-800 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
