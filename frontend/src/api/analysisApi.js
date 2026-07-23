import axiosClient from "./axiosClient";

export async function analyzeCode(data) {
  const response = await axiosClient.post("/analyze", data);
  return response.data;
}

export async function analyzeProject(data) {
  const response = await axiosClient.post("/analyze-project", data);
  return response.data;
}

export async function analyzeProjectStatic(data) {
  const response = await axiosClient.post("/analyze-project-static", data);
  return response.data;
}

export async function refactorCode(data) {
  const response = await axiosClient.post("/refactor", data);
  return response.data;
}

export async function chatWithProject(data) {
  const response = await axiosClient.post("/chat", data);
  return response.data;
}

export async function importGithubRepository(data) {
  const response = await axiosClient.post("/github-import", data);
  return response.data;
}

export async function getProjectHistory(projectId) {
  const response = await axiosClient.get(`/api/projects/${projectId}/analyses`);
  return response.data;
}

export async function deleteAnalysis(analysisId) {
  await axiosClient.delete(`/api/analyses/${analysisId}`);
}

export async function getDashboardAnalytics(projectId) {
  const url = projectId ? `/api/dashboard/analytics?projectId=${projectId}` : "/api/dashboard/analytics";
  const response = await axiosClient.get(url);
  return response.data;
}

