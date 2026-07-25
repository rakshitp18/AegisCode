import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfilePage from "./pages/ProfilePage";
import GitHubCallback from "./pages/GitHubCallback";
import ProtectedRoute from "./components/ProtectedRoute";

// Workspace sub-pages
import EditorPage from "./pages/workspace/EditorPage";
import InspectFilePage from "./pages/workspace/InspectFilePage";
import InspectProjectPage from "./pages/workspace/InspectProjectPage";
import ChatPage from "./pages/workspace/ChatPage";
import HistoryPage from "./pages/workspace/HistoryPage";

import { useProjectContext } from "./contexts/ProjectContext";

// Redirect component for root navigation paths
function WorkspaceRedirect({ subpath = "" }) {
  const { currentProject, projects, loading } = useProjectContext();

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-blue-500 border-blue-500/20"></div>
      </div>
    );
  }

  const activeProject = currentProject || (projects.length > 0 ? projects[0] : null);

  if (!activeProject) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to={`/workspace/${activeProject.id}${subpath}`} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/github/callback" element={<GitHubCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      
      {/* Workspace routes with nesting */}
      <Route
        path="/workspace/:projectId"
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        }
      >
        <Route index element={<EditorPage />} />
        <Route path="inspect-file" element={<InspectFilePage />} />
        <Route path="project-ai" element={<InspectProjectPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>

      {/* Conveniences root level redirect routes */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <WorkspaceRedirect subpath="/chat" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project-ai"
        element={
          <ProtectedRoute>
            <WorkspaceRedirect subpath="/project-ai" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <WorkspaceRedirect subpath="/history" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/files"
        element={
          <ProtectedRoute>
            <WorkspaceRedirect subpath="" />
          </ProtectedRoute>
        }
      />

      {/* Fallbacks */}
      <Route
        path="/workspace"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;