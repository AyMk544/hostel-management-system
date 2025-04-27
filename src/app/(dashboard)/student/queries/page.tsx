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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquarePlus,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

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

  const getStatusBadgeVariant = (status: Query["status"]) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in_progress":
        return "default";
      case "resolved":
        return "success";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: Query["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 mr-1" />;
      case "in_progress":
        return <HelpCircle className="h-4 w-4 mr-1" />;
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center justify-center p-4 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold">Failed to load queries</h3>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchQueries}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Queries</h2>
          <p className="text-muted-foreground mt-1">
            Submit and track your hostel-related queries
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              New Query
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Query</DialogTitle>
              <DialogDescription>
                Submit your query or issue to the hostel administration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Brief title of your query"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Detailed description of your query"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Query"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {queries.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <AlertCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No queries found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                You haven't submitted any queries yet. Create a new query to get
                started.
              </p>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                onClick={() => setIsDialogOpen(true)}
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Create Your First Query
              </Button>
            </CardContent>
          </Card>
        ) : (
          queries.map((query) => (
            <Card
              key={query.id}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{query.title}</CardTitle>
                    <CardDescription>
                      Submitted on{" "}
                      {new Date(query.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={getStatusBadgeVariant(query.status)}
                    className="flex items-center"
                  >
                    {getStatusIcon(query.status)}
                    <span>{query.status.replace("_", " ").toUpperCase()}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{query.description}</p>
                {query.adminResponse && (
                  <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                    <p className="text-sm font-medium text-emerald-400 mb-2">
                      Admin Response:
                    </p>
                    <p className="text-sm">{query.adminResponse}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Updated on{" "}
                      {new Date(query.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
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
