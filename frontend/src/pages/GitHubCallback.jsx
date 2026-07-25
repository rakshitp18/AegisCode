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
        <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto shadow-inner">
          <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
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
