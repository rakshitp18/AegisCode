import axiosClient from "../api/axiosClient";

export async function analyzeCodeRequest(language, code) {

    const response = await axiosClient.post("/analyze", {
        language,
        code,
    });

    return response.data;
}

export async function analyzeProjectStaticRequest(projectName, files) {
  const mappedFiles = files.map(file => ({
    path: file.path || file.name,
    language: file.language || "text",
    content: file.content || ""
  }));

  const response = await axiosClient.post("/analyze-project-static", {
    projectName,
    files: mappedFiles
  });

  return response.data;
}