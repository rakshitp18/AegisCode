import { useState, useRef, useEffect } from "react";
import { importFolder } from "../../services/folderImportService";

function UploadFolderModal({ isOpen, onClose, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const folderInputRef = useRef(null);
  const filesInputRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Recursively retrieve all file objects from files/directories dropped
  const getAllFilesFromEntry = async (entry, path = "") => {
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file((file) => {
          // Set relative path dynamically so importFolder knows the directory structure
          const relativePath = path ? `${path}/${file.name}` : file.name;
          file.relativePath = relativePath;
          resolve([file]);
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const allEntries = [];

      const readBatch = () => {
        return new Promise((resolveReader, rejectReader) => {
          dirReader.readEntries((entries) => {
            if (entries.length === 0) {
              resolveReader();
            } else {
              allEntries.push(...entries);
              readBatch().then(resolveReader);
            }
          }, rejectReader);
        });
      };

      try {
        await readBatch();
        const files = [];
        for (const childEntry of allEntries) {
          const childFiles = await getAllFilesFromEntry(childEntry, path ? `${path}/${entry.name}` : entry.name);
          files.push(...childFiles);
        }
        return files;
      } catch (err) {
        console.error("Error reading directory entry:", err);
        return [];
      }
    }
    return [];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setLoading(true);
    try {
      const promises = [];
      for (let i = 0; i < items.length; i++) {
        // webkitGetAsEntry is supported in standard modern browsers for folders
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          promises.push(getAllFilesFromEntry(entry));
        }
      }

      const results = await Promise.all(promises);
      const filesList = results.flat();

      if (filesList.length === 0) {
        throw new Error("No files or folders detected.");
      }

      const result = await importFolder(filesList);
      onUploadSuccess(result);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while reading the dropped items.");
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    setLoading(true);
    setError("");

    try {
      const result = await importFolder(filesList);
      onUploadSuccess(result);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while importing the files.");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles && rawFiles.length > 0) {
      processFiles(rawFiles);
    }
    // reset input value so selecting the same folder again triggers change event
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const handleFilesSelect = (e) => {
    const rawFiles = e.target.files;
    if (rawFiles && rawFiles.length > 0) {
      processFiles(rawFiles);
    }
    // reset input
    if (filesInputRef.current) filesInputRef.current.value = "";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-blue-900/10 max-w-xl w-full p-8 text-center transform transition-all duration-300 scale-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg transition-colors cursor-pointer border-none bg-transparent"
        >
          ✕
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Upload Project Folder or Files</h3>
          <p className="text-slate-400 text-sm">Drag and drop directories or files directly, or browse using your file manager</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2.5 text-left">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 select-none ${
            isDragging
              ? "border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10"
              : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
          }`}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
              <p className="text-sm font-semibold text-slate-300">Reading and processing files...</p>
              <p className="text-xs text-slate-500">This might take a moment depending on the project size.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center cursor-pointer" onClick={() => folderInputRef.current.click()}>
              {/* Pulsing upload icon */}
              <div className={`p-4 rounded-full bg-slate-900 border mb-4 text-slate-400 transition-colors duration-300 ${
                isDragging ? "border-blue-500 text-blue-400 bg-blue-950" : "border-slate-800 group-hover:border-slate-700"
              }`}>
                <svg
                  className="w-8 h-8 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <span className="text-base font-semibold text-slate-200 mb-1">
                {isDragging ? "Drop your files here!" : "Drag & drop files or folders here"}
              </span>
              <span className="text-xs text-slate-500">
                Supports folder drag and drop directly
              </span>
            </div>
          )}
        </div>

        {/* Separator / Choose from File Manager Section */}
        {!loading && (
          <div className="mt-8 flex flex-col items-center">
            <div className="flex items-center gap-4 w-full mb-6">
              <div className="h-[1px] bg-slate-800 flex-1"></div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">or choose from file manager</span>
              <div className="h-[1px] bg-slate-800 flex-1"></div>
            </div>

            <div className="w-full">
              {/* Select Files Trigger Button */}
              <button
                onClick={() => filesInputRef.current.click()}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-indigo-500/5 active:scale-[0.98]"
              >
                <svg
                  className="w-4 h-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                Choose Files
              </button>
            </div>
          </div>
        )}

        {/* Hidden Browser Inputs */}
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderSelect}
          className="hidden"
          webkitdirectory="true"
          directory="true"
          multiple
        />

        <input
          type="file"
          ref={filesInputRef}
          onChange={handleFilesSelect}
          className="hidden"
          multiple
        />
      </div>
    </div>
  );
}

export default UploadFolderModal;
