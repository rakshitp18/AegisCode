import { useState } from "react";
import { DiffEditor } from "@monaco-editor/react";

function RefactorModal({ 
  isOpen, 
  onClose, 
  originalCode, 
  refactoredCode, 
  explanation, 
  improvements = [], 
  language,
  onAccept,
  fileName
}) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewMode, setViewMode] = useState("diff"); // "diff" | "original" | "refactored"

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refactoredCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = refactoredCode || "";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([refactoredCode || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "refactored";
    const ext = fileName ? (fileName.includes(".") ? fileName.split(".").pop() : "txt") : "txt";
    link.href = url;
    link.download = `${baseName}_refactored.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAcceptClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmAccept = () => {
    setShowConfirm(false);
    onAccept();
  };

  const normalizeLanguage = (lang) => {
    const map = {
      python: "python", java: "java", cpp: "cpp", c: "c",
      javascript: "javascript", typescript: "typescript",
      jsx: "javascript", tsx: "typescript", go: "go",
      cs: "csharp", php: "php", kotlin: "kotlin",
      html: "html", css: "css",
    };
    return map[lang?.toLowerCase()] || lang || "plaintext";
  };

  const monacoLang = normalizeLanguage(language);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-400 fill-current" viewBox="0 0 24 24">
                <path d="M17.65 6.35A7.958 7.958 0 0012 4C7.58 4 4 7.58 4 12s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                AI Refactoring Results
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-mono text-indigo-400">{fileName || "active file"}</span>
                <span className="mx-1.5 text-slate-600">·</span>
                <span className="capitalize">{language || "unknown"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 gap-0.5">
              {[
                { id: "diff", label: "Diff" },
                { id: "original", label: "Before" },
                { id: "refactored", label: "After" },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`text-[10px] font-bold py-1 px-2.5 rounded-md transition-all cursor-pointer ${
                    viewMode === id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content Split Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          
          {/* Left: Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 min-h-0 border-r border-slate-800/60">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {viewMode === "diff"
                  ? "Code Diff — Original → Refactored"
                  : viewMode === "original"
                  ? "Original Code"
                  : "Refactored Code"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                >
                  {copied ? (
                    <><span className="text-emerald-400">✓</span> Copied!</>
                  ) : (
                    <><span>📋</span> Copy</>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                  title="Download refactored file"
                >
                  <span>⬇</span> Download
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0">
              {viewMode === "diff" ? (
                <DiffEditor
                  original={originalCode || ""}
                  modified={refactoredCode || ""}
                  language={monacoLang}
                  theme="vs-dark"
                  height="100%"
                  options={{
                    readOnly: true,
                    originalEditable: false,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 13,
                    lineNumbers: "on",
                    renderSideBySide: true,
                    scrollBeyondLastLine: false,
                    wordWrap: "off",
                  }}
                />
              ) : (
                <div className="h-full w-full font-mono text-sm text-slate-200 bg-[#1e1e1e] overflow-auto p-5 whitespace-pre custom-scrollbar leading-6">
                  {(viewMode === "original" ? originalCode : refactoredCode) || ""}
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Insights Drawer */}
          <div className="w-full lg:w-80 bg-slate-900/40 overflow-y-auto flex flex-col gap-5 shrink-0 custom-scrollbar p-5">

            {/* Key Improvements */}
            {improvements && improvements.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">✦ Key Improvements</span>
                <div className="flex flex-col gap-1.5">
                  {improvements.map((imp, idx) => (
                    <div
                      key={idx}
                      className="bg-emerald-950/25 border border-emerald-900/30 p-2.5 rounded-lg flex gap-2 text-xs text-emerald-300 font-medium leading-relaxed"
                    >
                      <span className="text-emerald-500 shrink-0 mt-0.5">✦</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation */}
            <div className="space-y-2 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">🤖 AI Explanation</span>
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
                {explanation ? (
                  <div className="whitespace-pre-wrap">{explanation}</div>
                ) : (
                  <span className="text-slate-500 italic">No explanation provided by the AI.</span>
                )}
              </div>
            </div>

            {/* Suggested Follow-ups */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">💡 Suggested Follow-ups</span>
              <div className="bg-amber-950/20 border border-amber-900/25 p-3 rounded-xl flex flex-col gap-1.5">
                {[
                  "Run your test suite to confirm functional equivalence",
                  "Review renamed variables for domain accuracy",
                  "Check edge cases in any extracted methods",
                  "Consider further splitting large classes",
                ].map((note, i) => (
                  <p key={i} className="text-[11px] text-amber-300/80 flex gap-2 items-start leading-relaxed">
                    <span className="text-amber-500 shrink-0">→</span>
                    {note}
                  </p>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            💡 <span className="font-semibold text-slate-300">Accept Changes</span> replaces the original code in your editor. The original is preserved above for reference.
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              onClick={handleAcceptClick}
              className="flex-1 sm:flex-initial text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-indigo-950/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Accept Changes
            </button>
          </div>
        </div>

        {/* Replace Confirmation Dialog (overlay inside modal) */}
        {showConfirm && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                  <span className="text-amber-400 text-base">⚠</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Replace Editor Content?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This will overwrite the current code with the refactored version.
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500 bg-slate-950/50 border border-slate-800 rounded-lg p-3 leading-relaxed">
                <span className="text-slate-300 font-semibold">File:</span> {fileName || "active file"}<br/>
                The original code remains visible in the Diff view above and can be copied back if needed.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAccept}
                  className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                >
                  Confirm Replace
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default RefactorModal;
