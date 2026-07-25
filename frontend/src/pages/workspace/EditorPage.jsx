import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import EditorToolbar from "../../components/editor/EditorToolbar";
import CodeEditor from "../../components/editor/CodeEditor";
import AnalyzeButton from "../../components/common/AnalyzeButton";

export default function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const {
    files,
    currentFile,
    currentFileId,
    setCurrentFileId,
    updateCurrentFile,
    updateCurrentFileLanguage,
    addNewFile,
    addNewFolder,
    renameItem,
    deleteItem,
    moveItem,
    importProject,
    getProjectStats,
    gitMetadata,
    projectName,
    analysisResults,
    isImporting,
    fileInputRef,
    githubUrl,
    setAlertInfo,
    filterType,
    setFilterType,
    onLoadAnalysisResult,
    // File analysis hooks passed via context
    analyzeCode,
    analysisLoading,
    currentProject,
    editorRef,
  } = useOutletContext();

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem("aegis_sidebar_width");
    return saved ? parseInt(saved, 10) : 224;
  });
  const isResizingRef = useRef(false);

  const startResizing = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      let newWidth = e.clientX;
      if (newWidth < 160) newWidth = 160;
      if (newWidth > 500) newWidth = 500;
      setSidebarWidth(newWidth);
      localStorage.setItem("aegis_sidebar_width", newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Sidebar (files explorer) */}
      <aside 
        style={{ width: `${sidebarWidth}px` }} 
        className="shrink-0 border-r border-slate-800 flex flex-col h-full overflow-hidden"
      >
        <Sidebar
          projectId={projectId}
          projectName={projectName}
          files={files}
          currentFileId={currentFileId}
          onSelectFile={setCurrentFileId}
          onAddNewFile={addNewFile}
          onAddNewFolder={addNewFolder}
          onRenameItem={renameItem}
          onDeleteItem={deleteItem}
          onMoveItem={moveItem}
          onImportProject={importProject}
          setAlertInfo={setAlertInfo}
          stats={getProjectStats()}
          filterType={filterType}
          onSelectFilter={setFilterType}
          analysisResults={analysisResults}
          gitMetadata={gitMetadata}
          onLoadAnalysisResult={onLoadAnalysisResult}
          isImporting={isImporting}
        />
      </aside>

      {/* Resize Handle / Drag bar */}
      <div
        onMouseDown={startResizing}
        className="w-1.5 -ml-[3.5px] hover:-ml-[2.5px] hover:w-1 bg-transparent hover:bg-blue-500/50 active:bg-blue-500 transition-colors cursor-col-resize z-30 shrink-0 h-full"
        title="Drag to resize sidebar"
      />

      {/* Editor Content Area */}
      <main className="flex-1 min-w-0 bg-slate-955 relative flex flex-col h-full overflow-hidden">
        {currentFile ? (
          <div className="h-full flex flex-col">
            <EditorToolbar
              currentFile={currentFile}
              onCopy={() => {
                if (currentFile) {
                  navigator.clipboard.writeText(currentFile.content);
                }
              }}
              onClear={() => updateCurrentFile("")}
              onLanguageChange={updateCurrentFileLanguage}
            />
            <div className="flex-1 min-h-0 relative">
              <CodeEditor
                language={currentFile.language}
                code={currentFile.content}
                setCode={updateCurrentFile}
                editorRef={editorRef}
              />
            </div>

            {/* Analyze Controls */}
            <div className="p-4 border-t border-slate-800 flex flex-col gap-3 relative shrink-0 bg-slate-950/80">
              <AnalyzeButton
                onAnalyze={async () => {
                  if (currentFile) {
                    const res = await analyzeCode({
                      language: currentFile.language,
                      code: currentFile.content,
                      projectName: projectName,
                      fileName: currentFile.name,
                      projectId: currentProject?.id || null
                    });
                    if (res.success) {
                      navigate(`/workspace/${projectId}/inspect-file`);
                    } else {
                      setAlertInfo({
                        title: "Analysis Failed",
                        message: res.message
                      });
                    }
                  }
                }}
                loading={analysisLoading}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-slate-955 p-8 select-none border border-slate-900 rounded-3xl animate-fadeIn text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-955/40 border border-indigo-900/30 flex items-center justify-center text-indigo-400 mx-auto shadow-lg shadow-indigo-950/20">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </div>
            <div className="space-y-2 max-w-[320px] mx-auto">
              <h3 className="text-base font-bold text-slate-200">No file open</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select a file from the sidebar to begin editing, or click the <span className="text-blue-400 font-semibold">Sync GitHub</span> button in the navbar to import files.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
