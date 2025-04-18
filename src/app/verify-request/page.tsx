export default function VerifyRequest() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow rounded-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            A verification link has been sent to your email address. Please
            check your inbox and click the link to verify your account.
          </p>
        </div>
        <div className="mt-6">
          <p className="text-center text-sm text-gray-500">
            If you don't see the email, check your spam folder or
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {" "}
              return to login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
