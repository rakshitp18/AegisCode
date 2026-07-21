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
  // Matches owner/repo and tree/branch-name if provided
  const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+))?/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3] || null
  };
}

async function handleGitHubErrorResponse(res) {
  if (res.status === 404) {
    throw new Error("Repository not found. Please verify that the repository is public and exists.");
  }
  if (res.status === 403) {
    const rateLimitLimit = res.headers.get("X-RateLimit-Limit");
    const rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");
    if (rateLimitRemaining === "0") {
      throw new Error("GitHub API rate limit exceeded for your IP address. Please try again later or verify authentication.");
    }
    throw new Error("GitHub API returned status 403 (Forbidden). The repository may be private, or rate limits were exceeded.");
  }
  throw new Error(`GitHub API returned status ${res.status}: ${res.statusText}`);
}

export async function importGitHubRepository(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error("Invalid GitHub repository URL. Please enter a valid URL in the format: https://github.com/owner/repository");
  }

  const { owner, repo } = parsed;
  
  // 1. Fetch Repository Metadata from GitHub API
  let metadataResponse;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) {
      await handleGitHubErrorResponse(res);
    }
    metadataResponse = await res.json();
  } catch (err) {
    throw new Error(err.message || "Failed to reach GitHub API. Check your internet connection.");
  }

  const defaultBranch = metadataResponse.default_branch || "main";
  const activeBranch = parsed.branch || defaultBranch;
  const stargazersCount = metadataResponse.stargazers_count || 0;

  // 2. Fetch Languages from Repository
  let languages = [];
  try {
    const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
    if (langRes.ok) {
      const langData = await langRes.json();
      languages = Object.keys(langData);
    }
  } catch (err) {
    console.warn("Failed to fetch repository languages", err);
  }

  // 3. Fetch Recursive Directory Tree structure
  let treeItems = [];
  try {
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`);
    if (!treeRes.ok) {
      await handleGitHubErrorResponse(treeRes);
    }
    const treeData = await treeRes.json();
    treeItems = treeData.tree || [];
  } catch (err) {
    throw new Error(err.message || `Failed to fetch repository branch '${activeBranch}' tree structure from GitHub.`);
  }

  // 4. Filter Tree Items to supported source files
  const validFiles = [];
  treeItems.forEach(item => {
    if (item.type !== "blob") return; // Keep files only
    
    const path = item.path;
    if (isIgnored(path)) return;

    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    const ext = getExtension(filename);
    if (!SUPPORTED_EXTENSIONS.has(ext)) return;

    validFiles.push({
      path,
      name: filename,
      language: mapExtensionToLanguage(ext)
    });
  });

  if (validFiles.length === 0) {
    throw new Error("No supported source code files found in the public repository.");
  }

  // 5. Download Contents in Parallel (limits to first 100 files to avoid CDN timeouts)
  const filesToDownload = validFiles.slice(0, 100);
  const totalCount = validFiles.length;

  const importedFiles = await Promise.all(
    filesToDownload.map(async (fileObj, index) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${activeBranch}/${fileObj.path}`;
      try {
        const fileRes = await fetch(rawUrl);
        if (!fileRes.ok) {
          throw new Error(`Status ${fileRes.status}`);
        }
        const content = await fileRes.text();
        return {
          id: `github-${index}-${Date.now()}`,
          name: fileObj.name,
          path: fileObj.path,
          language: fileObj.language,
          content
        };
      } catch (err) {
        console.warn(`Failed to download ${fileObj.path}`, err);
        return {
          id: `github-${index}-${Date.now()}`,
          name: fileObj.name,
          path: fileObj.path,
          language: fileObj.language,
          content: `// Error loading file from GitHub raw source: ${err.message}`
        };
      }
    })
  );

  return {
    projectName: repo,
    files: importedFiles,
    metadata: {
      owner,
      repo,
      branch: activeBranch,
      stars: stargazersCount,
      languages,
      url: `https://github.com/${owner}/${repo}`,
      truncated: totalCount > 100 ? totalCount - 100 : 0
    }
  };
}
