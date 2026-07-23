import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { MagneticDock } from "../ui/MagneticDock";
import CreateProjectModal from "../dashboard/CreateProjectModal";

/* ─── SVG Icons for dock items ──────────────────────────────────── */
function IconProjects() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/* ─── Navbar ─────────────────────────────────────────────────────── */
function Navbar({ onOpenFolder, onGitHub, onShowDashboard, currentFileId }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  /* Dock items — only rendered inside workspace (when onOpenFolder is provided) */
  const workspaceDockItems = [
    {
      id: "projects",
      label: "Projects",
      icon: <IconProjects />,
      onClick: () => navigate("/dashboard"),
    },
    {
      id: "open-folder",
      label: "Open Folder",
      icon: <IconFolder />,
      onClick: onOpenFolder,
    },
    {
      id: "github",
      label: "GitHub Import",
      icon: <IconGitHub />,
      onClick: onGitHub,
    },
    {
      id: "analysis",
      label: "Analysis",
      icon: <IconDashboard />,
      onClick: onShowDashboard,
      isActive: currentFileId === null,
    },
  ];

  return (
    <>
      {/* ── Top bar: brand + user ────────────────────────────────── */}
      <nav className="flex justify-between items-center px-8 py-3.5 bg-[#0a0a0d]/90 backdrop-blur-sm border-b border-white/5 shrink-0 select-none z-40 overflow-visible">
        {/* Brand logo */}
        <div
          onClick={() => navigate(isAuthenticated() ? "/dashboard" : "/")}
          className="flex items-center gap-2 font-bold text-sm tracking-tight cursor-pointer hover:opacity-80 transition-opacity text-white shrink-0"
        >
          <div className="flex gap-0.5">
            <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
            <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
          </div>
          <span>AegisCode</span>
        </div>

        {/* Center: magnetic dock (workspace only) */}
        <div className="flex-1 flex justify-center items-center">
          {onOpenFolder && (
            <MagneticDock
              items={workspaceDockItems}
              iconSize={32}
              maxScale={1.35}
              magneticDistance={90}
              showLabels={true}
              variant="transparent"
            />
          )}
        </div>

        {/* Right: user */}
        <div className="flex items-center gap-3">
          {isAuthenticated() ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/35 font-mono hidden sm:inline">{user?.email}</span>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="text-xs text-white/50 hover:text-white/90 border border-white/8 hover:border-white/20 font-medium py-1.5 px-3.5 rounded-lg transition-all cursor-pointer bg-white/3 hover:bg-white/6"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-xs bg-white text-black font-bold py-1.5 px-3.5 rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}

export default Navbar;