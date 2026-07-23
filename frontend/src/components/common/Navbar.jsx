import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "../../contexts/ProjectContext";
import { useAuth } from "../../contexts/AuthContext";
import CreateProjectModal from "../dashboard/CreateProjectModal";

function Navbar({ onOpenFolder, onGitHub, onShowDashboard, currentFileId }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { projects, currentProject, selectProject, loading: projectLoading } = useProjectContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-slate-900 border-b border-slate-800 shrink-0 select-none">
      
      {/* Left side: Logo + Project Select + Workspace actions */}
      <div className="flex items-center gap-5">
        <div 
          onClick={() => navigate(isAuthenticated() ? "/dashboard" : "/")}
          className="flex items-center gap-2 font-bold text-sm tracking-tight select-none cursor-pointer hover:opacity-90 active:scale-98 transition-all text-white shrink-0"
        >
          <div className="flex gap-0.5">
            <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]"></div>
            <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]"></div>
          </div>
          <span>AegisCode</span>
        </div>

        {onOpenFolder && (
          <>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-4 py-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold py-1.5 px-3.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                title="Return to Projects Dashboard"
              >
                <span>🏠</span> Projects
              </button>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4 py-1">
              <button
                onClick={onOpenFolder}
                className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>📁</span> Open Folder
              </button>
              <button
                onClick={onGitHub}
                className="text-xs bg-slate-800 hover:bg-slate-755 text-slate-200 border border-slate-700 font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>GitHub</span>
              </button>
              <button
                onClick={onShowDashboard}
                className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 border cursor-pointer shadow-sm ${
                  currentFileId === null
                    ? "bg-blue-600 border-blue-500 text-white font-bold"
                    : "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800"
                }`}
              >
                <span>📊</span> Dashboard
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right side: User credentials and logout */}
      <div className="flex items-center gap-3">
        {isAuthenticated() ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">{user?.email}</span>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-xs bg-slate-850 hover:bg-red-950/20 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/20 font-semibold py-1.5 px-3.5 rounded-lg transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-xs bg-white text-black font-bold py-1.5 px-3.5 rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Create Project Modal Dialog */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </nav>
  );
}

export default Navbar;