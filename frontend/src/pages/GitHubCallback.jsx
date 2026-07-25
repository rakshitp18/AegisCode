import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Connecting your GitHub account...");
  const [error, setError] = useState(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code provided by GitHub.");
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const exchangeCode = async () => {
      try {
        const res = await axiosClient.post("/api/auth/github/callback", { code });
        if (res.data?.success) {
          if (res.data.token) {
            localStorage.setItem("token", res.data.token);
          }
          setStatus(`Successfully authorized GitHub account @${res.data.githubUsername || "user"}! Redirecting...`);
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1200);
        } else {
          setError(res.data?.message || "Failed to connect GitHub account.");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "An error occurred during GitHub authorization.");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mx-auto shadow-xl shadow-black/40">
          <div className="flex gap-1">
            <div className="w-1.5 h-4.5 bg-white transform skew-x-[-15deg]"></div>
            <div className="w-1.5 h-4.5 bg-white transform skew-x-[-15deg]"></div>
          </div>
        </div>

        {error ? (
          <>
            <h2 className="text-lg font-bold text-red-400">GitHub Connection Failed</h2>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-xl border border-slate-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-slate-100">GitHub OAuth Authorization</h2>
            <div className="w-8 h-8 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
