"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { Loader2, AlertCircle, Trash2, IndianRupee } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

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
  const [loading, setLoading] = useState(true);
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
    // Set default due date to 1 month from now
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split("T")[0];
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);

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
        // Check if the existing due date is at least 10 days from now
        const existingDueDate = new Date(existingFee.dueDate);
        const minDueDate = new Date();
        minDueDate.setDate(minDueDate.getDate() + 10);

        // If existing due date is past or less than 10 days away, set to min date
        if (existingDueDate < minDueDate) {
          setDueDate(getMinDueDate());
        } else {
          setDueDate(existingFee.dueDate);
        }
      } else {
        // Set default due date to 1 month from now
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

      // Reset due date to 1 month from now
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [selectedYear, selectedSemester, feeStructures]);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/fees");
      if (!response.ok) {
        throw new Error("Failed to fetch fee structures");
      }
      const data = await response.json();
      setFeeStructures(data);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Reset form after submission
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

    // Validate that due date is at least 10 days from now
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
        hostelFees: Number.parseFloat(hostelFees),
        messFees: Number.parseFloat(messFees),
        singleRoomFees: Number.parseFloat(singleRoomFees),
        doubleRoomFees: Number.parseFloat(doubleRoomFees),
        tripleRoomFees: Number.parseFloat(tripleRoomFees),
        dueDate: dueDate,
      };

      let response;
      if (isUpdating && existingFeeId) {
        // Update existing fee structure
        response = await fetch(`/api/admin/fees?id=${existingFeeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...payload, id: existingFeeId }),
        });
      } else {
        // Create new fee structure
        response = await fetch("/api/admin/fees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        // Handle specific errors
        if (response.status === 409) {
          // Conflict - Duplicate fee structure
          toast.error(
            data.message ||
              "A fee structure for this year and semester already exists"
          );
        } else if (response.status === 400) {
          // Bad request - Invalid data
          const errorMessage = data.error || "Invalid data provided";
          toast.error(errorMessage);
          console.error("Validation error details:", data.details);
        } else {
          toast.error(data.error || "Failed to save fee structure");
        }

        // Don't throw error here - just return to prevent page reload
        return;
      }

      toast.success(
        isUpdating
          ? "Fee structure updated successfully"
          : "Fee structure created successfully"
      );

      // Only reset form on success
      resetForm();
      await fetchFeeStructures();
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
      const response = await fetch(`/api/admin/fees?id=${feeToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete fee structure");
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

  // Calculate minimum due date (10 days from now)
  const getMinDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 10);
    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Fee Structure Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Set hostel and mess fees for different semesters
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center justify-center p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Failed to load fee structures</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchFeeStructures}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Fee Structure Management
        </h2>
        <p className="text-muted-foreground mt-1">
          Set hostel and mess fees for different semesters
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Set Fees</CardTitle>
          <CardDescription>
            {isUpdating
              ? "Update existing fee structure"
              : "Configure fees for a specific semester"}
          </CardDescription>

          {isUpdating && (
            <div className="mt-2 text-amber-400 font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>
                You are updating an existing fee structure for {selectedYear} (
                {selectedSemester})
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) =>
                    setSelectedYear(Number.parseInt(value))
                  }
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JUL-DEC">July - December</SelectItem>
                    <SelectItem value="JAN-MAY">January - May</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostelFees">Hostel Fees (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hostelFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={hostelFees}
                    onChange={(e) => setHostelFees(e.target.value)}
                    placeholder="Enter hostel fees"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messFees">Mess Fees (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="messFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={messFees}
                    onChange={(e) => setMessFees(e.target.value)}
                    placeholder="Enter mess fees"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="singleRoomFees">Single Room Fees (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="singleRoomFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={singleRoomFees}
                    onChange={(e) => setSingleRoomFees(e.target.value)}
                    placeholder="Enter single room fees"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doubleRoomFees">Double Room Fees (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="doubleRoomFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={doubleRoomFees}
                    onChange={(e) => setDoubleRoomFees(e.target.value)}
                    placeholder="Enter double room fees"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tripleRoomFees">Triple Room Fees (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="tripleRoomFees"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tripleRoomFees}
                    onChange={(e) => setTripleRoomFees(e.target.value)}
                    placeholder="Enter triple room fees"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  min={getMinDueDate()}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Due date must be at least 10 days from today
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {saving
                ? "Saving..."
                : isUpdating
                ? "Update Fee Structure"
                : "Create Fee Structure"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">
            Current Fee Structures
          </CardTitle>
          <CardDescription>
            Overview of all configured fee structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeStructures.length === 0 ? (
              <div className="text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                <p>No fee structures configured yet</p>
                <p className="text-sm mt-1">
                  Create your first fee structure using the form above
                </p>
              </div>
            ) : (
              feeStructures.map((fee) => (
                <div
                  key={fee.id}
                  className="p-4 border border-border/50 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center">
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                          {fee.year} ({fee.semester})
                        </span>
                        {fee.dueDate && (
                          <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                            Due: {new Date(fee.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <span className="w-32">Hostel Fees:</span>
                          <span className="font-medium text-foreground">
                            ₹
                            {Number.parseFloat(fee.hostelFees).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-32">Mess Fees:</span>
                          <span className="font-medium text-foreground">
                            ₹{Number.parseFloat(fee.messFees).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-32">Single Room:</span>
                          <span className="font-medium text-foreground">
                            ₹
                            {Number.parseFloat(
                              fee.singleRoomFees
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-32">Double Room:</span>
                          <span className="font-medium text-foreground">
                            ₹
                            {Number.parseFloat(
                              fee.doubleRoomFees
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-32">Triple Room:</span>
                          <span className="font-medium text-foreground">
                            ₹
                            {Number.parseFloat(
                              fee.tripleRoomFees
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(fee.id)}
                      className="text-xs h-8 opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the fee
              structure. Students who have already been charged based on this
              fee structure will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
