"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

interface Query {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const querySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

type QueryFormData = z.infer<typeof querySchema>;

export default function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
  });

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const response = await fetch("/api/student/queries");
      const data = await response.json();
      setQueries(data);
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to load queries");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: QueryFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/student/queries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Query submitted successfully");
        reset();
        setIsDialogOpen(false);
        await fetchQueries();
      } else {
        toast.error("Failed to submit query");
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      toast.error("Failed to submit query");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Query["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 text-zinc-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold ">My Queries</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              New Query
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Query</DialogTitle>
              <DialogDescription>
                Submit your query or issue to the hostel administration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-zinc-100">Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Brief title of your query"
                  className="text-zinc-100"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="description" className="text-zinc-100">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Detailed description of your query"
                  rows={4}
                  className="text-zinc-100"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Query"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-lg font-medium text-zinc-900">No queries found</p>
            <p className="text-zinc-600">Create a new query to get started.</p>
          </div>
        ) : (
          queries.map((query) => (
            <Card key={query.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-zinc-900">{query.title}</CardTitle>
                    <CardDescription>
                      {new Date(query.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      query.status
                    )}`}
                  >
                    {query.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-900 mb-4">{query.description}</p>
                {query.adminResponse && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-zinc-600">
                      Admin Response:
                    </p>
                    <p className="mt-1 text-zinc-900">{query.adminResponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 