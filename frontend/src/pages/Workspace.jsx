import Navbar from "../components/common/Navbar";
import AnalyzeButton from "../components/common/AnalyzeButton";
import AlertModal from "../components/common/AlertModal";

import LanguageSelector from "../components/editor/LanguageSelector";
import CodeEditor from "../components/editor/CodeEditor";
import EditorToolbar from "../components/editor/EditorToolbar";

import Sidebar from "../components/layout/Sidebar";
import RightPanel from "../components/layout/RightPanel";
import StatusBar from "../components/layout/StatusBar";
import WorkspaceLayout from "../components/layout/WorkspaceLayout";

import useAnalysis from "../hooks/useAnalysis";

function Workspace() {
  const {
    language,
    setLanguage,
    code,
    setCode,
    result,
    loading,
    analyzeCode,
    alertInfo,
    setAlertInfo,
  } = useAnalysis();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <WorkspaceLayout
        sidebar={<Sidebar />}
        editor={
          <div className="h-full flex flex-col">
            <EditorToolbar />

            <div className="p-4 border-b border-slate-800">
              <LanguageSelector
                language={language}
                setLanguage={setLanguage}
              />
            </div>

            <div className="flex-1 overflow-hidden">
              <CodeEditor
                language={language}
                code={code}
                setCode={setCode}
              />
            </div>

            <div className="p-4 border-t border-slate-800">
              <AnalyzeButton
                onAnalyze={analyzeCode}
                loading={loading}
              />
            </div>
          </div>
        }
        rightPanel={<RightPanel result={result} />}
        statusBar={
          <StatusBar
            language={language}
            code={code}
          />
        }
      />

      <AlertModal
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title}
        message={alertInfo?.message}
      />
    </div>
  );
}

export default Workspace;