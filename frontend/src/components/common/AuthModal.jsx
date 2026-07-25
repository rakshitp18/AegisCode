import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import axiosClient from "../../api/axiosClient";
import { Eye, EyeOff } from "lucide-react";

export default function AuthModal({ isOpen, onClose, initialMode = "login", redirectTo = "/dashboard" }) {
  const { login, register, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode); // "login" | "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Synchronize state when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setApiError("");
      setSuccessMsg("");
      setErrors({});
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (mode === "register" && !name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Must be at least 6 characters";
    }
    if (mode === "register" && password !== confirmPassword) {
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

    if (mode === "login") {
      const result = await login(email, password);
      if (result.success) {
        onClose();
        navigate(redirectTo, { replace: true });
      } else {
        setApiError(result.message || "Invalid email or password. Please try again.");
      }
    } else {
      const result = await register(name, email, password);
      if (result.success) {
        setSuccessMsg("Account created! Redirecting to workspace...");
        setTimeout(() => {
          onClose();
          navigate(redirectTo, { replace: true });
        }, 1200);
      } else {
        setApiError(result.message || "Registration failed. Please check inputs.");
      }
    }
  };

  const switchMode = (targetMode) => {
    setMode(targetMode);
    setApiError("");
    setSuccessMsg("");
    setErrors({});
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#141417]/95 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl shadow-2xl relative z-10 select-none transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 cursor-pointer text-sm font-bold"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight select-none mb-6">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
            <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
          </div>
          <span>AegisCode</span>
        </div>

        {/* Form Title & Subtitle */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight mb-1 text-white">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-xs text-white/50">
            {mode === "login"
              ? "Enter your credentials to access the workspace"
              : "Register to start auditing code repositories"}
          </p>
        </div>

        {/* Status Alerts */}
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

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
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
                className={`w-full bg-[#1e1e24]/60 border rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all ${
                  errors.name ? "border-red-500/40" : "border-white/10"
                }`}
              />
              {errors.name && <span className="text-[10px] text-red-400">{errors.name}</span>}
            </div>
          )}

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
              className={`w-full bg-[#1e1e24]/60 border rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all ${
                errors.email ? "border-red-500/40" : "border-white/10"
              }`}
            />
            {errors.email && <span className="text-[10px] text-red-400">{errors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Password</label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder={showPassword ? "Enter password" : "••••••••"}
                disabled={authLoading}
                className={`w-full bg-[#1e1e24]/60 border rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all ${
                  errors.password ? "border-red-500/40" : "border-white/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span className="text-[10px] text-red-400">{errors.password}</span>}
          </div>

          {mode === "register" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Confirm Password</label>
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  placeholder={showConfirmPassword ? "Confirm password" : "••••••••"}
                  disabled={authLoading}
                  className={`w-full bg-[#1e1e24]/60 border rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all ${
                    errors.confirmPassword ? "border-red-500/40" : "border-white/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer p-1"
                  title={showConfirmPassword ? "Hide Password" : "Show Password"}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="text-[10px] text-red-400">{errors.confirmPassword}</span>}
            </div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-white text-black font-bold py-3 rounded-full text-xs uppercase tracking-wider hover:bg-white/90 active:scale-98 transition-all cursor-pointer shadow-lg mt-2 flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <span className="relative px-3 text-[10px] uppercase text-white/30 bg-[#141417]">Or</span>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              const res = await axiosClient.get("/api/auth/github/login-url");
              if (res.data?.enabled && res.data?.url) {
                window.location.href = res.data.url;
              } else {
                setApiError(res.data?.message || "GitHub OAuth is not configured on this server.");
              }
            } catch (err) {
              setApiError(err.response?.data?.message || err.message || "Failed to start GitHub authorization.");
            }
          }}
          className="w-full bg-[#1e1e24] hover:bg-[#282830] border border-white/10 text-white font-semibold py-2.5 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          Continue with GitHub
        </button>

        {/* Mode Toggle Footer */}
        <div className="mt-6 text-center text-xs text-white/40">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="text-white font-semibold hover:underline cursor-pointer ml-1"
              >
                Create account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-white font-semibold hover:underline cursor-pointer ml-1"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
