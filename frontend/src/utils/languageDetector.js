export function detectLanguage(filename) {
  if (!filename) return "text";
  
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
  
  switch (ext) {
    case "java":
      return "java";
    case "py":
      return "python";
    case "cpp":
    case "c":
    case "h":
    case "hpp":
      return "cpp";
    case "cs":
      return "csharp";
    case "go":
      return "go";
    case "kt":
      return "kotlin";
    case "php":
      return "php";
    case "js":
    case "jsx":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "html":
      return "html";
    case "css":
      return "css";
    case "json":
      return "json";
    case "xml":
      return "xml";
    case "yml":
    case "yaml":
      return "yaml";
    case "md":
      return "markdown";
    default:
      return "text";
  }
}
