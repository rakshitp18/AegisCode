import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectContext } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/common/Navbar";
import TyndallParticles from "../components/ui/TyndallParticles";
import CreateProjectModal from "../components/dashboard/CreateProjectModal";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, deleteProject, loading, error } = useProjectContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e, id, name) => {
    e.stopPropagation();
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const res = await deleteProject(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    if (!res.success) {
      alert(res.message);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get 3 most recent projects based on creation date or ID
  const recentProjects = [...projects]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-white selection:text-black">
      {/* Tyndall Particles Ambient Background */}
      <TyndallParticles className="z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar Header */}
        <Navbar />

        {/* Dashboard Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Welcome, Actions & Project Catalog */}
          <div className="flex-1 space-y-8">
            
            {/* Welcome Banner */}
            <div className="glow-card p-6 rounded-2xl border border-white/5 bg-[#141417]/40 backdrop-blur-md">
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-blue-500/20">
                Secure Code Auditor
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 text-slate-100">
                Welcome back, <span className="text-blue-500 font-mono text-xl sm:text-2xl">{user?.email || "auditor"}</span>!
              </h2>
              <p className="text-xs text-white/55 mt-1.5 leading-relaxed max-w-xl">
                Audit, evaluate complexity distribution structures, and discover critical vulnerabilities or refactoring opportunities in your codebases.
              </p>
            </div>

            {/* Catalog Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#141417]/20 border border-white/5 p-4 rounded-xl backdrop-blur-sm">
              
              {/* Search projects */}
              <div className="relative w-full sm:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full bg-[#1e1e24]/40 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500/40 transition-all"
                />
              </div>

              {/* Create New Project trigger */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto text-xs bg-white text-black hover:bg-white/90 active:scale-98 font-bold py-2.5 px-4.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-white/5 cursor-pointer uppercase tracking-wider"
              >
                <span>➕</span> Create New Project
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-955/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Projects list */}
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="relative w-10 h-10 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                  </div>
                  <p className="text-xs text-white/40 font-medium">Fetching codebase registry...</p>
                </div>
              </div>
            ) : projects.length === 0 ? (
              /* Empty State */
              <div className="glow-card p-12 text-center rounded-3xl border border-white/5 bg-[#141417]/20 backdrop-blur-md py-16">
                <span className="text-5xl block mb-4 select-none">🛡️</span>
                <h3 className="text-lg font-bold text-slate-100">No Audited Projects Yet</h3>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-2 leading-relaxed">
                  Start auditing your local codebase or import a repository directly from GitHub to run automated scans.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 uppercase tracking-wide shadow-lg shadow-blue-950/45"
                >
                  <span>➕</span> Create First Project
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              /* No search results */
              <div className="text-center py-16 text-slate-500">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-xs">No projects match &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              /* Grid layout of project cards */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/workspace/${project.id}`)}
                    className="glow-card p-5 rounded-2xl border border-white/5 bg-[#141417]/30 hover:bg-[#141417]/60 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:translate-y-[-2px] group relative overflow-hidden"
                  >
                    <div>
                      {/* Subtle hover top highlights */}
                      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-slate-100 group-hover:text-blue-400 transition-colors leading-tight text-base truncate pr-2">
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            ID: {project.id}
                          </span>
                          <button
                            onClick={(e) => handleDeleteClick(e, project.id, project.name)}
                            className="text-white/30 hover:text-white/80 transition-colors cursor-pointer p-0.5 rounded"
                            title="Delete Project"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-white/55 mt-2 line-clamp-2 leading-relaxed min-h-[36px]">
                        {project.description || "No project description provided."}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-3.5 mt-4 flex items-center justify-between text-[11px] text-white/40">
                      <span>Created: {formatDate(project.createdAt)}</span>
                      <span className="text-blue-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Open Workspace <span>→</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Projects Sideboard */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="glow-card p-5 rounded-2xl border border-white/5 bg-[#141417]/40 backdrop-blur-md">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <span>⏱️</span> Recent Projects
              </h3>

              {projects.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs italic">
                  No active projects
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => navigate(`/workspace/${project.id}`)}
                      className="p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-xs text-slate-200 group-hover:text-blue-400 transition-colors block truncate">
                          {project.name}
                        </span>
                        <span className="text-[10px] text-white/30 block mt-0.5">
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                      <span className="text-xs text-white/30 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0">
                        ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Audit Tips Card */}
            <div className="glow-card p-5 rounded-2xl border border-white/5 bg-[#141417]/20 backdrop-blur-sm">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-2">
                <span>💡</span> Fast Auditing Tip
              </h4>
              <p className="text-[11px] text-white/45 leading-relaxed">
                Connect your GitHub repositories dynamically using a public URL. AegisCode automatically indexes and models AST complexity, structure, and vulnerability issues across all source files.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Creation Modal Dialogue */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          onClick={() => !isDeleting && setDeleteTarget(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 bg-[#111115] border border-white/8 rounded-2xl px-8 py-7 w-[360px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
            </div>

            <p className="text-center text-sm font-semibold text-white mb-1">Delete project?</p>
            <p className="text-center text-xs text-white/40 mb-6 leading-relaxed">
              <span className="text-white/70 font-medium">{deleteTarget.name}</span> and all its analyses will be permanently removed.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-white/8 hover:bg-white/12 text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
