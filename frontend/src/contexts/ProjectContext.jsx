import { createContext, useState, useEffect, useContext } from "react";
import { getProjects, createProject as createProjectApi } from "../api/projectApi";
import { useAuth } from "./AuthContext";

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch projects list from backend
  const fetchProjects = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setProjects(data);
      // Optional: auto-select the first project if no project is currently selected
      if (data.length > 0 && !currentProject) {
        setCurrentProject(data[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch projects without resetting loading completely (background refresh)
  const refreshProjects = async () => {
    if (!token) return;
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error("Failed to refresh projects list", err);
    }
  };

  // Fetch projects automatically when token changes
  useEffect(() => {
    if (token) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [token]);

  // Create a new project, refresh the list, and select the new project
  const createProject = async (projectData) => {
    setLoading(true);
    setError(null);
    try {
      const newProj = await createProjectApi(projectData);
      // Refresh the list immediately
      await refreshProjects();
      // Select the new project
      setCurrentProject(newProj);
      return { success: true, project: newProj };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to create project";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (project) => {
    setCurrentProject(project);
  };

  const value = {
    projects,
    currentProject,
    loading,
    error,
    fetchProjects,
    createProject,
    selectProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}
