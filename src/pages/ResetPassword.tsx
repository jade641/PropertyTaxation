import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { apiJson } from "../lib/apiClient";

type Status = "idle" | "loading" | "success" | "error";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (!email || !token) {
      setStatus("error");
      setMessage("Missing reset token or email address.");
      return;
    }

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const data = await apiJson<{ message?: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, token, newPassword }),
        retries: 4,
      });

      setStatus("success");
      setMessage(data?.message ?? "Password reset successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to reset your password.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Lock className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-slate-900">Reset Password</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            Enter a new password for your account.
          </p>

          {status === "error" && message && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}

          {status === "success" ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Resetting..." : "Reset Password"}
              </button>
              <Link
                to="/login"
                className="block text-center text-sm text-slate-600 hover:text-blue-600 transition-colors font-medium"
              >
                Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
