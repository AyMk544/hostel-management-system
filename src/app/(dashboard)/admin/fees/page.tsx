"use client";

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
import { Loader2, AlertCircle, Trash2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api-utils";
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
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState<"JUL-DEC" | "JAN-MAY">("JUL-DEC");
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
    return date.toISOString().split('T')[0];
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
        setDueDate(date.toISOString().split('T')[0]);
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
      setDueDate(date.toISOString().split('T')[0]);
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

    if (!selectedYear || !selectedSemester || !hostelFees || !messFees || !singleRoomFees || !doubleRoomFees || !tripleRoomFees) {
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
        hostelFees: parseFloat(hostelFees),
        messFees: parseFloat(messFees),
        singleRoomFees: parseFloat(singleRoomFees),
        doubleRoomFees: parseFloat(doubleRoomFees),
        tripleRoomFees: parseFloat(tripleRoomFees),
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
          toast.error(data.message || "A fee structure for this year and semester already exists");
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

      toast.success(isUpdating 
        ? "Fee structure updated successfully" 
        : "Fee structure created successfully");
      
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
      const response = await fetchWithAuth(`/api/admin/fees?id=${feeToDelete}`, {
        method: "DELETE",
      });

      toast.success("Fee structure deleted successfully");
      setDeleteDialogOpen(false);
      await fetchFeeStructures();
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete fee structure");
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
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
    <div className="space-y-6 p-6 text-zinc-900">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Fee Structure Management</h2>
        <p className="text-muted-foreground">
          Set hostel and mess fees for different semesters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Fees</CardTitle>
          <CardDescription>
            {isUpdating ? "Update existing fee structure" : "Configure fees for a specific semester"}
            {isUpdating && (
              <span className="mt-1 text-amber-600 font-medium">
                You are updating an existing fee structure for {selectedYear} ({selectedSemester})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger id="year" className="bg-white text-zinc-900">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-zinc-900">
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
                  onValueChange={(value) => setSelectedSemester(value as "JUL-DEC" | "JAN-MAY")}
                >
                  <SelectTrigger id="semester" className="bg-white text-zinc-900">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="JUL-DEC" className="text-zinc-900">July - December</SelectItem>
                    <SelectItem value="JAN-MAY" className="text-zinc-900">January - May</SelectItem>
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
                  className="bg-white text-zinc-900"
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
                  className="bg-white text-zinc-900"
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
                  className="bg-white text-zinc-900"
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
                  className="bg-white text-zinc-900"
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
                  className="bg-white text-zinc-900"
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
                  className="bg-white text-zinc-900"
                />
                <p className="text-xs text-muted-foreground">
                  Due date must be at least 10 days from today
                </p>
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving 
                ? "Saving..." 
                : isUpdating 
                  ? "Update Fee Structure" 
                  : "Create Fee Structure"
              }
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Fee Structures</CardTitle>
          <CardDescription>
            Overview of all configured fee structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feeStructures.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No fee structures configured yet
              </p>
            ) : (
              feeStructures.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">
                      {fee.year} ({fee.semester})
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      <p>Hostel Fees: ₹{parseFloat(fee.hostelFees).toLocaleString()}</p>
                      <p>Mess Fees: ₹{parseFloat(fee.messFees).toLocaleString()}</p>
                      <p>Single Room Fees: ₹{parseFloat(fee.singleRoomFees).toLocaleString()}</p>
                      <p>Double Room Fees: ₹{parseFloat(fee.doubleRoomFees).toLocaleString()}</p>
                      <p>Triple Room Fees: ₹{parseFloat(fee.tripleRoomFees).toLocaleString()}</p>
                      {fee.dueDate && (
                        <p className="mt-1 text-blue-600 font-medium">
                          Due Date: {new Date(fee.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClick(fee.id)}
                    className="text-xs h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
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
              This action cannot be undone. This will permanently delete the fee structure.
              Students who have already been charged based on this fee structure will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 