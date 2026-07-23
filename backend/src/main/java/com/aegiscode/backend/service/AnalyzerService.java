package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeMetrics;
import com.aegiscode.backend.dto.CodeRequest;
import com.aegiscode.backend.dto.ProjectAnalysisRequest;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.aegiscode.backend.dto.ProjectFile;
import com.aegiscode.backend.dto.ChatRequest;
import com.aegiscode.backend.dto.RefactorRequest;
import com.aegiscode.backend.dto.RefactorResponse;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AnalyzerService {

    private final AiService aiService;
    private final StaticAnalysisService staticAnalysisService;
    private final AnalysisRepository analysisRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Autowired
    public AnalyzerService(AiService aiService,
                           StaticAnalysisService staticAnalysisService,
                           AnalysisRepository analysisRepository,
                           ProjectRepository projectRepository,
                           UserRepository userRepository) {
        this.aiService = aiService;
        this.staticAnalysisService = staticAnalysisService;
        this.analysisRepository = analysisRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
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

    /**
     * Analyze code and persist the result to the database if projectId and auth are provided.
     */
    public AnalysisResponse analyzeAndPersist(CodeRequest request, Authentication auth) {
        AnalysisResponse response = analyzeCode(request.getLanguage(), request.getCode());

        // Persist only when we have a project context and an authenticated user
        if (auth != null && request.getProjectId() != null) {
            try {
                String email = auth.getName();
                User user = userRepository.findByEmail(email).orElse(null);
                Project project = projectRepository.findById(request.getProjectId()).orElse(null);

                if (user != null && project != null) {
                    Analysis analysis = new Analysis();
                    analysis.setUser(user);
                    analysis.setProject(project);
                    analysis.setFileName(request.getFileName() != null ? request.getFileName() : "unknown");
                    analysis.setLanguage(request.getLanguage());
                    analysis.setSummary(response.getSummary());
                    analysis.setBugs(response.getBugs());
                    analysis.setSuggestions(response.getSuggestions());
                    analysis.setComplexity(response.getComplexity());
                    analysis.setTests(response.getTests());
                    analysis.setMetrics(response.getMetrics());
                    analysis.setAnalysisType("file");
                    Analysis saved = analysisRepository.save(analysis);
                    response.setId(saved.getId());
                    response.setFileName(saved.getFileName());
                    response.setLanguage(saved.getLanguage());
                    response.setCreatedAt(saved.getCreatedAt());
                }
            } catch (Exception e) {
                // Non-fatal: log and continue — analysis result is still returned
                System.err.println("[AnalyzerService] Failed to persist analysis: " + e.getMessage());
            }
        }

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

        String cleanUrl = url.trim();

        // 1. Create a unique temporary directory under the workspace
        java.nio.file.Path tempDir;
        try {
            java.nio.file.Path localTempBase = java.nio.file.Paths.get(".temp-clones");
            java.nio.file.Files.createDirectories(localTempBase);
            tempDir = java.nio.file.Files.createTempDirectory(localTempBase, "aegiscode-clone-");
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to create temporary folder for cloning: " + e.getMessage());
        }

        // 2. Execute native git clone --depth 1 <url> <tempDir>
        try {
            ProcessBuilder pb = new ProcessBuilder(
                "git", "clone", "--depth", "1", cleanUrl, tempDir.toAbsolutePath().toString()
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read output logs
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("[git clone] " + line);
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                deleteDirectoryRecursively(tempDir.toFile());
                throw new RuntimeException("git clone exited with code " + exitCode + ". Make sure the repository is valid and public.");
            }
        } catch (Exception e) {
            deleteDirectoryRecursively(tempDir.toFile());
            throw new RuntimeException("Failed to clone GitHub repository: " + e.getMessage());
        }

        // 3. Read files recursively from tempDir
        java.util.List<java.util.Map<String, String>> importedFiles = new java.util.ArrayList<>();
        java.util.Set<String> supportedExts = java.util.Set.of(
            "java", "js", "ts", "jsx", "tsx", "py", "cpp", "c", "cs", "go",
            "kt", "php", "html", "css", "json", "xml", "yml", "yaml", "md"
        );

        try {
            java.nio.file.Files.walk(tempDir).forEach(filePath -> {
                if (java.nio.file.Files.isDirectory(filePath)) return;

                String relativePath = tempDir.relativize(filePath).toString().replace('\\', '/');

                boolean isIgnored = false;
                for (String seg : relativePath.split("/")) {
                    if (seg.startsWith(".") || seg.equals("node_modules") || seg.equals("target") || seg.equals("build") || seg.equals("dist") || seg.equals("bin") || seg.equals("out")) {
                        isIgnored = true;
                        break;
                    }
                }
                if (isIgnored) return;

                String filename = filePath.getFileName().toString();
                int dotIdx = filename.lastIndexOf('.');
                String ext = (dotIdx != -1) ? filename.substring(dotIdx + 1).toLowerCase() : "";

                if (!supportedExts.contains(ext)) return;

                try {
                    String content = java.nio.file.Files.readString(filePath, java.nio.charset.StandardCharsets.UTF_8);
                    
                    java.util.Map<String, String> fileObj = new java.util.HashMap<>();
                    fileObj.put("id", "github-backend-" + importedFiles.size() + "-" + System.currentTimeMillis());
                    fileObj.put("name", filename);
                    fileObj.put("path", relativePath);
                    fileObj.put("language", mapExtToLang(ext));
                    fileObj.put("content", content);

                    importedFiles.add(fileObj);
                } catch (java.io.IOException e) {
                    System.err.println("Failed reading cloned file: " + relativePath);
                }
            });
        } catch (java.io.IOException e) {
            deleteDirectoryRecursively(tempDir.toFile());
            throw new RuntimeException("Failed walking cloned directory tree: " + e.getMessage());
        }

        // 4. Clean up temp folder
        deleteDirectoryRecursively(tempDir.toFile());

        if (importedFiles.isEmpty()) {
            throw new RuntimeException("No supported source code files found in the repository.");
        }

        // Parse owner and repository name for metadata
        String owner = "owner";
        String repo = "repository";
        String cleanUrlNoGit = cleanUrl.replaceAll("\\.git$", "");
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("github\\.com/([^/]+)/([^/]+)");
        java.util.regex.Matcher matcher = pattern.matcher(cleanUrlNoGit);
        if (matcher.find()) {
            owner = matcher.group(1);
            repo = matcher.group(2);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("projectName", repo);
        result.put("files", importedFiles);
        
        java.util.Map<String, Object> metadata = new java.util.HashMap<>();
        metadata.put("owner", owner);
        metadata.put("repo", repo);
        metadata.put("branch", "main");
        metadata.put("url", cleanUrlNoGit);
        result.put("metadata", metadata);

        return result;
    }

    private void deleteDirectoryRecursively(java.io.File file) {
        if (file.isDirectory()) {
            java.io.File[] files = file.listFiles();
            if (files != null) {
                for (java.io.File f : files) {
                    deleteDirectoryRecursively(f);
                }
            }
        }
        file.delete();
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
