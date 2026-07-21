const SUPPORTED_EXTENSIONS = new Set([
  "java", "js", "ts", "jsx", "tsx", "py", "cpp", "c", "cs", "go",
  "kt", "php", "html", "css", "json", "xml", "yml", "yaml", "md"
]);

const mapExtensionToLanguage = (ext) => {
  switch (ext) {
    case "java":
      return "java";
    case "py":
      return "python";
    case "cpp":
    case "c":
      return "cpp";
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
      return "javascript";
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
};

const getExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const isIgnored = (path) => {
  // Normalize windows backslashes to standard forward slashes
  const normalizedPath = path.replace(/\\/g, "/");
  const segments = normalizedPath.split("/");
  
  for (const seg of segments) {
    // Ignore hidden files and folders (e.g., .git, .idea, .vscode, .gitignore)
    if (seg.startsWith(".")) return true;
    
    // Ignore standard build/dependencies directories
    if (["node_modules", "target", "build", "dist", "bin", "out"].includes(seg)) return true;
    
    // Ignore generated directories
    if (seg.toLowerCase().includes("generated")) return true;
  }
  
  return false;
};

const readFileContent = async (file) => {
  try {
    if (typeof file.text === "function") {
      return await file.text();
    }
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result || "");
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  } catch (err) {
    throw new Error(`Failed to read file ${file.name}: Permission denied or file unreadable.`);
  }
};

export async function importFolder(filesList) {
  if (!filesList || filesList.length === 0) {
    throw new Error("No files selected or folder is empty.");
  }

  const fileArray = Array.from(filesList);
  const validFiles = [];

  // Determine project name from the first file's webkitRelativePath
  let projectName = "Uploaded Project";
  const samplePath = fileArray.find(f => f.webkitRelativePath)?.webkitRelativePath;
  if (samplePath) {
    const normalizedSample = samplePath.replace(/\\/g, "/");
    const firstSlash = normalizedSample.indexOf("/");
    if (firstSlash !== -1) {
      projectName = normalizedSample.substring(0, firstSlash);
    }
  }

  for (const file of fileArray) {
    const fullPath = file.webkitRelativePath || file.name;
    
    // Check if ignored
    if (isIgnored(fullPath)) continue;

    // Get relative path within project (strip root folder segment)
    const normalizedPath = fullPath.replace(/\\/g, "/");
    const firstSlash = normalizedPath.indexOf("/");
    const projectRelativePath = firstSlash !== -1 ? normalizedPath.substring(firstSlash + 1) : normalizedPath;

    // Check extension
    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    const language = mapExtensionToLanguage(ext);

    validFiles.push({
      file,
      name: file.name,
      path: projectRelativePath,
      language
    });
  }

  if (validFiles.length === 0) {
    throw new Error("No supported source code files found in the folder.");
  }

  // Load content for all files asynchronously
  const importedFiles = await Promise.all(
    validFiles.map(async (vf, index) => {
      const content = await readFileContent(vf.file);
      return {
        id: `imported-${index}-${Date.now()}`,
        name: vf.name,
        path: vf.path,
        language: vf.language,
        content
      };
    })
  );

  return {
    projectName,
    files: importedFiles
  };
}
