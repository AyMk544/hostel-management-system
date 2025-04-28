"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/api-utils";
import { cn } from "@/lib/utils";

interface Query {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function QueryPage() {
  const params = useParams();
  const router = useRouter();
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"pending" | "in_progress" | "resolved">(
    "pending"
  );
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuery();
  }, [params.id]);

  const fetchQuery = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`/api/admin/queries/${params.id}`);
      setQuery(data);
      setStatus(data.status);
      setResponse(data.adminResponse || "");
    } catch (error) {
      console.error("Error fetching query:", error);
      toast.error("Failed to load query details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "resolved" && !response.trim()) {
      toast.error("Please provide a response before marking as resolved");
      return;
    }

    try {
      setSubmitting(true);
      const result = await fetchWithAuth(`/api/admin/queries/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status,
          adminResponse: status === "resolved" ? response : undefined,
        }),
      });

      toast.success("Query updated successfully");
      router.push("/admin/queries");
    } catch (error) {
      console.error("Error updating query:", error);
      toast.error("Failed to update query");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-amber-950/20 text-amber-400 border-border/40"
          >
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-emerald-950/20 text-emerald-400 border-border/40"
          >
            <AlertCircle className="h-3 w-3" /> In Progress
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="flex items-center gap-1 bg-emerald-950/30 text-emerald-300 border-border/40"
          >
            <CheckCircle2 className="h-3 w-3" /> Resolved
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] text-emerald-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-100">
        <h2 className="text-xl font-semibold mb-2">Query Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The query you're looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Link href="/admin/queries">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            Back to Queries
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="text-zinc-100">
      <div className="flex items-center mb-6">
        <Link
          href="/admin/queries"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Queries
        </Link>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/40 bg-card/50 backdrop-blur-md shadow-lg">
          <CardHeader className="border-b border-border/40 bg-gradient-to-r from-zinc-900/50 to-zinc-950/50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl text-zinc-100">
                  {query.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Submitted by{" "}
                  <span className="text-zinc-300">{query.studentName}</span> on{" "}
                  <span className="text-zinc-300">
                    {formatDate(query.createdAt)}
                  </span>
                </CardDescription>
              </div>
              {getStatusBadge(query.status)}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <MessageSquare className="h-4 w-4" />
                <h3>Student Query</h3>
              </div>
              <div className="p-4 rounded-md bg-background/50 border border-border/40 text-zinc-100 whitespace-pre-wrap">
                {query.description}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-zinc-300">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "pending" | "in_progress" | "resolved")
                  }
                >
                  <SelectTrigger
                    id="status"
                    className="bg-background border-border/40 text-zinc-200 focus:ring-emerald-500/30"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/40">
                    <SelectItem
                      value="pending"
                      className="text-amber-400 focus:bg-accent"
                    >
                      Pending
                    </SelectItem>
                    <SelectItem
                      value="in_progress"
                      className="text-emerald-400 focus:bg-accent"
                    >
                      In Progress
                    </SelectItem>
                    <SelectItem
                      value="resolved"
                      className="text-emerald-300 focus:bg-accent"
                    >
                      Resolved
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response" className="text-zinc-300">
                  Admin Response{" "}
                  {status === "resolved" && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Textarea
                  id="response"
                  placeholder="Enter your response to this query"
                  className="min-h-[150px] bg-background border-border/40 text-zinc-200 focus:ring-emerald-500/30 placeholder:text-muted-foreground"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
                {status === "resolved" && (
                  <p className="text-sm text-muted-foreground">
                    A response is required when marking a query as resolved
                  </p>
                )}
              </div>

              <CardFooter className="px-0 pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium",
                    "shadow-md shadow-emerald-900/20 transition-all duration-200",
                    submitting && "opacity-90"
                  )}
                >
                  {submitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {submitting ? "Updating..." : "Update Query"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
