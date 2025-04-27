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
import { X, Plus, AlertCircle, PencilIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Import the necessary components for the dialog and form
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  occupiedSeats: number;
  floor: number;
  block: string;
  type: "single" | "double" | "triple";
  is_active: boolean;
}

interface Filters {
  block: string;
  floor: string;
  type: string;
  status: string;
}

interface RoomStats {
  total: number;
  occupied: number;
  available: number;
  occupancyRate: number;
  totalCapacity: number;
  totalOccupancy: number;
}

// Add this roomSchema before the RoomsPage component
const roomSchema = z.object({
  roomNumber: z.string().min(2, "Room number must be at least 2 characters"),
  capacity: z.coerce
    .number()
    .min(1, "Capacity must be at least 1")
    .max(4, "Capacity cannot exceed 4"),
  floor: z.coerce.number().min(1, "Floor must be at least 1"),
  block: z.string().min(1, "Block is required"),
  type: z.enum(["single", "double", "triple"], {
    errorMap: () => ({ message: "Please select a valid room type" }),
  }),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    block: "",
    floor: "",
    type: "",
    status: "",
  });
  const [stats, setStats] = useState<RoomStats>({
    total: 0,
    occupied: 0,
    available: 0,
    occupancyRate: 0,
    totalCapacity: 0,
    totalOccupancy: 0,
  });

  // Inside the RoomsPage component, add these state variables and functions
  // Add after the existing state declarations
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      type: "single",
    },
  });

  const onSubmit = async (data: RoomFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber: data.roomNumber,
          capacity: data.capacity,
          floor: data.floor,
          block: data.block,
          type: data.type,
          occupiedSeats: 0,
          is_active: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }

      toast.success("Room created successfully");
      setDialogOpen(false);
      reset();
      fetchRooms();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/rooms");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRooms(data);

      // Calculate stats
      const total = data.length;
      const occupied = data.filter((r: Room) => r.occupiedSeats > 0).length;
      const totalCapacity = data.reduce(
        (acc: number, room: Room) => acc + room.capacity,
        0
      );
      const totalOccupancy = data.reduce(
        (acc: number, room: Room) => acc + room.occupiedSeats,
        0
      );

      setStats({
        total,
        occupied,
        available: total - occupied,
        occupancyRate:
          totalCapacity > 0
            ? Math.round((totalOccupancy / totalCapacity) * 100)
            : 0,
        totalCapacity,
        totalOccupancy,
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching rooms"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const blocks = Array.from(new Set(rooms.map((room) => room.block))).sort();
  const floors = Array.from(new Set(rooms.map((room) => room.floor))).sort(
    (a, b) => a - b
  );
  const types = Array.from(new Set(rooms.map((room) => room.type))).sort();

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBlock = !filters.block || room.block === filters.block;
    const matchesFloor =
      !filters.floor || room.floor === Number.parseInt(filters.floor);
    const matchesType = !filters.type || room.type === filters.type;
    const matchesStatus =
      !filters.status || getStatusMatch(room, filters.status);

    return (
      matchesSearch &&
      matchesBlock &&
      matchesFloor &&
      matchesType &&
      matchesStatus
    );
  });

  function getStatusMatch(room: Room, status: string): boolean {
    switch (status) {
      case "available":
        return room.occupiedSeats === 0;
      case "full":
        return room.occupiedSeats === room.capacity;
      case "partial":
        return room.occupiedSeats > 0 && room.occupiedSeats < room.capacity;
      default:
        return true;
    }
  }

  const clearFilters = () => {
    setFilters({
      block: "",
      floor: "",
      type: "",
      status: "",
    });
  };

  const getStatusBadgeVariant = (room: Room) => {
    if (!room.is_active) return "outline";
    if (room.occupiedSeats === 0) return "success";
    if (room.occupiedSeats === room.capacity) return "destructive";
    return "warning";
  };

  const getStatusText = (room: Room) => {
    if (!room.is_active) return "Inactive";
    if (room.occupiedSeats === 0) return "Available";
    if (room.occupiedSeats === room.capacity) return "Full";
    return "Partial";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <Skeleton className="h-64 w-full" />
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
        <h3 className="text-xl font-semibold">Failed to load rooms</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchRooms}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Room Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage hostel rooms and monitor occupancy
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupied Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">
              {stats.available}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{stats.occupancyRate}%</div>
            <Progress
              value={stats.occupancyRate}
              className="h-2 bg-muted"
              indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-600"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={filters.block}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, block: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Block" />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((block) => (
                <SelectItem key={block} value={block}>
                  Block {block}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.floor}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, floor: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.type}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="partial">Partially Occupied</SelectItem>
              <SelectItem value="full">Full</SelectItem>
            </SelectContent>
          </Select>

          {(filters.block ||
            filters.floor ||
            filters.type ||
            filters.status) && (
            <Button variant="outline" onClick={clearFilters} className="h-10">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          <div className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}{" "}
              found
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No rooms found</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                {searchQuery ||
                filters.block ||
                filters.floor ||
                filters.type ||
                filters.status
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "There are no rooms in the system yet. Add your first room to get started."}
              </p>
              {searchQuery ||
              filters.block ||
              filters.floor ||
              filters.type ||
              filters.status ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              ) : (
                <Link href="/admin/rooms/add">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Room
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Block</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Occupancy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">
                        {room.roomNumber}
                      </TableCell>
                      <TableCell>{room.floor}</TableCell>
                      <TableCell>Block {room.block}</TableCell>
                      <TableCell className="capitalize">{room.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>
                            {room.occupiedSeats} / {room.capacity}
                          </span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                room.occupiedSeats === room.capacity
                                  ? "bg-red-500"
                                  : room.occupiedSeats > 0
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${
                                  (room.occupiedSeats / room.capacity) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(room)}>
                          {getStatusText(room)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>
              Create a new room in the hostel. Room fees are managed through the
              fee structure settings.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., A101"
                  {...register("roomNumber")}
                />
                {errors.roomNumber && (
                  <p className="text-sm text-destructive">
                    {errors.roomNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Select defaultValue="" {...register("block")}>
                  <SelectTrigger id="block">
                    <SelectValue placeholder="Select block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Block A</SelectItem>
                    <SelectItem value="B">Block B</SelectItem>
                    <SelectItem value="C">Block C</SelectItem>
                    <SelectItem value="D">Block D</SelectItem>
                  </SelectContent>
                </Select>
                {errors.block && (
                  <p className="text-sm text-destructive">
                    {errors.block.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  max={4}
                  placeholder="e.g., 2"
                  {...register("capacity")}
                />
                {errors.capacity && (
                  <p className="text-sm text-destructive">
                    {errors.capacity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  min={1}
                  placeholder="e.g., 1"
                  {...register("floor")}
                />
                {errors.floor && (
                  <p className="text-sm text-destructive">
                    {errors.floor.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select defaultValue="single" {...register("type")}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
