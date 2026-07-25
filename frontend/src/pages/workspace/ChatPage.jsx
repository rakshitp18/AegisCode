import { useOutletContext } from "react-router-dom";
import ChatPanel from "../../components/chat/ChatPanel";

export default function ChatPage() {
  const { projectName, currentFile, files, analysisResults } = useOutletContext();

  return (
    <div className="flex-1 overflow-hidden bg-slate-950 p-6 flex flex-col h-full min-h-0">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0 bg-slate-900/10 border border-slate-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden animate-fadeIn">
        <div className="border-b border-slate-850 pb-3 mb-4 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>💬</span> AI Code Assistant
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Ask questions about your codebase, file hierarchy, or seek optimization tips</p>
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatPanel
            projectName={projectName}
            currentFile={currentFile}
            files={files}
            analysisResults={analysisResults}
          />
        </div>
      </div>
    </div>
  );
}
