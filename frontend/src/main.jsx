import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { AnalysisProvider } from "./contexts/AnalysisContext";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <AnalysisProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AnalysisProvider>
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
);