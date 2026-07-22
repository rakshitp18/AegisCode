import api from "./api";

function summarizeContent(content, language) {
  if (!content) return "[Empty File]";
  const lines = content.split(/\r?\n/);
  
  // If the file is small (under 80 lines), send it in full for maximum accuracy
  if (lines.length <= 80) {
    return content;
  }

  const keyLines = [];
  keyLines.push(`// [File truncated for project context optimization. Original length: ${lines.length} lines]`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Always preserve imports and headers (first 15 lines)
    if (i < 15) {
      keyLines.push(line);
      continue;
    }
    // Always preserve exports and closing braces (last 5 lines)
    if (i > lines.length - 5) {
      keyLines.push(line);
      continue;
    }

    // Preserve structural declarations
    const isImport = trimmed.startsWith("import ") || 
                     trimmed.startsWith("package ") || 
                     trimmed.startsWith("from ") || 
                     trimmed.startsWith("require(");
                     
    const isDefinition = 
      trimmed.startsWith("public class ") || 
      trimmed.startsWith("class ") || 
      trimmed.startsWith("interface ") || 
      trimmed.startsWith("enum ") || 
      trimmed.startsWith("public void ") || 
      trimmed.startsWith("public String ") || 
      trimmed.startsWith("public int ") ||
      trimmed.startsWith("private ") || 
      trimmed.startsWith("protected ") ||
      trimmed.startsWith("function ") ||
      (trimmed.startsWith("const ") && trimmed.includes("=>")) ||
      trimmed.startsWith("def ") ||
      trimmed.startsWith("export ");

    if (isImport || isDefinition) {
      keyLines.push(line);
    } else {
      // Add a single comment placeholder if we are skipping lines
      if (keyLines[keyLines.length - 1] !== "  // ... [implementation details omitted] ...") {
        keyLines.push("  // ... [implementation details omitted] ...");
      }
    }
  }

  // Deduplicate consecutive placeholders
  const finalLines = [];
  for (const line of keyLines) {
    if (line === "  // ... [implementation details omitted] ...") {
      if (finalLines[finalLines.length - 1] !== "  // ... [implementation details omitted] ...") {
        finalLines.push(line);
      }
    } else {
      finalLines.push(line);
    }
  }

  return finalLines.join("\n");
}

export async function analyzeProjectRequest(projectName, files, startOffset = 0) {
  // Map files to DTO structure with context optimization (summarization)
  const optimizedFiles = files.map(file => ({
    path: file.path || file.name,
    language: file.language || "text",
    content: summarizeContent(file.content || "", file.language)
  }));

  const response = await api.post("/analyze-project", {
    projectName,
    files: optimizedFiles,
    startOffset: startOffset
  });

  return response.data;
}
