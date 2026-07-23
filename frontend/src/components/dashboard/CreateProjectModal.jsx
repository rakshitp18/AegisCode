import { useState } from "react";
import { useProjectContext } from "../../contexts/ProjectContext";

export default function CreateProjectModal({ isOpen, onClose }) {
  const { createProject, loading } = useProjectContext();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setValidationError("");
    setSubmitError("");

    if (!name.trim()) {
      setValidationError("Project name is required");
      return;
    }

    const result = await createProject({
      name: name.trim(),
      description: description.trim(),
      githubUrl: githubUrl.trim(),
    });

    if (result.success) {
      setName("");
      setDescription("");
      setGithubUrl("");
      onClose();
    } else {
      setSubmitError(result.message || "Failed to create project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-[#141417] border border-white/5 p-6 rounded-3xl shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-lg transition-colors cursor-pointer border-none bg-transparent"
        >
          ✕
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight mb-1">Create new project</h3>
          <p className="text-xs text-white/50">Organize your code audits and metrics</p>
        </div>

        {submitError && (
          <div className="mb-4 p-3 bg-red-955/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError) setValidationError("");
              }}
              placeholder="e.g. AegisCode Core"
              disabled={loading}
              className={`w-full bg-[#1e1e24]/50 border rounded-xl py-2 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all ${
                validationError ? "border-red-500/40" : "border-white/5"
              }`}
            />
            {validationError && <span className="text-[10px] text-red-400">{validationError}</span>}
          </div>

          {/* Description Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Audit reports for core backend modules"
              disabled={loading}
              rows={3}
              className="w-full bg-[#1e1e24]/50 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none"
            />
          </div>

          {/* GitHub URL Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              GitHub Repository URL
            </label>
            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="e.g. https://github.com/owner/repo"
              disabled={loading}
              className="w-full bg-[#1e1e24]/50 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 px-5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
