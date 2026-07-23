import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const { register, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authLoading) return;

    setApiError("");
    setSuccessMsg("");
    if (!validateForm()) return;

    const result = await register(name, email, password);
    if (result.success) {
      setSuccessMsg("Account created successfully! Loading dashboard...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } else {
      setApiError(result.message || "Registration failed. Please check your inputs.");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="flex items-center gap-2 font-bold text-xl tracking-tight select-none mb-8">
        <div className="flex gap-0.5">
          <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
          <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
        </div>
        AegisCode
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md bg-[#141417]/80 border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative z-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-1">Create an account</h2>
          <p className="text-xs text-white/50">Register to start auditing code repositories</p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="John Doe"
              disabled={authLoading}
              className={`w-full bg-[#1e1e24]/50 border rounded-xl py-2.5 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${
                errors.name ? "border-red-500/40" : "border-white/5"
              }`}
            />
            {errors.name && <span className="text-[10px] text-red-400">{errors.name}</span>}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="john@example.com"
              disabled={authLoading}
              className={`w-full bg-[#1e1e24]/50 border rounded-xl py-2.5 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${
                errors.email ? "border-red-500/40" : "border-white/5"
              }`}
            />
            {errors.email && <span className="text-[10px] text-red-400">{errors.email}</span>}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="••••••••"
              disabled={authLoading}
              className={`w-full bg-[#1e1e24]/50 border rounded-xl py-2.5 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${
                errors.password ? "border-red-500/40" : "border-white/5"
              }`}
            />
            {errors.password && <span className="text-[10px] text-red-400">{errors.password}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder="••••••••"
              disabled={authLoading}
              className={`w-full bg-[#1e1e24]/50 border rounded-xl py-2.5 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${
                errors.confirmPassword ? "border-red-500/40" : "border-white/5"
              }`}
            />
            {errors.confirmPassword && <span className="text-[10px] text-red-400">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {authLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Registering...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-white/40">
          Already have an account?{" "}
          <Link to="/login" className="text-white hover:underline font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
