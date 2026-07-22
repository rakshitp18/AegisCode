import React, { useState, useRef, useEffect } from "react";
import useChat from "../../hooks/useChat";

export default function ChatPanel({ projectName, currentFile, files, analysisResults }) {
  const { messages, loading, sendMessage, clearHistory } = useChat();
  const [input, setInput] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    
    const projectMetrics = analysisResults?.projectOverview || null;
    const astData = analysisResults?.complexityMetrics || analysisResults?.qualityMetrics ? {
      complexityScore: analysisResults.complexityMetrics?.score,
      unusedImportsCount: analysisResults.qualityMetrics?.unusedImports?.length,
      duplicateMethodsCount: analysisResults.qualityMetrics?.duplicateMethods?.length,
      largeClassesCount: analysisResults.qualityMetrics?.largeClasses?.length,
      longMethodsCount: analysisResults.qualityMetrics?.longMethods?.length
    } : null;

    sendMessage(
      input,
      projectName,
      currentFile,
      files,
      projectMetrics,
      astData
    );
    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (promptText) => {
    if (loading) return;
    
    if (promptText === "Explain this class" && !currentFile) {
      alert("Please select and open a file in the editor first!");
      return;
    }

    let finalPrompt = promptText;
    if (promptText === "Explain this class" && currentFile) {
      finalPrompt = `Explain the class / contents of the active file: ${currentFile.name}`;
    }

    const projectMetrics = analysisResults?.projectOverview || null;
    const astData = analysisResults?.complexityMetrics || analysisResults?.qualityMetrics ? {
      complexityScore: analysisResults.complexityMetrics?.score,
      unusedImportsCount: analysisResults.qualityMetrics?.unusedImports?.length,
      duplicateMethodsCount: analysisResults.qualityMetrics?.duplicateMethods?.length,
      largeClassesCount: analysisResults.qualityMetrics?.largeClasses?.length,
      longMethodsCount: analysisResults.qualityMetrics?.longMethods?.length
    } : null;

    sendMessage(
      finalPrompt,
      projectName,
      currentFile,
      files,
      projectMetrics,
      astData
    );
  };

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessageContent = (content, msgIndex) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const lines = part.split("\n");
        const header = lines[0].replace("```", "").trim();
        const code = lines.slice(1, -1).join("\n");
        const codeBlockKey = `${msgIndex}-${index}`;
        const isCopied = copiedIndex === codeBlockKey;

        return (
          <div key={index} className="my-3 border border-slate-800 rounded-xl overflow-hidden bg-slate-955 shadow-md">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex justify-between items-center select-none">
              <span>{header || "code"}</span>
              <button
                onClick={() => handleCopyCode(code, codeBlockKey)}
                className="text-[9px] hover:text-white bg-slate-800 hover:bg-slate-750 px-2 py-1 rounded transition-all cursor-pointer font-sans"
              >
                {isCopied ? "✓ Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-slate-300 font-mono text-[11px] leading-relaxed select-all">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const subParts = part.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <span key={index} className="whitespace-pre-wrap leading-relaxed">
          {subParts.map((sub, sIdx) => {
            if (sub.startsWith("**") && sub.endsWith("**")) {
              return (
                <strong key={sIdx} className="font-bold text-slate-100">
                  {sub.slice(2, -2)}
                </strong>
              );
            }
            if (sub.startsWith("`") && sub.endsWith("`")) {
              return (
                <code key={sIdx} className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[10.5px] text-blue-450 border border-slate-850">
                  {sub.slice(1, -1)}
                </code>
              );
            }
            return sub;
          })}
        </span>
      );
    });
  };

  const suggestions = [
    { label: "Explain class", prompt: "Explain this class", requiresFile: true },
    { label: "Architecture", prompt: "Explain the project architecture and layout", requiresFile: false },
    { label: "Identify risks", prompt: "Identify security risks or risky code patterns in the project", requiresFile: false },
    { label: "Suggest improvements", prompt: "Suggest quality improvements or clean code refactorings", requiresFile: false },
    { label: "Find Auth", prompt: "Find authentication or authorization logic in the project", requiresFile: false },
    { label: "Generate README", prompt: "Generate a markdown README file detailing this project's setup and structure", requiresFile: false }
  ];

  return (
    <div className="flex flex-col h-full min-h-0 text-slate-200">
      
      {/* Header Info Panel */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80 shrink-0">
        <div>
          <h4 className="text-xs font-extrabold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Aegis AI Assistant
          </h4>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-medium font-sans">
            {currentFile ? `Context: ${currentFile.name}` : "Context: Project Scope"}
          </span>
        </div>
        
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-[9px] text-slate-400 hover:text-red-400 font-bold uppercase tracking-wider py-1.5 px-2.5 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            Clear Thread
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-text scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="relative">
              <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/35 rounded-full flex items-center justify-center text-xl shadow-inner animate-pulse">
                🤖
              </div>
            </div>
            
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-sans">How can I help you?</h5>
              <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed font-sans">
                Ask anything about code syntax, architectural layouts, quality issues, or security exposures.
              </p>
            </div>

            {/* Quick Suggestions List */}
            <div className="w-full pt-4 space-y-2">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block text-left pl-1 font-sans">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.prompt)}
                    disabled={s.requiresFile && !currentFile}
                    className={`py-2.5 px-3 rounded-xl border text-left text-xs transition-all cursor-pointer truncate font-medium font-sans ${
                      s.requiresFile && !currentFile
                        ? "bg-slate-950/10 border-slate-900 text-slate-655 cursor-not-allowed"
                        : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-slate-350 hover:text-white shadow-sm"
                    }`}
                  >
                    {s.label} {s.requiresFile && !currentFile && "⚠️"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 items-start max-w-[95%] ${
                  m.role === "user" ? "flex-row-reverse ml-auto" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 select-none shadow-sm font-sans ${
                    m.role === "user"
                      ? "bg-slate-850 border border-slate-800 text-slate-300"
                      : "bg-blue-600/10 border border-blue-500/20 text-blue-400"
                  }`}
                >
                  {m.role === "user" ? "U" : "AI"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-slate-800/60 border border-slate-750 text-slate-100 rounded-tr-none"
                      : "bg-slate-900/30 border border-slate-850 text-slate-300 rounded-tl-none"
                  }`}
                >
                  <div className="text-xs leading-relaxed font-sans">
                    {renderMessageContent(m.content, idx)}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 items-start max-w-[85%] mr-auto animate-pulse">
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 select-none">
                  AI
                </div>

                {/* Processing Bubble */}
                <div className="rounded-2xl rounded-tl-none px-4 py-3.5 bg-slate-900/30 border border-slate-850 text-slate-400 shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  <span className="text-[10px] text-slate-500 pl-1.5 font-medium font-sans">Thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Inline Suggestion strip when chat is active */}
      {messages.length > 0 && (
        <div className="flex gap-1.5 py-2.5 overflow-x-auto scrollbar-none shrink-0 border-t border-slate-800/40 mt-1">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s.prompt)}
              disabled={loading || (s.requiresFile && !currentFile)}
              className={`text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-full border shrink-0 transition-all cursor-pointer font-sans ${
                s.requiresFile && !currentFile
                  ? "bg-transparent border-slate-900 text-slate-655 cursor-not-allowed"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <div className="pt-3 border-t border-slate-850 mt-1 shrink-0">
        <div className="relative flex items-center bg-slate-950/80 border border-slate-800/85 rounded-2xl overflow-hidden focus-within:border-slate-700/80 transition-colors shadow-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              currentFile 
                ? `Ask about ${currentFile.name}...` 
                : "Ask about the project codebase..."
            }
            className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 text-xs py-3.5 pl-4 pr-12 focus:ring-0 focus:outline-none resize-none h-11 scrollbar-none leading-relaxed font-sans"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`absolute right-3 p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              !input.trim() || loading
                ? "text-slate-600 bg-transparent"
                : "text-white bg-blue-700 hover:bg-blue-600 shadow-md shadow-blue-900/20"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      
    </div>
  );
}
