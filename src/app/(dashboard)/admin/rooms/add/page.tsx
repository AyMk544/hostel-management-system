"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const roomSchema = z.object({
  roomNumber: z.string().min(2, "Room number must be at least 2 characters"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(4, "Capacity cannot exceed 4"),
  floor: z.coerce.number().min(1, "Floor must be at least 1"),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function AddRoomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomSchema),
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
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create room");
      }

      toast.success("Room created successfully");
      router.push("/admin/rooms");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-zinc-900">
      <Link
        href="/admin/rooms"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Rooms
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add New Room</CardTitle>
          <CardDescription>
            Create a new room in the hostel. Room fees are managed through the fee structure settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., 101"
                  {...register("roomNumber")}
                  className="bg-white text-zinc-900"
                />
                {errors.roomNumber && (
                  <p className="text-sm text-red-500">
                    {errors.roomNumber.message}
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
                  className="bg-white text-zinc-900"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-500">{errors.capacity.message}</p>
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
                  className="bg-white text-zinc-900"
                />
                {errors.floor && (
                  <p className="text-sm text-red-500">{errors.floor.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Room"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 