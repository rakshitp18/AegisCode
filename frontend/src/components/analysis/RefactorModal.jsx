import React, { useState } from "react";
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

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(refactoredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              AI Refactoring Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reviewing refactored code for <span className="font-mono text-blue-400">{fileName || "active file"}</span> ({language})
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content Split Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Left: Code Diff Editor */}
          <div className="flex-1 flex flex-col bg-slate-950 p-4 border-r border-slate-800 min-h-0">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Code Diff (Original vs Refactored)</span>
              <button
                onClick={handleCopy}
                className="text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                {copied ? (
                  <>
                    <span className="text-emerald-500">✓</span> Copied!
                  </>
                ) : (
                  <>
                    <span>📋</span> Copy Refactored Code
                  </>
                )}
              </button>
            </div>
            
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-850 bg-slate-950 min-h-0">
              <DiffEditor
                original={originalCode || ""}
                modified={refactoredCode || ""}
                language={language === "cpp" ? "cpp" : language === "python" ? "python" : language}
                theme="vs-dark"
                height="100%"
                options={{
                  readOnly: true,
                  originalEditable: false,
                  minimap: { enabled: false },
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbers: "on",
                  renderSideBySide: true,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          {/* Right: AI Explanations and Improvements Drawer */}
          <div className="w-full md:w-80 bg-slate-900/40 p-5 overflow-y-auto flex flex-col gap-6 shrink-0 custom-scrollbar">
            
            {/* Improvements Section */}
            {improvements && improvements.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Key Improvements</span>
                <div className="flex flex-col gap-2">
                  {improvements.map((imp, idx) => (
                    <div 
                      key={idx} 
                      className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded-lg flex gap-2 text-xs text-emerald-300 font-medium leading-relaxed"
                    >
                      <span className="text-emerald-500 shrink-0 mt-0.5">✦</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanations Section */}
            <div className="space-y-2 flex-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">AI Explanation</span>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed font-sans overflow-auto max-h-[35vh] md:max-h-none">
                {explanation ? (
                  <div className="space-y-3 prose prose-invert whitespace-pre-wrap">
                    {explanation}
                  </div>
                ) : (
                  <span className="text-slate-500 italic">No explanation provided.</span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-855 bg-slate-900/60 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            💡 <span className="font-semibold text-slate-300">Accepting</span> will substitute the target segment in the original editor. Original layout & formatting are preserved.
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="flex-1 sm:flex-initial text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-emerald-950/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Accept Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default RefactorModal;
