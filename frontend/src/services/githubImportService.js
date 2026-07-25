
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
