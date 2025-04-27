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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated schema to use room type instead of capacity and include block
const roomSchema = z.object({
  roomNumber: z.string().min(2, "Room number must be at least 2 characters"),
  floor: z.coerce.number().min(1, "Floor must be at least 1"),
  block: z.string().min(1, "Block is required"),
  type: z.enum(["single", "double", "triple"], {
    errorMap: () => ({ message: "Please select a valid room type" }),
  }),
});

type RoomFormData = z.infer<typeof roomSchema>;

export default function AddRoomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      type: undefined,
    },
  });

  const onSubmit = async (data: RoomFormData) => {
    // Infer capacity from room type
    const capacityMap = {
      single: 1,
      double: 2,
      triple: 3,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomNumber: data.roomNumber,
          capacity: capacityMap[data.type],
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
      router.push("/admin/rooms");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Add New Room</CardTitle>
          <CardDescription>
            Create a new room in the hostel. Room fees are managed through the
            fee structure settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="roomNumber">Room Number</Label>
                <Input
                  id="roomNumber"
                  placeholder="e.g., A101"
                  {...register("roomNumber")}
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
                  min={1}
                  placeholder="e.g., 1"
                  {...register("floor")}
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
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
