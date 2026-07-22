import JSZip from "jszip";

const SUPPORTED_EXTENSIONS = new Set([
  "java", "js", "ts", "jsx", "tsx", "py", "cpp", "c", "cs", "go",
  "kt", "php", "html", "css", "json", "xml", "yml", "yaml", "md"
]);

const mapExtensionToLanguage = (ext) => {
  switch (ext) {
    case "java": return "java";
    case "py": return "python";
    case "cpp":
    case "c": return "cpp";
    case "cs": return "csharp";
    case "go": return "go";
    case "kt": return "kotlin";
    case "php": return "php";
    case "js":
    case "jsx": return "javascript";
    case "ts":
    case "tsx": return "typescript";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "xml": return "xml";
    case "yml":
    case "yaml": return "yaml";
    case "md": return "markdown";
    default: return "text";
  }
};

const getExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const isIgnored = (path) => {
  const segments = path.split("/");
  for (const seg of segments) {
    if (seg.startsWith(".")) return true;
    if (["node_modules", "target", "build", "dist", "bin", "out"].includes(seg)) return true;
    if (seg.toLowerCase().includes("generated")) return true;
  }
  return false;
};

export function parseGitHubUrl(url) {
  if (!url) return null;
  const cleanUrl = url.trim().replace(/\.git$/, "");
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] || null
  };
}

/**
 * Direct Zipball Download Fallback
 * Downloads the repository archive directly via codeload.github.com,
 * completely bypassing api.github.com REST API rate limits!
 */
export async function importGitHubRepositoryViaZip(owner, repo, branch = null) {
  const branchesToTry = [branch, "main", "master"].filter(Boolean);
  let response = null;
  let activeBranch = "main";

  for (const b of branchesToTry) {
    const zipUrl = `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/${b}`;
    try {
      const res = await fetch(zipUrl);
      if (res.ok) {
        response = res;
        activeBranch = b;
        break;
      }
    } catch (e) {
      console.warn(`Failed fetching zip branch ${b}`, e);
    }
  }

  if (!response) {
    throw new Error("Unable to download repository archive from GitHub. Please verify that the repository is public and exists.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const validFiles = [];
  const rootPrefix = `${repo}-${activeBranch}/`;

  for (const [relativePath, fileZipObj] of Object.entries(zip.files)) {
    if (fileZipObj.dir) continue;

    let cleanPath = relativePath;
    if (cleanPath.startsWith(rootPrefix)) {
      cleanPath = cleanPath.substring(rootPrefix.length);
    } else {
      const firstSlash = cleanPath.indexOf("/");
      if (firstSlash !== -1) {
        cleanPath = cleanPath.substring(firstSlash + 1);
      }
    }

    if (isIgnored(cleanPath)) continue;

    const parts = cleanPath.split("/");
    const filename = parts[parts.length - 1];
    const ext = getExtension(filename);
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    const content = await fileZipObj.async("string");

    validFiles.push({
      id: `github-zip-${validFiles.length}-${Date.now()}`,
      name: filename,
      path: cleanPath,
      language: mapExtensionToLanguage(ext),
      content
    });

    if (validFiles.length >= 100) break; // Limit to 100 files
  }

  if (validFiles.length === 0) {
    throw new Error("No supported source code files found in the repository archive.");
  }

  return {
    projectName: repo,
    files: validFiles,
    metadata: {
      owner,
      repo,
      branch: activeBranch,
      stars: 0,
      languages: [],
      url: `https://github.com/${owner}/${repo}`,
      truncated: 0
    }
  };
}

export async function importGitHubRepository(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL. Please enter a valid URL in the format: https://github.com/owner/repository");
  }

  // Delegate to backend proxy endpoint (100% immune to browser CORS & REST API rate limits)
  try {
    const res = await fetch("http://localhost:8000/github-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (res.ok) {
      return await res.json();
    }

    const errData = await res.json().catch(() => ({}));
    if (errData.message) {
      throw new Error(errData.message);
    }
  } catch (backendErr) {
    if (backendErr.message && !backendErr.message.includes("Failed to fetch")) {
      throw backendErr;
    }
    console.warn("Backend /github-import call failed, attempting client-side import...", backendErr);
  }

  // Client-side fallback if backend is unreachable
  const { owner, repo } = parsed;
  return await importGitHubRepositoryViaZip(owner, repo, parsed.branch);
}
