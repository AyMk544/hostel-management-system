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
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
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

const roomSchema = z.object({
  roomNumber: z.string().min(2, "Room number must be at least 2 characters"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(4, "Capacity cannot exceed 4"),
  floor: z.coerce.number().min(1, "Floor must be at least 1"),
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
      capacity: 1,
      floor: 1,
      is_active: true,
    }
  });

  useEffect(() => {
    fetchRoom();
  }, [params.id]);

  const fetchRoom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/rooms/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch room details");
      const data = await response.json();
      
      setRoom(data);
      
      // Set form data
      setValue("roomNumber", data.roomNumber);
      setValue("capacity", data.capacity);
      setValue("floor", data.floor);
      setValue("is_active", data.is_active);
      
    } catch (error) {
      console.error("Error fetching room:", error);
      toast.error("Failed to load room data");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<RoomFormData> = async (data) => {
    // Additional safety check - don't submit if room is occupied
    if (room?.occupiedSeats && room.occupiedSeats > 0) {
      toast.error("Cannot edit a room that is currently occupied");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/rooms/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update room");
      }

      toast.success("Room updated successfully");
      router.push("/admin/rooms");
    } catch (error) {
      console.error("Error updating room:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update room");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/rooms/${params.id}`, {
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
      toast.error(error instanceof Error ? error.message : "Failed to delete room");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-6 text-zinc-900">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/rooms" className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Link>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Room not found</h2>
          <p className="text-muted-foreground mt-2">The room you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  const isRoomOccupied = room.occupiedSeats > 0;

  return (
    <div className="p-6 text-zinc-900">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/rooms" className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200">
          <ArrowLeft className="h-4 w-4" />
          Back to Rooms
        </Link>
        
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Room
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white text-zinc-900">
            <DialogHeader>
              <DialogTitle>Delete Room</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete Room {room.roomNumber}?
                {isRoomOccupied && (
                  <p className="text-red-500 mt-2">
                    This room cannot be deleted as it has {room.occupiedSeats} occupant(s).
                    Please reassign the occupants first.
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="cursor-pointer">Cancel</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                className="cursor-pointer"
                onClick={handleDelete}
                disabled={isDeleting || isRoomOccupied}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Room</CardTitle>
          <CardDescription>
            Update room details and attributes. Be careful when changing the capacity if the room is already occupied.
          </CardDescription>
          {isRoomOccupied && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
              <p className="font-semibold">This room is currently occupied by {room.occupiedSeats} student(s).</p>
              <p className="mt-1">Editing is restricted for occupied rooms. Please reassign all students to a different room before making changes.</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  {...register("roomNumber")}
                  placeholder="e.g. A101"
                  className="bg-white text-zinc-900"
                  disabled={isRoomOccupied}
                />
                {errors.roomNumber && (
                  <p className="text-destructive text-sm">{errors.roomNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register("capacity")}
                  min={1}
                  max={4}
                  className="bg-white text-zinc-900"
                  disabled={isRoomOccupied}
                />
                {errors.capacity && (
                  <p className="text-destructive text-sm">{errors.capacity.message}</p>
                )}
                {isRoomOccupied && (
                  <p className="text-amber-600 text-sm">
                    This room currently has {room.occupiedSeats} occupant(s). 
                    Capacity cannot be changed while the room is occupied.
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
                  className="bg-white text-zinc-900"
                  disabled={isRoomOccupied}
                />
                {errors.floor && (
                  <p className="text-destructive text-sm">{errors.floor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active" className="block mb-2">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    {...register("is_active")}
                    defaultChecked={room.is_active}
                    onCheckedChange={(checked: boolean) => setValue("is_active", checked)}
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
                  <p className="text-amber-600 text-sm">
                    Status cannot be changed while the room is occupied.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between items-center font-medium">
                <span>Current Occupancy:</span>
                <span className={room.occupiedSeats === 0 ? "text-green-600" : room.occupiedSeats === room.capacity ? "text-red-600" : "text-amber-600"}>
                  {room.occupiedSeats} / {room.capacity}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Room Type:</span>
                <span className="capitalize">{room.type}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Block:</span>
                <span>Block {room.block}</span>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full md:w-auto cursor-pointer" 
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
                <p className="text-amber-600 mt-2 text-sm">
                  Room editing is disabled because the room is currently occupied.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 