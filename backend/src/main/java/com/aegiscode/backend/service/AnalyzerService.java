package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeMetrics;
import com.aegiscode.backend.dto.ProjectAnalysisRequest;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.aegiscode.backend.dto.ProjectFile;
import com.aegiscode.backend.dto.ChatRequest;
import com.aegiscode.backend.dto.RefactorRequest;
import com.aegiscode.backend.dto.RefactorResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AnalyzerService {

    private final AiService aiService;
    private final StaticAnalysisService staticAnalysisService;

    @Autowired
    public AnalyzerService(AiService aiService, StaticAnalysisService staticAnalysisService) {
        this.aiService = aiService;
        this.staticAnalysisService = staticAnalysisService;
    }

    public AnalysisResponse analyzeCode(String language, String code) {
        String trimmedCode = code;
        if (trimmedCode != null && trimmedCode.length() > 30000) {
            trimmedCode = trimmedCode.substring(0, 30000) + "\n// [... Content truncated to save tokens ...]\n";
        }
        AnalysisResponse response = aiService.analyzeWithAi(language, trimmedCode);
        CodeMetrics metrics = staticAnalysisService.analyzeStatic(language, code);
        response.setMetrics(metrics);
        return response;
    }

    public ProjectAnalysisResponse analyzeProject(ProjectAnalysisRequest request) {
        StringBuilder contextBuilder = new StringBuilder();
        contextBuilder.append("Project Name: ").append(request.getProjectName()).append("\n\n");
        
        int totalCharLength = 0;
        int maxCharBudget = 4500; // Reduced from 6000 to fit fallback model TPM limit limits
        
        int startOffset = request.getStartOffset() != null ? request.getStartOffset() : 0;
        int filesAnalyzed = 0;
        int activeFilesIndex = -1;
        int totalFilesCount = 0;
        boolean contextOmitted = false;
        int nextOffset = 0;
        
        if (request.getFiles() != null) {
            // First count total active files
            for (ProjectFile file : request.getFiles()) {
                if (!shouldIgnoreFile(file.getPath())) {
                    totalFilesCount++;
                }
            }
            
            // Loop and batch slice
            for (ProjectFile file : request.getFiles()) {
                String filePath = file.getPath();
                if (shouldIgnoreFile(filePath)) {
                    continue;
                }
                
                activeFilesIndex++; // 0-based index of active files
                
                // Skip files before startOffset
                if (activeFilesIndex < startOffset) {
                    continue;
                }
                
                contextBuilder.append("--- File: ").append(filePath).append(" (")
                        .append(file.getLanguage()).append(") ---\n");
                
                String content = file.getContent();
                if (content == null) {
                    content = "";
                }
                
                // If we hit budget, mark the next offset and break
                if (totalCharLength >= maxCharBudget) {
                    if (!contextOmitted) {
                        nextOffset = activeFilesIndex; // This is the first omitted file index
                        contextOmitted = true;
                    }
                    break;
                }
                
                filesAnalyzed++;
                
                // Trim individual file to max 2500 chars (reduced from 3000 to save tokens)
                String trimmed = content;
                if (trimmed.length() > 2500) {
                    trimmed = trimmed.substring(0, 2500) + "\n[... Content truncated to save tokens ...]";
                }
                
                contextBuilder.append(trimmed).append("\n\n");
                totalCharLength += trimmed.length();
            }
        }
        
        // If we processed everything to the end without omitting, the nextOffset is totalFilesCount
        if (!contextOmitted) {
            nextOffset = totalFilesCount;
        }
        
        ProjectAnalysisResponse response = aiService.analyzeProjectWithAi(request.getProjectName(), contextBuilder.toString());
        response.setFilesAnalyzed(filesAnalyzed);
        response.setTotalFiles(totalFilesCount);
        response.setContextOmitted(contextOmitted);
        response.setNextOffset(nextOffset);
        response.setStartOffset(startOffset);
        return response;
    }

    private boolean shouldIgnoreFile(String path) {
        if (path == null) return true;
        String lower = path.toLowerCase();
        return lower.contains("/target/") ||
               lower.contains("\\target\\") ||
               lower.contains("/bin/") ||
               lower.contains("\\bin\\") ||
               lower.contains("/build/") ||
               lower.contains("\\build\\") ||
               lower.contains("/.git/") ||
               lower.contains("\\.git\\") ||
               lower.contains(".lock") ||
               lower.contains("-lock.json") ||
               lower.contains(".png") ||
               lower.contains(".jpg") ||
               lower.contains(".svg") ||
               lower.contains(".ico") ||
               lower.endsWith(".pdf") ||
               lower.endsWith(".map");
    }

    public String chatWithProject(ChatRequest request) {
        return aiService.chatWithProjectContext(request);
    }

    public java.util.Map<String, Object> importGitHubRepository(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("GitHub repository URL is required.");
        }

        String cleanUrl = url.trim().replaceAll("\\.git$", "");
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("github\\.com/([^/]+)/([^/]+)(?:/tree/([^/]+))?");
        java.util.regex.Matcher matcher = pattern.matcher(cleanUrl);

        if (!matcher.find()) {
            throw new IllegalArgumentException("Invalid GitHub URL format. Please enter a URL like: https://github.com/owner/repository");
        }

        String owner = matcher.group(1);
        String repo = matcher.group(2);
        String requestedBranch = matcher.group(3);

        String[] branchesToTry = (requestedBranch != null) 
            ? new String[]{requestedBranch, "main", "master"} 
            : new String[]{"main", "master"};

        byte[] zipBytes = null;
        String activeBranch = "main";

        for (String branch : branchesToTry) {
            String zipUrl = "https://codeload.github.com/" + owner + "/" + repo + "/zip/refs/heads/" + branch;
            try {
                java.net.URL targetUrl = new java.net.URL(zipUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) targetUrl.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(15000);
                conn.setInstanceFollowRedirects(true);
                // Set User-Agent to bypass GitHub's block on generic Java connections
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

                if (conn.getResponseCode() == 200) {
                    try (java.io.InputStream in = conn.getInputStream();
                         java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        while ((bytesRead = in.read(buffer)) != -1) {
                            out.write(buffer, 0, bytesRead);
                        }
                        zipBytes = out.toByteArray();
                        activeBranch = branch;
                        break;
                    }
                }
            } catch (Exception e) {
                // Continue to next branch
            }
        }

        if (zipBytes == null || zipBytes.length == 0) {
            throw new RuntimeException("Unable to download repository archive from GitHub. Please verify that the repository is public and exists.");
        }

        java.util.List<java.util.Map<String, String>> importedFiles = new java.util.ArrayList<>();
        java.util.Set<String> supportedExts = java.util.Set.of(
            "java", "js", "ts", "jsx", "tsx", "py", "cpp", "c", "cs", "go",
            "kt", "php", "html", "css", "json", "xml", "yml", "yaml", "md"
        );

        String rootPrefix = repo + "-" + activeBranch + "/";

        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;

                String name = entry.getName();
                String cleanPath = name;
                if (cleanPath.startsWith(rootPrefix)) {
                    cleanPath = cleanPath.substring(rootPrefix.length());
                } else {
                    int slashIdx = cleanPath.indexOf("/");
                    if (slashIdx != -1) {
                        cleanPath = cleanPath.substring(slashIdx + 1);
                    }
                }

                boolean isIgnored = false;
                for (String seg : cleanPath.split("/")) {
                    if (seg.startsWith(".") || seg.equals("node_modules") || seg.equals("target") || seg.equals("build") || seg.equals("dist")) {
                        isIgnored = true;
                        break;
                    }
                }
                if (isIgnored) continue;

                String filename = cleanPath.substring(cleanPath.lastIndexOf('/') + 1);
                int dotIdx = filename.lastIndexOf('.');
                String ext = (dotIdx != -1) ? filename.substring(dotIdx + 1).toLowerCase() : "";

                if (!supportedExts.contains(ext)) continue;

                java.io.ByteArrayOutputStream fileOut = new java.io.ByteArrayOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = zis.read(buf)) != -1) {
                    fileOut.write(buf, 0, n);
                }

                String content = fileOut.toString(java.nio.charset.StandardCharsets.UTF_8);

                java.util.Map<String, String> fileObj = new java.util.HashMap<>();
                fileObj.put("id", "github-backend-" + importedFiles.size() + "-" + System.currentTimeMillis());
                fileObj.put("name", filename);
                fileObj.put("path", cleanPath);
                fileObj.put("language", mapExtToLang(ext));
                fileObj.put("content", content);

                importedFiles.add(fileObj);

                if (importedFiles.size() >= 100) break;
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed parsing ZIP archive from GitHub: " + e.getMessage());
        }

        if (importedFiles.isEmpty()) {
            throw new RuntimeException("No supported source code files found in the public repository.");
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("projectName", repo);
        result.put("files", importedFiles);
        
        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("owner", owner);
        metadata.put("repo", repo);
        metadata.put("branch", activeBranch);
        metadata.put("url", "https://github.com/" + owner + "/" + repo);
        result.put("metadata", metadata);

        return result;
    }

    private String mapExtToLang(String ext) {
        switch (ext) {
            case "java": return "java";
            case "py": return "python";
            case "cpp": case "c": return "cpp";
            case "cs": return "csharp";
            case "go": return "go";
            case "kt": return "kotlin";
            case "php": return "php";
            case "js": case "jsx": return "javascript";
            case "ts": case "tsx": return "typescript";
            case "html": return "html";
            case "css": return "css";
            case "json": return "json";
            case "xml": return "xml";
            case "yml": case "yaml": return "yaml";
            case "md": return "markdown";
            default: return "text";
        }
    }

    public RefactorResponse refactorCode(RefactorRequest request) {
        return aiService.refactorWithAi(request);
    }
}
