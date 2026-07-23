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
        <h1 
          onClick={() => navigate(isAuthenticated() ? "/dashboard" : "/")}
          className="text-xl font-extrabold text-blue-500 tracking-wider flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
        >
          <span>🛡️</span> AegisCode
        </h1>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 py-1">
          {onOpenFolder && (
            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold py-1.5 px-3.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              title="Return to Projects Dashboard"
            >
              <span>🏠</span> Projects
            </button>
          )}

          {projectLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <svg className="animate-spin h-3.5 w-3.5 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing...</span>
            </div>
          ) : projects.length > 0 ? (
            <div className="flex items-center gap-2">
              <select
                value={currentProject?.id || ""}
                onChange={(e) => {
                  const selected = projects.find((p) => p.id === Number(e.target.value));
                  if (selected) {
                    selectProject(selected);
                    navigate(`/workspace/${selected.id}`);
                  }
                }}
                className="bg-slate-800 hover:bg-[#1a1a22] text-slate-200 border border-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-xs text-slate-500 italic">No projects found</span>
          )}

          {/* New Project trigger button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-2 text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            title="Create New Project"
          >
            <span>➕</span> New Project
          </button>
        </div>

        {onOpenFolder && (
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