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
  DialogFooter,
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
  Search,
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const getStatusBadge = (status: Query["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-amber-950/20 text-amber-400 border-border/40"
          >
            <Clock className="h-3 w-3" /> PENDING
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-emerald-950/20 text-emerald-400 border-border/40"
          >
            <HelpCircle className="h-3 w-3" /> IN PROGRESS
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-emerald-950/30 text-emerald-300 border-border/40"
          >
            <CheckCircle2 className="h-3 w-3" /> RESOLVED
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredQueries = queries.filter(
    (query) =>
      query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border-border/40 bg-card/50 backdrop-blur-md"
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
        <Button
          onClick={fetchQueries}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            My Queries
          </h2>
          <p className="text-muted-foreground mt-1">
            Submit and track your hostel-related queries
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search queries..."
              className="pl-9 bg-background border-border/40 focus-visible:ring-emerald-500/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-900/20">
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                New Query
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card/90 backdrop-blur-md border-border/40">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">
                  Create New Query
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Submit your query or issue to the hostel administration.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4 mt-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-300">
                    Title
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Brief title of your query"
                    className="bg-background border-border/40 focus-visible:ring-emerald-500/30"
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Detailed description of your query"
                    rows={4}
                    className="bg-background border-border/40 focus-visible:ring-emerald-500/30"
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-900/20"
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
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {queries.length === 0 ? (
          <Card className="border-border/40 bg-card/50 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-emerald-950/20 border border-emerald-900/30 p-3 mb-4">
                <MessageSquarePlus className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium mb-1 text-zinc-100">
                No queries found
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                You haven't submitted any queries yet. Create a new query to get
                started.
              </p>
              <Button
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-900/20"
                onClick={() => setIsDialogOpen(true)}
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Create Your First Query
              </Button>
            </CardContent>
          </Card>
        ) : filteredQueries.length === 0 ? (
          <Card className="border-border/40 bg-card/50 backdrop-blur-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-amber-950/20 border border-amber-900/30 p-3 mb-4">
                <Search className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium mb-1 text-zinc-100">
                No matching queries
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                No queries match your search term. Try a different search or
                clear the filter.
              </p>
              <Button
                variant="outline"
                className="border-border/40 hover:bg-background/50"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredQueries.map((query) => (
            <Card
              key={query.id}
              className="border-border/40 bg-card/50 backdrop-blur-md hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200"
            >
              <CardHeader className="pb-2 border-b border-border/40">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-zinc-100 mb-3">
                      {query.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Submitted on{" "}
                      {new Date(query.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </div>
                  {getStatusBadge(query.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-zinc-300">{query.description}</p>
                {query.adminResponse && (
                  <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                    <p className="text-sm font-medium text-emerald-400 mb-2">
                      Admin Response:
                    </p>
                    <p className="text-sm text-zinc-200">
                      {query.adminResponse}
                    </p>
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
