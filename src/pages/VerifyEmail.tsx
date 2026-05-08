import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";
import { apiJson } from "../lib/apiClient";

type Status = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!email || !token) {
        setStatus("error");
        setMessage("Missing verification token or email address.");
        return;
      }

      try {
        const data = await apiJson<{ message?: string }>(
          `/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
          { retries: 4 },
        );

        setStatus("success");
        setMessage(data?.message ?? "Email verified successfully.");
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to verify your email.");
      }
    };

    verifyEmail();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
              <Mail className="h-7 w-7 text-blue-600" />
            </div>
          </div>

          {status === "loading" && (
            <p className="text-sm text-slate-600">Verifying your email address...</p>
          )}

          {status === "success" && (
            <div>
              <div className="flex justify-center mb-3">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <p className="text-sm text-slate-700 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Login
              </Link>
            </div>
          )}

          {status === "error" && (
            <div>
              <div className="flex justify-center mb-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-sm text-slate-700 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
