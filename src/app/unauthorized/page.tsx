import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg text-muted-foreground mb-8">
        You do not have permission to access this page.
      </p>
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>
    </div>
  );
} 