import { useRef, useState, useEffect } from "react";
import { importFolder } from "../../services/folderImportService";
import { buildFileTree } from "../../utils/treeBuilder";

// Recursive Component for Tree Nodes
const FileTreeNode = ({
  node,
  depth = 0,
  currentFileId,
  onSelectFile,
  onDeleteFile,
  openFolders,
  onToggleFolder,
  filesCount,
}) => {
  const indentClass = depth > 0 ? "pl-2" : "";

  if (node.isFolder) {
    const isOpen = !!openFolders[node.path];
    
    // Sort folder children: folders first, then files, both alphabetically
    const sortedKeys = Object.keys(node.children).sort((a, b) => {
      const childA = node.children[a];
      const childB = node.children[b];
      if (childA.isFolder && !childB.isFolder) return -1;
      if (!childA.isFolder && childB.isFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div className={`select-none ${indentClass}`}>
        <div
          onClick={() => onToggleFolder(node.path)}
          className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-slate-800/60 rounded cursor-pointer text-slate-300 text-sm font-medium transition-colors"
        >
          <span className="text-slate-400">{isOpen ? "📂" : "📁"}</span>
          <span className="truncate">{node.name}</span>
        </div>
        {isOpen && (
          <div className="border-l border-slate-800 ml-3.5 pl-2 mt-0.5 space-y-0.5">
            {sortedKeys.map((key) => (
              <FileTreeNode
                key={key}
                node={node.children[key]}
                depth={depth + 1}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                openFolders={openFolders}
                onToggleFolder={onToggleFolder}
                filesCount={filesCount}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    const isActive = node.id === currentFileId;
    
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
        case "html":
          return <span className="text-orange-500 mr-2 font-semibold">🌐</span>;
        case "css":
          return <span className="text-blue-500 mr-2 font-semibold">🎨</span>;
        case "json":
          return <span className="text-emerald-400 mr-2 font-semibold">{}</span>;
        case "markdown":
          return <span className="text-indigo-400 mr-2 font-semibold">📝</span>;
        default:
          return <span className="text-slate-400 mr-2">📄</span>;
      }
    };

    return (
      <div
        onClick={() => onSelectFile(node.id)}
        className={`group flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-all ${
          isActive
            ? "bg-slate-800 border-l-2 border-blue-500 text-white font-medium shadow-sm"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        }`}
      >
        <div className="flex items-center min-w-0">
          {getFileIcon(node.language)}
          <span className="truncate text-sm">{node.name}</span>
        </div>

        {filesCount > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-slate-500 transition-opacity p-0.5"
            title="Delete File"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
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
  }
};

function Sidebar({
  projectName = "My Project",
  files = [],
  currentFileId,
  onSelectFile,
  onAddNewFile,
  onDeleteFile,
  onImportProject,
  setAlertInfo,
  stats = { totalFiles: 0, totalFolders: 0, languages: [] },
}) {
  const fileInputRef = useRef(null);
  const [openFolders, setOpenFolders] = useState({});

  // Auto-expand all folders when new files are loaded/imported
  useEffect(() => {
    const initialOpen = {};
    files.forEach((file) => {
      const path = file.path || file.name;
      const parts = path.split("/");
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        initialOpen[currentPath] = true;
      }
    });
    setOpenFolders(initialOpen);
  }, [files]);

  const handleOpenFolderClick = () => {
    // 14. Error Handling: Unsupported browser check
    const isSupported =
      typeof HTMLInputElement !== "undefined" &&
      "webkitdirectory" in HTMLInputElement.prototype;

    if (!isSupported) {
      setAlertInfo({
        title: "Browser Unsupported",
        message: "Your browser does not support folder uploading. Please try using a modern browser like Chrome, Edge, or Firefox."
      });
      return;
    }
    fileInputRef.current.click();
  };

  const handleFolderUpload = async (e) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    try {
      const result = await importFolder(rawFiles);
      onImportProject(result.projectName, result.files);
    } catch (err) {
      console.error(err);
      setAlertInfo({
        title: "Folder Import Failed",
        message: err.message || "An unexpected error occurred while importing the folder."
      });
    } finally {
      // Clear file input so uploading the same folder again triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleFolder = (folderPath) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Convert flat files array to dynamic folder tree representation
  const fileTree = buildFileTree(files);
  const sortedRootKeys = Object.keys(fileTree.children).sort((a, b) => {
    const childA = fileTree.children[a];
    const childB = fileTree.children[b];
    if (childA.isFolder && !childB.isFolder) return -1;
    if (!childA.isFolder && childB.isFolder) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="h-full bg-slate-900 p-4 flex flex-col justify-between select-none">
      <div className="flex flex-col min-h-0">
        <h2 className="text-xl font-bold mb-6 text-slate-200">
          Explorer
        </h2>

        {/* Project Header and Actions */}
        <div className="flex flex-col gap-2.5 mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 truncate pr-2" title={projectName}>
              <span>📁</span> {projectName}
            </span>
            <button
              onClick={onAddNewFile}
              className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0 font-medium"
              title="Create New File"
            >
              <span>+</span> New File
            </button>
          </div>

          <button
            onClick={handleOpenFolderClick}
            className="w-full text-xs bg-blue-600 text-white hover:bg-blue-500 font-semibold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm border border-blue-500/20 cursor-pointer"
          >
            <span>📁</span> Open Folder
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFolderUpload}
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
          />
        </div>

        {/* Dynamic Recursive File Tree */}
        <div className="flex-1 overflow-y-auto space-y-0.5 border-t border-b border-slate-800/80 py-2.5 my-1">
          {sortedRootKeys.length > 0 ? (
            sortedRootKeys.map((key) => (
              <FileTreeNode
                key={key}
                node={fileTree.children[key]}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onDeleteFile={onDeleteFile}
                openFolders={openFolders}
                onToggleFolder={handleToggleFolder}
                filesCount={files.length}
              />
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-2 text-center">No files in project</div>
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-4">
        {/* Project Statistics UI Panel */}
        <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-300 uppercase tracking-wider text-[9px] mb-1.5 flex items-center gap-1">
            <span>📊</span> Project Statistics
          </div>
          <div className="flex justify-between">
            <span>Total Files:</span>
            <span className="font-semibold text-slate-200">{stats.totalFiles}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Folders:</span>
            <span className="font-semibold text-slate-200">{stats.totalFolders}</span>
          </div>
          <div className="flex flex-col gap-1 mt-1 border-t border-slate-800/40 pt-1.5">
            <span>Languages:</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {stats.languages && stats.languages.length > 0 ? (
                stats.languages.map((lang) => (
                  <span
                    key={lang}
                    className="bg-slate-800/80 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded text-[9px] font-mono capitalize"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <span className="italic text-slate-600 text-[10px]">None detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-400 border-t border-slate-800 pt-3">
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