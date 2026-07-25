import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useProjectContext } from "../../contexts/ProjectContext";
import axiosClient from "../../api/axiosClient";
import SmoothTab from "../ui/SmoothTab";

const NAV_TABS = [
  {
    id: "Home",
    title: "Home",
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    id: "Editor",
    title: "Editor",
    color: "bg-indigo-500 hover:bg-indigo-600",
  },
  {
    id: "FileAnalysis",
    title: "Inspect File",
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    id: "ProjectAnalysis",
    title: "Inspect Project",
    color: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    id: "Chat",
    title: "Chat",
    color: "bg-amber-500 hover:bg-amber-600",
  },
  {
    id: "History",
    title: "History",
    color: "bg-rose-500 hover:bg-rose-600",
  },
];

function Navbar({ onOpenFolder, githubUrl, onImportGitHub, isSyncing = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { currentProject } = useProjectContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState({ connected: false, username: null });
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated()) {
      axiosClient
        .get("/api/auth/github/status")
        .then((res) => {
          if (res.data?.connected) {
            setGithubStatus({
              connected: true,
              username: res.data.githubUsername || null,
            });
          } else {
            setGithubStatus({ connected: false, username: null });
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/inspect-file")) return "FileAnalysis";
    if (path.includes("/project-ai")) return "ProjectAnalysis";
    if (path.includes("/chat")) return "Chat";
    if (path.includes("/history")) return "History";
    if (path.includes("/workspace/")) return "Editor";
    return "Home";
  };

  const handleTabChange = (tabId) => {
    if (!currentProject) return;
    switch (tabId) {
      case "Home":
        navigate("/dashboard");
        break;
      case "Editor":
        navigate(`/workspace/${currentProject.id}`);
        break;
      case "FileAnalysis":
        navigate(`/workspace/${currentProject.id}/inspect-file`);
        break;
      case "ProjectAnalysis":
        navigate(`/workspace/${currentProject.id}/project-ai`);
        break;
      case "Chat":
        navigate(`/workspace/${currentProject.id}/chat`);
        break;
      case "History":
        navigate(`/workspace/${currentProject.id}/history`);
        break;
      default:
        break;
    }
  };

  const activeTab = getActiveTab();

  return (
    <nav className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center px-6 py-2.5 bg-[#0a0a0d]/80 backdrop-blur-md border-b border-white/5 select-none gap-4">
      {/* Col 1: Brand */}
      <div
        onClick={() => navigate(isAuthenticated() ? "/dashboard" : "/")}
        className="flex items-center gap-2 font-bold text-sm tracking-tight cursor-pointer hover:opacity-80 transition-opacity text-white w-fit shrink-0"
      >
        <div className="flex gap-0.5">
          <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
          <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
        </div>
        <span>AegisCode</span>
      </div>

      {/* Col 2: Nav actions (workspace only) */}
      <div className="flex justify-center items-center w-full min-w-0">
        {onOpenFolder && (
          <SmoothTab
            items={NAV_TABS}
            selected={activeTab}
            onChange={handleTabChange}
            className="w-[620px] sm:w-[720px] shrink-0"
          />
        )}
      </div>

      {/* Col 3: Actions & User */}
      <div className="flex items-center gap-3 justify-end flex-nowrap shrink-0">
        {/* Workspace specific actions rendered on the right */}
        {onOpenFolder && (
          <div className="flex items-center gap-2 shrink-0 pr-6 mr-3 border-r border-white/5">
            {/* Minimal folder upload button */}
            <button
              onClick={onOpenFolder}
              title="Upload Local Folder"
              className="flex items-center justify-center p-2 rounded-xl border border-white/5 bg-zinc-950/80 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 cursor-pointer shadow-sm text-xs font-semibold gap-1.5 shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-400">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <span className="hidden lg:inline">Upload Folder</span>
            </button>

            {/* Sync / Import GitHub repository button */}
            {onImportGitHub && (
              <button
                onClick={(e) => {
                  if (isSyncing) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  onImportGitHub(e);
                }}
                disabled={isSyncing}
                title={isSyncing ? "Syncing repository..." : githubUrl ? "Fetch files from GitHub repository" : "Configure GitHub repository URL"}
                className={`flex items-center justify-center p-2 rounded-xl border border-blue-900/30 bg-blue-950/20 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-all duration-200 shadow-sm text-xs font-semibold gap-1.5 shrink-0 animate-fadeIn ${
                  isSyncing ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                }`}
              >
                {isSyncing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden lg:inline">Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span className="hidden lg:inline">{githubUrl ? "Sync GitHub" : "Import GitHub"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {isAuthenticated() ? (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 px-3 rounded-xl border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-200 cursor-pointer select-none"
            >
              {user?.image ? (
                <img src={user.image} alt="User Avatar" className="w-6.5 h-6.5 rounded-full object-cover border border-white/10 shadow-sm" />
              ) : (
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-[10px] uppercase border border-white/10">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
              <span className="text-xs font-semibold text-zinc-300 hidden sm:inline max-w-[100px] truncate">
                {user?.name || user?.email?.split("@")[0]}
              </span>
              <svg
                className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/5 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-fadeIn">
                <div className="px-3.5 py-2.5 text-left">
                  <p className="text-xs font-bold text-white truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5" title={user?.email}>{user?.email}</p>
                </div>
                <div className="h-[1px] bg-white/5 my-1"></div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer border-none bg-transparent"
                >
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </button>
                {githubStatus.connected ? (
                  <div className="w-full flex items-center justify-between px-3.5 py-2 my-1 rounded-xl text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 select-none">
                    <div className="flex items-center gap-2 font-medium">
                      <svg className="w-4 h-4 fill-current text-emerald-400" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                      <span className="text-[11px] truncate font-semibold">
                        GitHub Connected
                      </span>
                    </div>
                    <span className="flex h-2 w-2 relative shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      try {
                        const res = await axiosClient.get("/api/auth/github/login-url");
                        if (res.data?.enabled && res.data?.url) {
                          window.location.href = res.data.url;
                        } else {
                          alert(res.data?.message || "GitHub OAuth is not configured on this server.");
                        }
                      } catch (err) {
                        alert("Failed to start GitHub authorization.");
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors text-left cursor-pointer border-none bg-transparent"
                  >
                    <svg className="w-4 h-4 fill-current text-blue-400" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    Connect GitHub Account
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left cursor-pointer border-none bg-transparent"
                >
                  <svg className="w-4 h-4 text-red-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-xs bg-white text-black font-bold py-1.5 px-3.5 rounded-lg hover:bg-white/90 transition-colors cursor-pointer shrink-0"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;