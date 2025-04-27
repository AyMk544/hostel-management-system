"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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

// Remove the capacity field from the schema and add a mapping function for capacity
const roomSchema = z.object({
  roomNumber: z.string().min(2, "Room number must be at least 2 characters"),
  floor: z.coerce.number().min(1, "Floor must be at least 1"),
  block: z.string().min(1, "Block is required"),
  type: z.enum(["single", "double", "triple"], {
    errorMap: () => ({ message: "Please select a valid room type" }),
  }),
  is_active: z.boolean(),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      roomNumber: "",
      floor: 1,
      block: "",
      type: "single" as const,
      is_active: true,
    },
  });

  useEffect(() => {
    fetchRoom();
  }, [params.id]);

  const fetchRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/rooms/${params.id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch room details");
      }
      const data = await response.json();
      console.log(data);

      setRoom(data);

      // Set form data
      setValue("roomNumber", data.roomNumber);
      setValue("floor", data.floor);
      setValue("block", data.block);
      setValue("type", data.type);
      setValue("is_active", data.is_active);
    } catch (error) {
      console.error("Error fetching room:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load room data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update the onSubmit function to infer capacity from room type
  const onSubmit: SubmitHandler<RoomFormData> = async (data) => {
    // Additional safety check - don't submit if room is occupied
    if (room?.occupiedSeats && room.occupiedSeats > 0) {
      toast.error("Cannot edit a room that is currently occupied");
      return;
    }

    // Infer capacity from room type
    const capacityMap = {
      single: 1,
      double: 2,
      triple: 3,
    };

    const dataWithCapacity = {
      ...data,
      capacity: capacityMap[data.type],
    };

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/rooms?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataWithCapacity),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update room");
      }

      toast.success("Room updated successfully");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update room"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/rooms?id=${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete room");
      }

      toast.success("Room deleted successfully");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete room"
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/rooms">
            <Button variant="outline" size="sm" className="h-9">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="flex items-center justify-center p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">Failed to load room</h3>
          <p className="text-muted-foreground text-center max-w-md">{error}</p>
          <Button onClick={fetchRoom}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/rooms">
            <Button variant="outline" size="sm" className="h-9">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </Link>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold">Room not found</h3>
              <p className="text-muted-foreground">
                The room you're looking for doesn't exist or you don't have
                permission to view it.
              </p>
              <Link href="/admin/rooms">
                <Button className="mt-4">Return to Rooms</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRoomOccupied = room.occupiedSeats > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Link href="/admin/rooms">
          <Button variant="outline" size="sm" className="h-9">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rooms
          </Button>
        </Link>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="h-9">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Room</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete Room {room.roomNumber}?
                {isRoomOccupied && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                    <p className="font-medium">
                      This room cannot be deleted as it has {room.occupiedSeats}{" "}
                      occupant(s).
                    </p>
                    <p className="mt-1">Please reassign the occupants first.</p>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isRoomOccupied}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">
            Edit Room {room.roomNumber}
          </CardTitle>
          <CardDescription>
            Update room details and attributes. Be careful when changing the
            capacity if the room is already occupied.
          </CardDescription>
          {isRoomOccupied && (
            <div className="mt-4 p-4 bg-amber-950/20 border border-amber-800/30 rounded-md text-amber-400">
              <p className="font-semibold">
                This room is currently occupied by {room.occupiedSeats}{" "}
                student(s).
              </p>
              <p className="mt-1 text-sm">
                Editing is restricted for occupied rooms. Please reassign all
                students to a different room before making changes.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  {...register("roomNumber")}
                  placeholder="e.g. A101"
                  disabled={isRoomOccupied}
                />
                {errors.roomNumber && (
                  <p className="text-destructive text-sm">
                    {errors.roomNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  {...register("floor")}
                  min={1}
                  disabled={isRoomOccupied}
                />
                {errors.floor && (
                  <p className="text-destructive text-sm">
                    {errors.floor.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Select
                  value={watch("block")}
                  onValueChange={(value) => setValue("block", value)}
                  disabled={isRoomOccupied}
                >
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
                  <p className="text-destructive text-sm">
                    {errors.block.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Room Type</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(value: "single" | "double" | "triple") =>
                    setValue("type", value)
                  }
                  disabled={isRoomOccupied}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single (Capacity: 1)</SelectItem>
                    <SelectItem value="double">Double (Capacity: 2)</SelectItem>
                    <SelectItem value="triple">Triple (Capacity: 3)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-destructive text-sm">
                    {errors.type.message}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Room capacity is determined by the room type
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active" className="block mb-2">
                  Status
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={watch("is_active")}
                    onCheckedChange={(checked: boolean) =>
                      setValue("is_active", checked)
                    }
                    disabled={isRoomOccupied}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    {watch("is_active") ? "Active" : "Inactive"}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Inactive rooms won't be available for new assignments
                </p>
                {isRoomOccupied && (
                  <p className="text-amber-400 text-sm">
                    Status cannot be changed while the room is occupied.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/40">
              <h4 className="text-sm font-medium text-muted-foreground pt-2">
                Room Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Current Occupancy
                  </p>
                  <p
                    className={`font-medium ${
                      room.occupiedSeats === 0
                        ? "text-emerald-400"
                        : room.occupiedSeats === room.capacity
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    {room.occupiedSeats} / {room.capacity}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Room ID</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                    {room.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={isSaving || isRoomOccupied}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              {isRoomOccupied && (
                <p className="text-amber-400 mt-2 text-sm">
                  Room editing is disabled because the room is currently
                  occupied.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
