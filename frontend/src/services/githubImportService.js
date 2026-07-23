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
 * CORS-Compliant Client-Side Fallback via GitHub REST API + raw.githubusercontent.com
 * Bypasses CORS blocks since api.github.com and raw.githubusercontent.com allow Access-Control-Allow-Origin: *
 */
export async function importGitHubRepositoryViaZip(owner, repo, branch = null) {
  const branchesToTry = [branch, "main", "master"].filter(Boolean);
  let treeData = null;
  let activeBranch = "main";

  for (const b of branchesToTry) {
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`;
    try {
      const res = await fetch(treeUrl);
      if (res.ok) {
        treeData = await res.json();
        activeBranch = b;
        break;
      }
    } catch (e) {
      console.warn(`Failed fetching tree for branch ${b}`, e);
    }
  }

  if (!treeData || !treeData.tree) {
    throw new Error("Unable to fetch repository metadata from GitHub API. Please check your internet connection.");
  }

  // Filter tree nodes for supported extensions
  const filesToFetch = treeData.tree.filter(node => {
    if (node.type !== "blob") return false;
    const parts = node.path.split("/");
    const filename = parts[parts.length - 1];
    if (isIgnored(node.path)) return false;
    const ext = getExtension(filename);
    return SUPPORTED_EXTENSIONS.has(ext);
  }).slice(0, 100); // Limit to 100 files

  if (filesToFetch.length === 0) {
    throw new Error("No supported source code files found in the repository.");
  }

  // Download files in parallel batches (10 at a time)
  const loadedFiles = [];
  const batchSize = 10;
  for (let i = 0; i < filesToFetch.length; i += batchSize) {
    const batch = filesToFetch.slice(i, i + batchSize);
    const promises = batch.map(async (node) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${node.path}`;
      try {
        const res = await fetch(rawUrl);
        if (res.ok) {
          const content = await res.text();
          const parts = node.path.split("/");
          const filename = parts[parts.length - 1];
          const ext = getExtension(filename);
          loadedFiles.push({
            id: `github-api-${loadedFiles.length}-${Date.now()}`,
            name: filename,
            path: node.path,
            language: mapExtensionToLanguage(ext),
            content
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch file ${node.path}`, err);
      }
    });
    await Promise.all(promises);
  }

  if (loadedFiles.length === 0) {
    throw new Error("Failed to fetch repository file contents from GitHub CDN.");
  }

  return {
    projectName: repo,
    files: loadedFiles,
    metadata: {
      owner,
      repo,
      branch: activeBranch,
      url: `https://github.com/${owner}/${repo}`
    }
  };
}

export async function importGitHubRepository(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL. Please enter a valid URL in the format: https://github.com/owner/repository");
  }

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
