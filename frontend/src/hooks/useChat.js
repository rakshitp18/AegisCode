import { useState } from "react";
import { useAnalysisContext } from "../contexts/AnalysisContext";

// Common stop words to ignore when performing keyword content search to avoid pulling huge irrelevant files
const STOP_WORDS = new Set([
  "how", "can", "i", "improve", "my", "project", "code", "file", "folder", "directory",
  "write", "create", "read", "delete", "update", "modify", "find", "search", "where",
  "what", "is", "explain", "describe", "understand", "the", "and", "but", "about",
  "class", "public", "void", "return", "import", "package", "private", "protected",
  "method", "function", "variable", "const", "let", "var", "interface", "service",
  "controller", "module", "component", "app", "application", "system", "program"
]);

// Helper to filter out binary files, lock files, and build outputs
const shouldIgnoreFile = (fileName) => {
  if (!fileName) return true;
  const lowerName = fileName.toLowerCase();
  return (
    lowerName.endsWith("-lock.json") ||
    lowerName.endsWith(".lock") ||
    lowerName.endsWith("-lock.yaml") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".gif") ||
    lowerName.endsWith(".svg") ||
    lowerName.endsWith(".ico") ||
    lowerName.endsWith(".woff") ||
    lowerName.endsWith(".woff2") ||
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".map") ||
    lowerName.startsWith(".git/")
  );
};

export default function useChat() {
  const { chatWithProject } = useAnalysisContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearHistory = () => {
    setMessages([]);
    setError(null);
  };

  const findRelevantFiles = (messageText, files, currentFileId) => {
    if (!files || files.length === 0) return [];
    
    // Split into clean words and filter out stop words
    const words = messageText
      .toLowerCase()
      .split(/[^a-zA-Z0-9_.]+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
      
    if (words.length === 0) return [];

    let totalCombinedLength = 0;
    const maxCombinedLength = 40000; // 40KB total context budget for relevant files
    const maxSingleFileLength = 10000; // 10KB context budget per relevant file

    const matchedFiles = [];

    for (const file of files) {
      if (file.id === currentFileId) continue; // Already sent as selectedFile
      if (shouldIgnoreFile(file.name || file.path)) continue;

      const pathLower = (file.path || "").toLowerCase();
      const nameLower = (file.name || "").toLowerCase();

      // 1. Exact or partial filename matches
      const matchesFilename = words.some(
        (word) => pathLower.includes(word) || nameLower.includes(word)
      );

      let isMatch = matchesFilename;

      // 2. Keyword content searches
      if (!isMatch) {
        const contentLower = (file.content || "").toLowerCase();
        isMatch = words.some((word) => word.length > 3 && contentLower.includes(word));
      }

      if (isMatch) {
        let content = file.content || "";
        if (content.length > maxSingleFileLength) {
          content = content.substring(0, maxSingleFileLength) + "\n\n[... File content truncated for length in request context ...]";
        }

        // Add file if it doesn't push us over budget
        if (totalCombinedLength + content.length <= maxCombinedLength) {
          matchedFiles.push({
            path: file.path || file.name,
            language: file.language || "java",
            content: content
          });
          totalCombinedLength += content.length;
        }

        if (matchedFiles.length >= 5) break; // Limit to top 5 matches
      }
    }

    return matchedFiles;
  };

  const sendMessage = async (messageText, projectName, currentFile, files, projectMetrics, astData) => {
    if (!messageText.trim()) return false;

    const userMessage = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    // Compile active file context with budget constraints
    let selectedFileCtx = null;
    if (currentFile) {
      let content = currentFile.content || "";
      const maxSelectedFileLength = 30000; // 30KB budget for active file
      if (content.length > maxSelectedFileLength) {
        content = content.substring(0, maxSelectedFileLength) + "\n\n[... Active file content truncated for length in request context ...]";
      }
      selectedFileCtx = {
        path: currentFile.path || currentFile.name,
        language: currentFile.language || "java",
        content: content
      };
    }

    // Filter relevant workspace files for simple context-retrieval (RAG)
    const relevantFiles = findRelevantFiles(messageText, files, currentFile?.id);

    // Prepare DTO payload
    const requestPayload = {
      message: messageText,
      history: messages,
      projectName: projectName || "No Folder Open",
      selectedFile: selectedFileCtx,
      relevantFiles: relevantFiles,
      projectMetrics: projectMetrics
        ? {
            totalFiles: projectMetrics.totalFiles || 0,
            totalFolders: projectMetrics.totalFolders || 0,
            languages: projectMetrics.languages || [],
            loc: projectMetrics.loc || 0,
            classes: projectMetrics.classes || 0,
            methods: projectMetrics.methods || 0
          }
        : null,
      astData: astData
        ? {
            complexityScore: astData.complexityScore || 0,
            unusedImportsCount: astData.unusedImportsCount || 0,
            duplicateMethodsCount: astData.duplicateMethodsCount || 0,
            largeClassesCount: astData.largeClassesCount || 0,
            longMethodsCount: astData.longMethodsCount || 0
          }
        : null
    };

    try {
      const res = await chatWithProject(requestPayload);
      if (res.success) {
        const aiMessage = { role: "assistant", content: res.data.response || "No response received." };
        setMessages((prev) => [...prev, aiMessage]);
        return true;
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to contact chat service.");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ **Error:** Unable to get response from AI Chat. ${err.message}` }
      ]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory
  };
}
