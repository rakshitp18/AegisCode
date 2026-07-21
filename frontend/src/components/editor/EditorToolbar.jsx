import { useState } from "react";

function EditorToolbar({ currentFile, onCopy, onClear }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-3 select-none">

      <div className="flex items-center gap-3">

        <span className="text-gray-400 text-sm">
          📄 Current File
        </span>

        {currentFile ? (
          <span className="bg-slate-800 px-3 py-1 rounded-lg text-sm font-medium text-white border border-slate-700 shadow-sm transition-all duration-300">
            {currentFile.name}
          </span>
        ) : (
          <span className="text-slate-500 text-sm italic">No file selected</span>
        )}

      </div>

      <div className="flex gap-2">

        <button
          onClick={handleCopy}
          disabled={!currentFile}
          className={`px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold flex items-center gap-1.5 ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {copied ? (
            <>
              <span>✓</span> Copied
            </>
          ) : (
            "Copy"
          )}
        </button>

        <button
          onClick={onClear}
          disabled={!currentFile}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>

      </div>

    </div>
  );
}

export default EditorToolbar;