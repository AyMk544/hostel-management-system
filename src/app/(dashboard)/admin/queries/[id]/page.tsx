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
import { ArrowLeft, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/api-utils";

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
  const [status, setStatus] = useState<"pending" | "in_progress" | "resolved">("pending");
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
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "in_progress":
        return <Badge variant="default" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> In Progress</Badge>;
      case "resolved":
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Resolved</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!query) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Query Not Found</h2>
        <p className="text-muted-foreground mb-4">The query you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/admin/queries">
          <Button>Back to Queries</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 text-zinc-900">
      <Link href="/admin/queries" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Queries
      </Link>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{query.title}</CardTitle>
                <CardDescription>
                  Submitted by {query.studentName} on {formatDate(query.createdAt)}
                </CardDescription>
              </div>
              {getStatusBadge(query.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <div className="p-4 bg-zinc-50 rounded-md text-zinc-800 whitespace-pre-wrap">
                  {query.description}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as "pending" | "in_progress" | "resolved")}
                  >
                    <SelectTrigger id="status" className="bg-white text-zinc-900">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="pending" className="text-zinc-900">Pending</SelectItem>
                      <SelectItem value="in_progress" className="text-zinc-900">In Progress</SelectItem>
                      <SelectItem value="resolved" className="text-zinc-900">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response">Admin Response {status === "resolved" && <span className="text-destructive">*</span>}</Label>
                  <Textarea
                    id="response"
                    placeholder="Enter your response to this query"
                    className="min-h-[120px] bg-white text-zinc-900"
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                  {status === "resolved" && (
                    <p className="text-sm text-muted-foreground">
                      A response is required when marking a query as resolved
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitting ? "Updating..." : "Update Query"}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 