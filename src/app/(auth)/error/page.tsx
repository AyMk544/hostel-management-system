"use client";

import { useSearchParams } from "next/navigation";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    default: "An error occurred during authentication.",
    Verification: "The verification link is invalid or has expired.",
    AccessDenied: "Please verify your email before signing in.",
    CredentialsSignin: "Invalid login credentials.",
  };

  const errorMessage = error
    ? errorMessages[error] || errorMessages.default
    : errorMessages.default;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-md">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <div className="mt-6">
            <p className="text-center text-sm text-gray-500">
              <a
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
