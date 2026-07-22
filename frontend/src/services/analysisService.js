import api from "./api";

export async function analyzeCodeRequest(language, code) {

    const response = await api.post("/analyze", {
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

  const response = await api.post("/analyze-project-static", {
    projectName,
    files: mappedFiles
  });

  return response.data;
}

export async function refactorCodeRequest(language, fileContent, selectedText, scope, cursorLine, intent) {
  const response = await api.post("/refactor", {
    language,
    fileContent,
    selectedText,
    scope,
    cursorLine,
    intent
  });
  return response.data;
}