function Navbar({ onOpenFolder, onGitHub, onShowDashboard, currentFileId }) {
  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-slate-900 border-b border-slate-800 shrink-0 select-none">
      
      {/* Left side: Logo + Workspace actions */}
      <div className="flex items-center gap-5">
        <h1 className="text-xl font-extrabold text-blue-500 tracking-wider flex items-center gap-2 shrink-0">
          <span>🛡️</span> AegisCode
        </h1>

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

      {/* Right side: Landing page auth controls */}
      {!onOpenFolder && (
        <div className="flex items-center gap-3">
          <button
            className="text-xs text-slate-300 hover:text-white font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer bg-transparent border-none"
            onClick={() => alert("Login functionality coming soon in production release!")}
          >
            Log in
          </button>
          <button
            className="text-xs bg-blue-650 hover:bg-blue-600 text-white font-bold py-2 px-3.5 rounded-lg transition-all shadow-sm border border-blue-500/20 cursor-pointer"
            onClick={() => alert("Registration functionality coming soon in production release!")}
          >
            Sign up
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;