"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bed, Wifi, Coffee, Utensils, DoorClosed, Users, IndianRupee, AlertCircle, Building } from "lucide-react";
import { fetchWithAuth } from "@/lib/api-utils";

interface HostelDetails {
  hasRoom: boolean;
  message?: string;
  roomNumber?: string;
  capacity?: number;
  occupiedSeats?: number;
  floor?: number;
  blockName?: string;
  roomType?: string;
  fees?: {
    baseHostelFee: number;
    roomTypeFee: number;
    totalFees: number;
  };
  facilities?: string[];
  rules?: string[];
}

export default function HostelDetailsPage() {
  const [details, setDetails] = useState<HostelDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHostelDetails();
  }, []);

  const fetchHostelDetails = async () => {
    try {
      const data = await fetchWithAuth("/api/student/hostel");
      setDetails(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching hostel details:", error);
      setError(error instanceof Error ? error.message : "Failed to load hostel details");
    } finally {
      setIsLoading(false);
    }
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-5 w-5" />;
      case "cafeteria":
        return <Coffee className="h-5 w-5" />;
      case "mess":
        return <Utensils className="h-5 w-5" />;
      default:
        return <DoorClosed className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (details && !details.hasRoom) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-500">No Room Assigned</h2>
            <p className="text-gray-500 mb-4">
              You haven't been assigned a room yet. Please contact the hostel administration for room allocation.
            </p>
            <div className="text-sm text-gray-400">
              Once you are assigned a room, you will be able to view your hostel details here.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              Failed to load hostel details. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoomType = (capacity: number) => {
    switch (capacity) {
      case 1:
        return "Single Occupancy";
      case 2:
        return "Double Occupancy";
      case 3:
        return "Triple Occupancy";
      default:
        return "Multiple Occupancy";
    }
  };

  return (
    <div className="p-6 space-y-6 text-zinc-900">
      {/* Room Information */}
      <Card>
        <CardHeader>
          <CardTitle>Room Information</CardTitle>
          <CardDescription>Details about your current room</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-4">
              <Bed className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Room Number</p>
                <p className="text-sm text-gray-500">{details.roomNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DoorClosed className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Room Type</p>
                <p className="text-sm text-gray-500">{details.roomType || getRoomType(details.capacity || 0)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Occupancy</p>
                <p className="text-sm text-gray-500">
                  {details.occupiedSeats} / {details.capacity}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Building className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Block & Floor</p>
                <p className="text-sm text-gray-500">{details.blockName}, Floor {details.floor}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
          <CardDescription>Breakdown of your hostel fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Base Hostel Fee:</span>
                <span>₹{details.fees?.baseHostelFee.toLocaleString() || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{details.roomType || "Room"} Fee:</span>
                <span>₹{details.fees?.roomTypeFee.toLocaleString() || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium">Total Fee:</span>
                <span className="font-bold text-blue-600">₹{details.fees?.totalFees.toLocaleString() || "N/A"}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">* Fees are for the current semester and may be revised for future semesters.</p>
          </div>
        </CardContent>
      </Card>

      {/* Facilities */}
      <Card>
        <CardHeader>
          <CardTitle>Facilities</CardTitle>
          <CardDescription>Available facilities in your hostel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {details.facilities?.map((facility, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {getFacilityIcon(facility)}
                <span className="text-sm font-medium">{facility}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hostel Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Hostel Rules</CardTitle>
          <CardDescription>
            Please follow these rules for a comfortable stay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            {details.rules?.map((rule, index) => (
              <li key={index} className="text-sm text-gray-600">
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 