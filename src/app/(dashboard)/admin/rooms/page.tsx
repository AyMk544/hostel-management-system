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
import { Eye, PencilIcon, Plus, X } from "lucide-react";
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

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    block: "",
    floor: "",
    type: "",
    status: "",
  });
  const [stats, setStats] = useState({
    total: 0,
    occupied: 0,
    available: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
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
        occupancyRate: Math.round((totalOccupancy / totalCapacity) * 100),
      });
    } catch (error) {
      console.error("Error fetching rooms:", error);
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
      !filters.floor || room.floor === parseInt(filters.floor);
    const matchesType = !filters.type || room.type === filters.type;
    const matchesStatus =
      !filters.status ||
      (filters.status === "available"
        ? room.occupiedSeats === 0
        : filters.status === "full"
        ? room.occupiedSeats === room.capacity
        : filters.status === "partial"
        ? room.occupiedSeats > 0 && room.occupiedSeats < room.capacity
        : true);

    return (
      matchesSearch &&
      matchesBlock &&
      matchesFloor &&
      matchesType &&
      matchesStatus
    );
  });

  const clearFilters = () => {
    setFilters({
      block: "",
      floor: "",
      type: "",
      status: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-zinc-900">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupied Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {stats.available}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Occupancy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 text-zinc-100">
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search rooms..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Link
            href="/admin/rooms/add"
            className="text-zinc-900 cursor-pointer"
          >
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md px-4 py-2 text-white flex items-center font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </button>
          </Link>
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
                <SelectItem key={block} value={block} className="bg-zinc-900">
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
                <SelectItem
                  key={floor}
                  value={floor.toString()}
                  className="bg-zinc-900"
                >
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
            <Button variant="ghost" onClick={clearFilters} className="h-10">
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          <div className="ml-auto">
            <Badge variant="secondary">
              {filteredRooms.length} room{filteredRooms.length !== 1 ? "s" : ""}{" "}
              found
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
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
                    {room.occupiedSeats} / {room.capacity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={room.is_active ? "success" : "secondary"}>
                      {room.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/rooms/${room.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer"
                      >
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
