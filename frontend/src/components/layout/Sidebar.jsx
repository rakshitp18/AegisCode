function Sidebar({
  projectName = "My Project",
  files = [],
  currentFileId,
  onSelectFile,
  onAddNewFile,
  onDeleteFile,
}) {
  const getFileIcon = (language) => {
    switch (language) {
      case "java":
        return <span className="text-orange-400 mr-2 font-semibold">☕</span>;
      case "python":
        return <span className="text-sky-400 mr-2 font-semibold">🐍</span>;
      case "cpp":
        return <span className="text-blue-400 mr-2 font-bold font-mono text-xs">C++</span>;
      case "javascript":
        return <span className="text-yellow-400 mr-2 font-bold font-mono text-xs">JS</span>;
      default:
        return <span className="text-slate-400 mr-2">📄</span>;
    }
  };

  return (
    <div className="h-full bg-slate-900 p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-6 text-slate-200">
          Explorer
        </h2>

        {/* Project Header and Actions */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 truncate pr-2">
            <span>📁</span> {projectName}
          </span>
          <button
            onClick={onAddNewFile}
            className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0"
            title="Create New File"
          >
            <span>+</span> New File
          </button>
        </div>

        {/* Dynamic File List */}
        <div className="space-y-1 max-h-[350px] overflow-y-auto">
          {files.map((file) => {
            const isActive = file.id === currentFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-slate-800 border-l-2 border-blue-500 text-white font-medium shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <div className="flex items-center min-w-0">
                  {getFileIcon(file.language)}
                  <span className="truncate text-sm">{file.name}</span>
                </div>

                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-opacity p-0.5"
                    title="Delete File"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <hr className="my-6 border-slate-800" />
        <div className="space-y-4 text-sm text-slate-400">
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>🐙</span> GitHub Repository
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>🕘</span> History
          </div>
          <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
            <span>⚙</span> Settings
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;