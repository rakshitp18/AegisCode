import { useState, useEffect, useRef } from "react";
import { buildFileTree } from "../../utils/treeBuilder";

// Inline input node for file/folder creation and renaming
const InlineInputNode = ({ type, onSave, onCancel, initialValue = "" }) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (initialValue && !type) {
        // Renaming selection highlight: select name excluding extension
        const dotIndex = initialValue.lastIndexOf(".");
        if (dotIndex > 0) {
          inputRef.current.setSelectionRange(0, dotIndex);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [initialValue, type]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      const trimmed = value.trim();
      if (trimmed) {
        onSave(trimmed);
      } else {
        onCancel();
      }
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1.5 py-0.5 px-2 bg-slate-800/40 rounded border border-blue-500/30">
      <span className="text-xs shrink-0 select-none">
        {type === "folder" ? "📁" : "📄"}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          const trimmed = value.trim();
          if (trimmed) {
            onSave(trimmed);
          } else {
            onCancel();
          }
        }}
        className="w-full bg-slate-955/80 rounded px-1 py-0.5 text-xs text-white outline-none"
        placeholder={type === "folder" ? "Folder name..." : "File name..."}
      />
    </div>
  );
};

// Recursive Component for Tree Nodes
const FileTreeNode = ({
  node,
  currentFileId,
  onSelectFile,
  onAddNewFile,
  onAddNewFolder,
  onRenameItem,
  onTriggerDelete,
  openFolders,
  onToggleFolder,
  newItemInput,
  setNewItemInput,
  renamingPath,
  setRenamingPath,
  draggedPath,
  dragOverPath,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  handleAddNewItemSave,
}) => {
  const isFolder = node.isFolder;
  const isRenaming = renamingPath === node.path;
  const isDragOver = dragOverPath === node.path;

  // Handle Drag Start
  const dragStartHandler = (e) => {
    onDragStart(e, node.path);
  };

  // Handle Drag Over
  const dragOverHandler = (e) => {
    onDragOver(e, node);
  };

  if (isRenaming) {
    return (
      <div className="pl-4">
        <InlineInputNode
          initialValue={node.name}
          onSave={(newName) => {
            const parts = node.path.split("/");
            parts[parts.length - 1] = newName;
            const newPath = parts.join("/");
            onRenameItem(node.path, newPath);
            setRenamingPath(null);
          }}
          onCancel={() => setRenamingPath(null)}
        />
      </div>
    );
  }

  if (isFolder) {
    const isOpen = !!openFolders[node.path];

    const sortedKeys = Object.keys(node.children).sort((a, b) => {
      const childA = node.children[a];
      const childB = node.children[b];
      if (childA.isFolder && !childB.isFolder) return -1;
      if (!childA.isFolder && childB.isFolder) return 1;
      return a.localeCompare(b);
    });

    return (
      <div
        className="select-none"
        onDragOver={dragOverHandler}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.path, true)}
      >
        <div
          draggable
          onDragStart={dragStartHandler}
          onClick={() => onToggleFolder(node.path)}
          className={`group flex items-center justify-between py-0.5 px-1.5 hover:bg-slate-800/60 rounded cursor-pointer text-slate-350 hover:text-white text-xs font-semibold transition-colors ${
            isDragOver ? "bg-blue-600/10 border-l-2 border-blue-500 text-white" : ""
          }`}
        >
          <div className="flex items-center min-w-0">
            <span className="mr-1.5 w-3.5 h-3.5 flex items-center justify-center shrink-0 text-slate-500 transition-transform duration-150">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            <span className="text-yellow-500 mr-1.5 text-xs select-none">
              {isOpen ? "📂" : "📁"}
            </span>
            <span className="truncate">{node.name}</span>
          </div>

          {/* Action icons on hover */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewItemInput({ parentPath: node.path, type: "file" });
                onToggleFolder(node.path, true);
              }}
              className="text-[10px] hover:text-blue-400 text-slate-500 transition-colors p-0.5 cursor-pointer font-bold"
              title="New File..."
            >
              📄⁺
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNewItemInput({ parentPath: node.path, type: "folder" });
                onToggleFolder(node.path, true);
              }}
              className="text-[10px] hover:text-yellow-400 text-slate-500 transition-colors p-0.5 cursor-pointer font-bold"
              title="New Folder..."
            >
              📁⁺
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRenamingPath(node.path);
              }}
              className="hover:text-green-400 text-slate-500 transition-colors p-0.5 cursor-pointer"
              title="Rename Folder"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTriggerDelete(node);
              }}
              className="hover:text-red-400 text-slate-500 transition-colors p-0.5 cursor-pointer"
              title="Delete Folder"
            >
              🗑️
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="border-l border-slate-800/80 ml-2.5 pl-2 mt-0.5 space-y-0.5">
            {/* Inline creation input inside this folder */}
            {newItemInput && newItemInput.parentPath === node.path && (
              <div className="py-0.5">
                <InlineInputNode
                  type={newItemInput.type}
                  onSave={(name) => handleAddNewItemSave(name, node.path, newItemInput.type)}
                  onCancel={() => setNewItemInput(null)}
                />
              </div>
            )}

            {sortedKeys.map((key) => (
              <FileTreeNode
                key={key}
                node={node.children[key]}
                currentFileId={currentFileId}
                onSelectFile={onSelectFile}
                onAddNewFile={onAddNewFile}
                onAddNewFolder={onAddNewFolder}
                onRenameItem={onRenameItem}
                onTriggerDelete={onTriggerDelete}
                openFolders={openFolders}
                onToggleFolder={onToggleFolder}
                newItemInput={newItemInput}
                setNewItemInput={setNewItemInput}
                renamingPath={renamingPath}
                setRenamingPath={setRenamingPath}
                draggedPath={draggedPath}
                dragOverPath={dragOverPath}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                handleAddNewItemSave={handleAddNewItemSave}
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
          return <span className="text-orange-400 mr-1.5 font-semibold text-xs shrink-0">☕</span>;
        case "python":
          return <span className="text-sky-400 mr-1.5 font-semibold text-xs shrink-0">🐍</span>;
        case "cpp":
          return <span className="text-blue-400 mr-1.5 font-bold font-mono text-[10px] shrink-0">C++</span>;
        case "javascript":
          return <span className="text-yellow-400 mr-1.5 font-bold font-mono text-[10px] shrink-0">JS</span>;
        case "html":
          return <span className="text-orange-500 mr-1.5 font-semibold text-xs shrink-0">🌐</span>;
        case "css":
          return <span className="text-blue-500 mr-1.5 font-semibold text-xs shrink-0">🎨</span>;
        case "json":
          return <span className="text-emerald-400 mr-1.5 font-semibold text-xs shrink-0">{}</span>;
        case "markdown":
          return <span className="text-indigo-400 mr-1.5 font-semibold text-xs shrink-0">📝</span>;
        default:
          return <span className="text-slate-400 mr-1.5 text-xs shrink-0">📄</span>;
      }
    };

    return (
      <div
        draggable
        onDragStart={dragStartHandler}
        onDragOver={dragOverHandler}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, node.path, false)}
        onClick={() => onSelectFile(node.id)}
        className={`group flex items-center justify-between py-0.5 px-1.5 rounded cursor-pointer transition-all ${
          isActive
            ? "bg-slate-800 border-l-2 border-blue-500 text-white font-medium shadow-sm"
            : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        } ${isDragOver ? "bg-blue-600/10 border-l-2 border-blue-500" : ""}`}
      >
        <div className="flex items-center min-w-0">
          {getFileIcon(node.language)}
          <span className="truncate text-xs">{node.name}</span>
        </div>

        {/* Action icons on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenamingPath(node.path);
            }}
            className="hover:text-green-400 text-slate-500 transition-colors p-0.5 cursor-pointer"
            title="Rename File"
          >
            ✏️
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTriggerDelete(node);
            }}
            className="hover:text-red-400 text-slate-500 transition-colors p-0.5 cursor-pointer"
            title="Delete File"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  }
};

function Sidebar({
  projectId,
  projectName = "My Project",
  files = [],
  currentFileId,
  onSelectFile,
  onAddNewFile,
  onAddNewFolder,
  onRenameItem,
  onDeleteItem,
  onMoveItem,
  gitMetadata = null,
  isImporting = false,
}) {
  const [openFolders, setOpenFolders] = useState({});
  const [newItemInput, setNewItemInput] = useState(null); // { parentPath: "", type: "file" | "folder" }
  const [renamingPath, setRenamingPath] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { path: "", name: "", isFolder: boolean }

  const [draggedPath, setDraggedPath] = useState(null);
  const [dragOverPath, setDragOverPath] = useState(null);

  // Sync / load expansion states from localStorage when project changes
  useEffect(() => {
    if (!projectId) return;
    const saved = localStorage.getItem(`aegis_open_folders_${projectId}`);
    if (saved) {
      try {
        setOpenFolders(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Default: Auto-expand first level folder hierarchies on fresh syncs
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
  }, [projectId]);

  const handleToggleFolder = (folderPath, forceOpen = null) => {
    setOpenFolders((prev) => {
      const updated = {
        ...prev,
        [folderPath]: forceOpen !== null ? forceOpen : !prev[folderPath],
      };
      if (projectId) {
        localStorage.setItem(`aegis_open_folders_${projectId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleAddNewItemSave = (name, parentPath, type) => {
    const fullPath = parentPath ? `${parentPath}/${name}` : name;
    if (type === "file") {
      onAddNewFile(fullPath);
    } else {
      onAddNewFolder(fullPath);
    }
    setNewItemInput(null);

    // Auto expand parent
    if (parentPath) {
      handleToggleFolder(parentPath, true);
    }
  };

  const onTriggerDelete = (node) => {
    setDeleteConfirm({
      path: node.path,
      name: node.name,
      isFolder: node.isFolder,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onDeleteItem(deleteConfirm.path);
      setDeleteConfirm(null);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, path) => {
    e.stopPropagation();
    setDraggedPath(path);
    e.dataTransfer.setData("text/plain", path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, node) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.isFolder) {
      if (node.path !== draggedPath && !node.path.startsWith(draggedPath + "/")) {
        setDragOverPath(node.path);
      }
    } else {
      const parts = node.path.split("/");
      parts.pop();
      const parentPath = parts.join("/");
      if (parentPath !== draggedPath && !parentPath.startsWith(draggedPath + "/")) {
        setDragOverPath(parentPath || "root");
      }
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
  };

  const handleDrop = (e, targetPath, targetIsFolder) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
    const sourcePath = e.dataTransfer.getData("text/plain") || draggedPath;
    if (!sourcePath) return;

    let destinationFolder = targetPath;
    if (!targetIsFolder) {
      const parts = targetPath.split("/");
      parts.pop();
      destinationFolder = parts.join("/");
    }

    if (sourcePath === destinationFolder || destinationFolder.startsWith(sourcePath + "/")) {
      return;
    }

    onMoveItem(sourcePath, destinationFolder);
    setDraggedPath(null);
  };

  const handleRootDragOver = (e) => {
    e.preventDefault();
    if (draggedPath && draggedPath.includes("/")) {
      setDragOverPath("root");
    }
  };

  const handleRootDrop = (e) => {
    e.preventDefault();
    setDragOverPath(null);
    const sourcePath = e.dataTransfer.getData("text/plain") || draggedPath;
    if (!sourcePath) return;

    onMoveItem(sourcePath, "");
    setDraggedPath(null);
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
    <div
      onDragOver={handleRootDragOver}
      onDrop={handleRootDrop}
      className={`h-full bg-slate-900 p-3 flex flex-col justify-between select-none relative ${
        dragOverPath === "root" ? "bg-blue-600/5 border border-dashed border-blue-500" : ""
      }`}
    >
      <div className="flex flex-col min-h-0 flex-1">
        {/* Project Header */}
        <div className="flex items-center justify-between min-w-0 gap-2 mb-3 shrink-0 border-b border-slate-800/80 pb-2">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1 truncate min-w-0 pr-1" title={projectName}>
            <span className="text-slate-550 mr-0.5">/</span>{projectName}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setNewItemInput({ parentPath: "", type: "file" })}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs"
              title="New File at Root"
            >
              📄⁺
            </button>
            <button
              onClick={() => setNewItemInput({ parentPath: "", type: "folder" })}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer text-xs"
              title="New Folder at Root"
            >
              📁⁺
            </button>
          </div>
        </div>

        {/* Dynamic Recursive File Tree */}
        <div className="flex-1 overflow-y-auto space-y-0.5 py-1.5 min-h-0">
          {isImporting ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2 select-none">
              <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[10px] text-slate-500 font-medium">Syncing repository...</span>
            </div>
          ) : (
            <>
              {/* Root-level creation input */}
              {newItemInput && newItemInput.parentPath === "" && (
                <div className="mb-1">
                  <InlineInputNode
                    type={newItemInput.type}
                    onSave={(name) => handleAddNewItemSave(name, "", newItemInput.type)}
                    onCancel={() => setNewItemInput(null)}
                  />
                </div>
              )}

              {sortedRootKeys.length > 0 ? (
                sortedRootKeys.map((key) => (
                  <FileTreeNode
                    key={key}
                    node={fileTree.children[key]}
                    currentFileId={currentFileId}
                    onSelectFile={onSelectFile}
                    onAddNewFile={onAddNewFile}
                    onAddNewFolder={onAddNewFolder}
                    onRenameItem={onRenameItem}
                    onTriggerDelete={onTriggerDelete}
                    openFolders={openFolders}
                    onToggleFolder={handleToggleFolder}
                    newItemInput={newItemInput}
                    setNewItemInput={setNewItemInput}
                    renamingPath={renamingPath}
                    setRenamingPath={setRenamingPath}
                    draggedPath={draggedPath}
                    dragOverPath={dragOverPath}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    handleAddNewItemSave={handleAddNewItemSave}
                  />
                ))
              ) : (
                <div className="text-xs text-slate-500 italic p-2 text-center select-none">
                  No files in project. Click the file/folder icons above to create one.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {gitMetadata && (
        <div className="shrink-0 pt-2.5 border-t border-slate-800 mt-2">
          <a
            href={gitMetadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current text-slate-400" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub Repository
          </a>
        </div>
      )}

      {/* Centered Premium Delete Confirmation Popup Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#141417]/95 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4 animate-scaleUp text-center">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {deleteConfirm.isFolder ? "Delete Folder" : "Delete File"}
              </h3>
              <p className="text-xs text-slate-400 px-2 leading-relaxed">
                Are you sure you want to delete {deleteConfirm.isFolder ? "folder" : "file"} <span className="font-bold text-slate-200">'{deleteConfirm.name}'</span>{deleteConfirm.isFolder ? " and all of its contents?" : "?"}
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 px-4 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-700/55 hover:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 px-4 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;