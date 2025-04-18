import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(`/auth/error?error=Verification`);
    }

    // Look up the token in your database
    const verificationResult = await db.transaction(async (tx) => {
      // Find the token
      const tokenRecord = await tx.query.verificationTokens.findFirst({
        where: (tokens, { eq, gt }) =>
          eq(tokens.token, token) && gt(tokens.expires, new Date()),
      });

      if (!tokenRecord) {
        return { success: false };
      }

      // Find the user with the email from the token
      const email = tokenRecord.identifier;

      // Update the user's emailVerified field
      await tx
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.email, email));

      // Delete the used token
      await tx
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
      return { success: true };
    });

    if (verificationResult.success) {
      // Redirect to login page with success message
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?verified=true`
      );
    } else {
      // Redirect to error page
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=Verification`
      );
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=Verification`
    );
  }
}
