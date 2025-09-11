"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "flowbite-react";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorType = searchParams.get("error_description");

  return (
    <div className="bg-brand-gris flex min-h-screen items-center justify-center px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md border-0 bg-white shadow-lg dark:bg-gray-800">
        <div className="p-6">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error de Autenticación
          </h1>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Error:</strong> {error || "Unknown"}
            </p>
            <p>
              <strong>Descripción:</strong> {errorType || "No description"}
            </p>
            <p>
              <strong>URL actual:</strong>{" "}
              {typeof window !== "undefined" ? window.location.href : ""}
            </p>
          </div>

          <div className="mt-4 rounded bg-gray-100 p-3 dark:bg-gray-700">
            <h3 className="mb-2 font-semibold">Debug Info:</h3>
            <pre className="overflow-auto text-xs">
              {JSON.stringify(
                {
                  error,
                  errorType,
                  timestamp: new Date().toISOString(),
                  userAgent:
                    typeof window !== "undefined" ? navigator.userAgent : "",
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div className="mt-4 space-y-2">
            <a
              href="/login"
              className="block w-full rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
            >
              Intentar de nuevo
            </a>
            <a
              href="/api/debug"
              className="block w-full rounded bg-gray-600 px-4 py-2 text-center text-white hover:bg-gray-700"
            >
              Ver Debug Info
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
