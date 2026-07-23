import { createContext, useState, useContext } from "react";
import {
  analyzeCode as analyzeCodeApi,
  analyzeProject as analyzeProjectApi,
  analyzeProjectStatic as analyzeProjectStaticApi,
  refactorCode as refactorCodeApi,
  chatWithProject as chatWithProjectApi,
  importGithubRepository as importGithubRepositoryApi,
  getProjectHistory as getProjectHistoryApi,
  deleteAnalysis as deleteAnalysisApi,
  getDashboardAnalytics as getDashboardAnalyticsApi,
} from "../api/analysisApi";

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  // Decoupled loading states for individual services
  const [loading, setLoading] = useState(false); // Map to single-file analysis loading
  const [projectAnalyzeLoading, setProjectAnalyzeLoading] = useState(false);
  const [staticAnalyzeLoading, setStaticAnalyzeLoading] = useState(false);
  const [refactorLoading, setRefactorLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);

  const [error, setError] = useState(null);

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  const analyzeCode = async (data) => {
    if (loading) return { success: false, message: "Request in progress" };
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeCodeApi(data);
      setAnalysisResult(result);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Code analysis failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const analyzeProject = async (data) => {
    if (projectAnalyzeLoading) return { success: false, message: "Request in progress" };
    setProjectAnalyzeLoading(true);
    setError(null);
    try {
      const result = await analyzeProjectApi(data);
      setAnalysisResult(result);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Project analysis failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setProjectAnalyzeLoading(false);
    }
  };

  const analyzeProjectStatic = async (data) => {
    if (staticAnalyzeLoading) return { success: false, message: "Request in progress" };
    setStaticAnalyzeLoading(true);
    setError(null);
    try {
      const result = await analyzeProjectStaticApi(data);
      setAnalysisResult(result);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Static analysis failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setStaticAnalyzeLoading(false);
    }
  };

  const refactorCode = async (data) => {
    if (refactorLoading) return { success: false, message: "Request in progress" };
    setRefactorLoading(true);
    setError(null);
    try {
      const result = await refactorCodeApi(data);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Refactoring failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setRefactorLoading(false);
    }
  };

  const chatWithProject = async (data) => {
    if (chatLoading) return { success: false, message: "Request in progress" };
    setChatLoading(true);
    setError(null);
    try {
      const result = await chatWithProjectApi(data);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Chat request failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setChatLoading(false);
    }
  };

  const importGithubRepository = async (data) => {
    if (importLoading) return { success: false, message: "Request in progress" };
    setImportLoading(true);
    setError(null);
    try {
      const result = await importGithubRepositoryApi(data);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || "GitHub repository import failed";
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setImportLoading(false);
    }
  };

  const fetchProjectHistory = async (projectId) => {
    if (!projectId) return { success: false, message: "No project selected" };
    setHistoryLoading(true);
    try {
      const result = await getProjectHistoryApi(projectId);
      setAnalysisHistory(result);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to load analysis history";
      return { success: false, message: errMsg };
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteAnalysisById = async (id) => {
    try {
      await deleteAnalysisApi(id);
      setAnalysisHistory(prev => prev.filter(a => a.id !== id));
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.error || "Failed to delete analysis";
      return { success: false, message: errMsg };
    }
  };

  const fetchDashboardData = async (projectId) => {
    setDashboardLoading(true);
    try {
      const result = await getDashboardAnalyticsApi(projectId);
      setDashboardData(result);
      return { success: true, data: result };
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to load dashboard statistics";
      return { success: false, message: errMsg };
    } finally {
      setDashboardLoading(false);
    }
  };

  const value = {
    analysisResult,
    analysisHistory,
    loading, // Used by file analysis loaders
    projectAnalyzeLoading,
    staticAnalyzeLoading,
    refactorLoading,
    chatLoading,
    importLoading,
    historyLoading,
    dashboardLoading,
    dashboardData,
    error,
    analyzeCode,
    analyzeProject,
    analyzeProjectStatic,
    refactorCode,
    chatWithProject,
    importGithubRepository,
    fetchProjectHistory,
    deleteAnalysisById,
    fetchDashboardData,
    clearAnalysis,
    setAnalysisHistory,
    setAnalysisResult,
    setDashboardData,
  };

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysisContext() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysisContext must be used within an AnalysisProvider");
  }
  return context;
}
