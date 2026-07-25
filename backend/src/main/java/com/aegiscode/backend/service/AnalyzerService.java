package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeMetrics;
import com.aegiscode.backend.dto.CodeRequest;
import com.aegiscode.backend.dto.ProjectAnalysisRequest;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.aegiscode.backend.dto.ProjectFile;
import com.aegiscode.backend.dto.ChatRequest;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import com.aegiscode.backend.dto.ImportStatistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.aegiscode.backend.exception.GitHubImportException;

@Service
public class AnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(AnalyzerService.class);

    private final AiService aiService;
    private final StaticAnalysisService staticAnalysisService;
    private final AnalysisRepository analysisRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final java.util.concurrent.ExecutorService fileProcessingExecutor = java.util.concurrent.Executors.newFixedThreadPool(
        Math.max(2, Runtime.getRuntime().availableProcessors())
    );

    @jakarta.annotation.PreDestroy
    public void shutdownExecutor() {
        log.info("Shutting down file processing executor...");
        fileProcessingExecutor.shutdown();
    }

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
                    if (!project.getUser().getId().equals(user.getId())) {
                        throw new com.aegiscode.backend.exception.ForbiddenException("You do not have permission to access this project");
                    }
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
                if (e instanceof com.aegiscode.backend.exception.ForbiddenException) {
                    throw (com.aegiscode.backend.exception.ForbiddenException) e;
                }
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
        String lower = path.toLowerCase().replace('\\', '/');
        
        // Check if path contains any ignored folder segments
        String[] segments = lower.split("/");
        for (String segment : segments) {
            if (segment.equals("node_modules") ||
                segment.equals(".git") ||
                segment.equals("build") ||
                segment.equals("dist") ||
                segment.equals("target") ||
                segment.equals("bin") ||
                segment.equals("vendor") ||
                segment.equals("coverage") ||
                segment.equals(".idea") ||
                segment.equals(".vscode")) {
                return true;
            }
        }
        
        // Also ignore standard non-text files or specific locks
        return lower.endsWith(".lock") ||
               lower.endsWith("-lock.json") ||
               lower.endsWith(".png") ||
               lower.endsWith(".jpg") ||
               lower.endsWith(".jpeg") ||
               lower.endsWith(".gif") ||
               lower.endsWith(".svg") ||
               lower.endsWith(".ico") ||
               lower.endsWith(".pdf") ||
               lower.endsWith(".zip") ||
               lower.endsWith(".tar.gz") ||
               lower.endsWith(".map");
    }

    public String chatWithProject(ChatRequest request) {
        return aiService.chatWithProjectContext(request);
    }

    public java.util.Map<String, Object> importGitHubRepository(String url) {
        return importGitHubRepository(url, null);
    }

    public java.util.Map<String, Object> importGitHubRepository(String url, Authentication authentication) {
        long startTime = System.currentTimeMillis();
        long urlValidationTime = 0;
        long cloneTime = 0;
        long scanTime = 0;
        long persistenceTime = 0;
        long cleanupTime = 0;

        long urlValidationStart = System.currentTimeMillis();

        // Step 1: URL Received
        log.info("[GitHub Import] Step 1: URL Received: {}", url);
        if (url == null || url.trim().isEmpty()) {
            throw new GitHubImportException("INVALID_URL", "GitHub repository URL is required.");
        }

        String cleanUrl = url.trim();
        java.nio.file.Path tempDir = null;
        String owner = "unknown";
        String repoName = "repository";
        String branch = null;
        String normalizedUrl = cleanUrl;
        boolean isNewProjectCreated = false;
        Project newlyCreatedProject = null;

        try {
            // Step 2: URL Validation & Normalization
            log.info("[GitHub Import] Step 2: URL Validation & Normalization started for: {}", cleanUrl);
            if (cleanUrl.contains("?")) {
                cleanUrl = cleanUrl.substring(0, cleanUrl.indexOf("?"));
            }
            if (cleanUrl.contains("#")) {
                cleanUrl = cleanUrl.substring(0, cleanUrl.indexOf("#"));
            }
            if (cleanUrl.endsWith("/")) {
                cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
            }

            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                "^https?:\\/\\/(www\\.)?github\\.com\\/([^/\\s]+)\\/([^/\\s]+?)(?:\\.git)?(?:\\/tree\\/([^/\\s]+))?(?:\\/.*)?$"
            );
            java.util.regex.Matcher matcher = pattern.matcher(cleanUrl);
            if (!matcher.matches()) {
                throw new GitHubImportException("INVALID_URL", "Invalid repository URL format. Use: https://github.com/owner/repository");
            }

            owner = matcher.group(2);
            repoName = matcher.group(3);
            branch = matcher.group(4); // can be null

            // Strict input validation to prevent command injection
            if (!owner.matches("^[a-zA-Z0-9-]{1,39}$")) {
                throw new GitHubImportException("INVALID_URL", "Invalid GitHub owner name in URL.");
            }
            if (!repoName.matches("^[a-zA-Z0-9._-]{1,100}$")) {
                throw new GitHubImportException("INVALID_URL", "Invalid GitHub repository name in URL.");
            }
            if (branch != null && !branch.matches("^[a-zA-Z0-9._/-]{1,250}$")) {
                throw new GitHubImportException("INVALID_URL", "Invalid GitHub branch name in URL.");
            }

            normalizedUrl = "https://github.com/" + owner + "/" + repoName + ".git";
            log.info("[GitHub Import] Step 2: URL Validation & Normalization completed successfully. Owner: {}, Repo: {}, Branch: {}, Normalized URL: {}", 
                owner, repoName, branch, normalizedUrl);
            long urlValidationEnd = System.currentTimeMillis();
            urlValidationTime = urlValidationEnd - urlValidationStart;

            // Step 3: Repository Parsing
            log.info("[GitHub Import] Step 3: Repository Parsing started.");
            log.info("[GitHub Import] Step 3: Repository Parsing complete. Owner: {}, Repo: {}, Branch: {}", owner, repoName, branch);

            long cloneStart = System.currentTimeMillis();
            // Step 4: Environment and Target Folder Setup
            log.info("[GitHub Import] Step 4: Environment & Folder Setup started.");
            java.nio.file.Path localTempBase = java.nio.file.Paths.get(".temp-clones");
            if (java.nio.file.Files.exists(localTempBase) && !java.nio.file.Files.isDirectory(localTempBase)) {
                log.warn("[GitHub Import] Step 4: Base temp directory exists but is not a folder. Re-creating base path...");
                java.nio.file.Files.delete(localTempBase);
            }
            java.nio.file.Files.createDirectories(localTempBase);

            // Handle pre-existing target clone directory if it conflicts
            tempDir = localTempBase.resolve("aegiscode-clone-" + System.nanoTime());
            if (java.nio.file.Files.exists(tempDir)) {
                log.warn("[GitHub Import] Step 4: Conflict: Target clone folder already exists at: {}. Cleaning up...", tempDir.toAbsolutePath());
                deleteDirectoryRecursively(tempDir.toFile());
            }
            java.nio.file.Files.createDirectories(tempDir);
            log.info("[GitHub Import] Step 4: Target folder created at: {}", tempDir.toAbsolutePath());

            // Step 5: Git Clone / GitHub API execution
            log.info("[GitHub Import] Step 5: Git Clone / GitHub API execution started.");
            int exitCode = -1;
            String gitOutput = "";
            Exception cloneException = null;

            String accessToken = null;
            if (authentication != null && authentication.getName() != null) {
                User u = userRepository.findByEmail(authentication.getName()).orElse(null);
                if (u != null) {
                    accessToken = u.getGithubAccessToken();
                }
            }

            // Attempt 1: Fast Zipball Archive HTTP Stream (Zero local OS process execution, cloud native)
            boolean zipSuccess = tryDownloadAndExtractZip(owner, repoName, branch, accessToken, tempDir);
            if (zipSuccess) {
                log.info("[GitHub Import] Step 5: Repository files retrieved successfully via GitHub HTTP Zipball API.");
                exitCode = 0;
            } else {
                log.info("[GitHub Import] Step 5: Zipball stream unavailable or failed. Falling back to OS git clone process execution...");
                Process process = null;
                try {
                    log.info("[GitHub Import] Step 5: Invoking git clone process for url: {}", normalizedUrl);
                    java.util.List<String> command = new java.util.ArrayList<>();
                    command.add("git");
                    command.add("clone");
                    command.add("--depth");
                    command.add("1");
                    command.add("--single-branch");
                    command.add("--no-tags");
                    command.add("--recurse-submodules=no");
                    if (branch != null) {
                        command.add("--branch");
                        command.add(branch);
                    }
                    command.add(normalizedUrl);
                    command.add(tempDir.toAbsolutePath().toString());

                    log.info("[GitHub Import] Step 5: Command to execute: {}", command);
                    ProcessBuilder pb = new ProcessBuilder(command);
                    pb.environment().put("GIT_TERMINAL_PROMPT", "0");
                    pb.redirectErrorStream(true);
                    process = pb.start();

                    // Stream output capture in background thread to avoid blocking process.waitFor()
                    StringBuilder outputBuffer = new StringBuilder();
                    final Process proc = process;
                    Thread outputGobbler = new Thread(() -> {
                        try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.InputStreamReader(proc.getInputStream()))) {
                            String line;
                            while ((line = reader.readLine()) != null) {
                                outputBuffer.append(line).append("\n");
                            }
                        } catch (Exception ignored) {}
                    });
                    outputGobbler.setDaemon(true);
                    outputGobbler.start();

                    boolean finished = process.waitFor(45, java.util.concurrent.TimeUnit.SECONDS);
                    if (!finished) {
                        try {
                            process.descendants().forEach(ProcessHandle::destroyForcibly);
                        } catch (Exception ignored) {}
                        process.destroyForcibly();
                        outputGobbler.interrupt();
                        gitOutput = "Git clone process timed out after 45 seconds.";
                        log.error("[GitHub Import] Step 5: Git clone process timed out.");
                        throw new java.util.concurrent.TimeoutException(gitOutput);
                    } else {
                        outputGobbler.join(2000);
                        exitCode = process.exitValue();
                        gitOutput = outputBuffer.toString().trim();
                        log.info("[GitHub Import] Step 5: Git process completed with exit code: {}", exitCode);
                    }
                } catch (Exception e) {
                    if (process != null) {
                        try {
                            process.descendants().forEach(ProcessHandle::destroyForcibly);
                            process.destroyForcibly();
                        } catch (Exception ignored) {}
                    }
                    cloneException = e;
                    log.error("[GitHub Import] Step 5: Exception occurred during git clone execution: ", e);
                }
            }

            // Evaluate git clone results
            if (exitCode != 0 || cloneException != null) {
                String errorCode = "CLONE_FAILED";
                String classifiedMsg = "Failed to clone repository.";
                if (cloneException != null) {
                    if (cloneException instanceof java.io.IOException && cloneException.getMessage().contains("Cannot run program \"git\"")) {
                        classifiedMsg = "Git executable is not installed or not available in the system PATH.";
                        errorCode = "CLONE_FAILED";
                    } else if (cloneException instanceof java.util.concurrent.TimeoutException) {
                        classifiedMsg = "Network timeout: cloning timed out after 60 seconds.";
                        errorCode = "NETWORK_ERROR";
                    } else {
                        classifiedMsg = "Git clone execution error: " + cloneException.getMessage();
                        errorCode = "CLONE_FAILED";
                    }
                } else {
                    if (gitOutput.contains("not found in upstream origin") || gitOutput.contains("Remote branch") || gitOutput.contains("Could not find remote branch")) {
                        classifiedMsg = "Branch '" + (branch != null ? branch : "specified") + "' not found in the repository. Please verify the branch name.";
                        errorCode = "REPOSITORY_NOT_FOUND";
                    } else if (gitOutput.contains("not found") || gitOutput.contains("404") || gitOutput.contains("Repository not found")) {
                        classifiedMsg = "Repository not found. Please verify the URL is correct and public.";
                        errorCode = "REPOSITORY_NOT_FOUND";
                    } else if (gitOutput.contains("Authentication failed") || gitOutput.contains("403") || gitOutput.contains("terminal prompts disabled") || gitOutput.contains("could not read Username")) {
                        classifiedMsg = "Access denied. The repository may be private or require authentication. AegisCode only supports public GitHub repositories.";
                        errorCode = "PRIVATE_REPOSITORY";
                    } else if (gitOutput.contains("timed out") || gitOutput.contains("Could not resolve host") || gitOutput.contains("Connection refused") || gitOutput.contains("Connection timed out")) {
                        classifiedMsg = "Network failure while connecting to GitHub. Please check your connection.";
                        errorCode = "NETWORK_ERROR";
                    } else if (gitOutput.contains("Permission denied") || gitOutput.contains("permission")) {
                        classifiedMsg = "Permission issues: Access denied to repository or target file system.";
                        errorCode = "CLONE_FAILED";
                    } else if (!gitOutput.isEmpty()) {
                        String fatalLine = gitOutput.lines()
                            .filter(line -> line.contains("fatal:"))
                            .findFirst()
                            .orElse(gitOutput);
                        classifiedMsg = "Git clone failed: " + fatalLine.trim();
                        errorCode = "CLONE_FAILED";
                    }
                }

                Exception rootError = (cloneException != null) ? cloneException : new RuntimeException(gitOutput);
                throw new GitHubImportException(errorCode, classifiedMsg, rootError);
            }
            long cloneEnd = System.currentTimeMillis();
            cloneTime = cloneEnd - cloneStart;

            // Detect the default branch name if null
            if (branch == null) {
                try {
                    ProcessBuilder pbBranch = new ProcessBuilder("git", "rev-parse", "--abbrev-ref", "HEAD");
                    pbBranch.directory(tempDir.toFile());
                    Process pBranch = pbBranch.start();
                    try (java.io.BufferedReader r = new java.io.BufferedReader(new java.io.InputStreamReader(pBranch.getInputStream()))) {
                        String detected = r.readLine();
                        if (detected != null && !detected.trim().isEmpty()) {
                            branch = detected.trim();
                        }
                    }
                    pBranch.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception e) {
                    log.warn("[GitHub Import] Failed to detect default branch name from clone: ", e);
                }
            }

            // Step 6: File Scanning
            long scanStart = System.currentTimeMillis();
            log.info("[GitHub Import] Step 6: File Scanning started inside: {}", tempDir.toAbsolutePath());
            java.util.Set<String> supportedExts = java.util.Set.of("java", "js", "ts", "jsx", "tsx", "py", "cpp", "c", "cs", "go", "kt", "php", "html", "css", "json", "xml", "yml", "yaml", "md");

            java.util.concurrent.atomic.AtomicInteger totalFilesCount = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.atomic.AtomicInteger importedFilesCount = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.atomic.AtomicInteger skippedFilesCount = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.atomic.AtomicInteger failedFilesCount = new java.util.concurrent.atomic.AtomicInteger(0);
            java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> skippedReasons = new java.util.concurrent.ConcurrentHashMap<>();
            java.util.concurrent.ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> failedReasons = new java.util.concurrent.ConcurrentHashMap<>();

            final java.nio.file.Path targetDir = tempDir;
            java.util.List<java.nio.file.Path> candidatePaths = new java.util.ArrayList<>();
            try {
                java.nio.file.Files.walkFileTree(targetDir, new java.nio.file.SimpleFileVisitor<java.nio.file.Path>() {
                    @Override
                    public java.nio.file.FileVisitResult preVisitDirectory(java.nio.file.Path dir, java.nio.file.attribute.BasicFileAttributes attrs) throws java.io.IOException {
                        if (dir.equals(targetDir)) {
                            return java.nio.file.FileVisitResult.CONTINUE;
                        }
                        String dirName = dir.getFileName() != null ? dir.getFileName().toString() : "";
                        if (isIgnoredDirectory(dirName)) {
                            log.debug("[GitHub Import File Scan] Skipping directory subtree: {}", dir);
                            return java.nio.file.FileVisitResult.SKIP_SUBTREE;
                        }
                        return java.nio.file.FileVisitResult.CONTINUE;
                    }

                    @Override
                    public java.nio.file.FileVisitResult visitFile(java.nio.file.Path file, java.nio.file.attribute.BasicFileAttributes attrs) throws java.io.IOException {
                        if (java.nio.file.Files.isRegularFile(file)) {
                            candidatePaths.add(file);
                        }
                        return java.nio.file.FileVisitResult.CONTINUE;
                    }
                });
            } catch (java.io.IOException e) {
                log.error("[GitHub Import] Step 6: IOException occurred during directory scanning: ", e);
                throw new GitHubImportException("IMPORT_FAILED", "Error scanning repository files: " + e.getMessage(), e);
            }

            java.util.List<java.util.concurrent.CompletableFuture<java.util.Map<String, String>>> futures = candidatePaths.stream()
                .map(filePath -> java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                    totalFilesCount.incrementAndGet();
                    String relativePath = targetDir.relativize(filePath).toString().replace('\\', '/');

                    if (shouldIgnoreFile(relativePath)) {
                        skippedFilesCount.incrementAndGet();
                        skippedReasons.computeIfAbsent("ignored_pattern", r -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                        return null;
                    }

                    String filename = filePath.getFileName().toString();
                    int dotIdx = filename.lastIndexOf('.');
                    String ext = (dotIdx != -1) ? filename.substring(dotIdx + 1).toLowerCase() : "";

                    if (!supportedExts.contains(ext)) {
                        skippedFilesCount.incrementAndGet();
                        skippedReasons.computeIfAbsent("unsupported_extension", r -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                        return null;
                    }

                    // Skip oversized files (> 2MB)
                    try {
                        long size = java.nio.file.Files.size(filePath);
                        if (size > 2 * 1024 * 1024) {
                            skippedFilesCount.incrementAndGet();
                            skippedReasons.computeIfAbsent("file_too_large", r -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                            return null;
                        }
                    } catch (Exception ex) {
                        log.warn("[GitHub Import File Scan] Unable to resolve size for: {}", relativePath, ex);
                    }

                    try {
                        String content = java.nio.file.Files.readString(filePath, java.nio.charset.StandardCharsets.UTF_8);
                        java.util.Map<String, String> fileObj = new java.util.HashMap<>();
                        fileObj.put("name", filename);
                        fileObj.put("path", relativePath);
                        fileObj.put("language", mapExtToLang(ext));
                        fileObj.put("content", content);
                        importedFilesCount.incrementAndGet();
                        return fileObj;
                    } catch (Exception ex) {
                        failedFilesCount.incrementAndGet();
                        failedReasons.computeIfAbsent("read_error", r -> new java.util.concurrent.atomic.AtomicInteger(0)).incrementAndGet();
                        return null;
                    }
                }, fileProcessingExecutor))
                .toList();

            java.util.List<java.util.Map<String, String>> importedFiles = futures.stream()
                .map(java.util.concurrent.CompletableFuture::join)
                .filter(java.util.Objects::nonNull)
                .toList();

            log.info("[GitHub Import] Step 6: File Scanning completed. Total files: {}, Imported: {}, Skipped: {}, Failed: {}", 
                totalFilesCount.get(), importedFilesCount.get(), skippedFilesCount.get(), failedFilesCount.get());
            long scanEnd = System.currentTimeMillis();
            scanTime = scanEnd - scanStart;

            // Step 7: Database Save
            long persistenceStart = System.currentTimeMillis();
            log.info("[GitHub Import] Step 7: Database Save - Saving project and files.");
            Long projectId = null;
            if (authentication != null) {
                try {
                    User user = userRepository.findByEmail(authentication.getName()).orElse(null);
                    if (user != null) {
                        java.util.List<Project> existingProjects = projectRepository.findByUser(user);
                        Project project = null;
                        for (Project p : existingProjects) {
                            if (normalizedUrl.equalsIgnoreCase(p.getGithubUrl())) {
                                project = p;
                                break;
                            }
                        }
                        if (project == null) {
                            project = new Project();
                            project.setName(repoName);
                            project.setDescription("Imported from GitHub repository: " + normalizedUrl);
                            project.setGithubUrl(normalizedUrl);
                            project.setUser(user);
                            project = projectRepository.save(project);
                            newlyCreatedProject = project;
                            isNewProjectCreated = true;
                            log.info("[GitHub Import] Step 7: Created new Project in DB with ID: {}", project.getId());
                        } else {
                            log.info("[GitHub Import] Step 7: Found existing Project in DB with ID: {}", project.getId());
                        }
                        projectId = project.getId();
                    }
                } catch (Exception dbEx) {
                    log.error("[GitHub Import] Step 7: Database save failed: ", dbEx);
                    throw new GitHubImportException("IMPORT_FAILED", "Database save failed: " + dbEx.getMessage(), dbEx);
                }
            } else {
                log.info("[GitHub Import] Step 7: Database Save - No authentication provided, skipping database save.");
            }
            long persistenceEnd = System.currentTimeMillis();
            persistenceTime = persistenceEnd - persistenceStart;

            long executionTimeMs = System.currentTimeMillis() - startTime;

            java.util.Map<String, Integer> statsSkipped = new java.util.HashMap<>();
            skippedReasons.forEach((k, v) -> statsSkipped.put(k, v.get()));
            java.util.Map<String, Integer> statsFailed = new java.util.HashMap<>();
            failedReasons.forEach((k, v) -> statsFailed.put(k, v.get()));

            ImportStatistics stats = new ImportStatistics(
                totalFilesCount.get(),
                importedFilesCount.get(),
                skippedFilesCount.get(),
                failedFilesCount.get(),
                statsSkipped,
                statsFailed,
                executionTimeMs
            );

            log.info("[GitHub Import] Completed import for {} in {}ms. Scanned: {}, Imported: {}, Skipped: {}, Failed: {}",
                repoName, executionTimeMs, totalFilesCount.get(), importedFilesCount.get(), skippedFilesCount.get(), failedFilesCount.get());

            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("id", projectId);
            data.put("projectName", repoName);
            data.put("files", importedFiles);
            data.put("statistics", stats);

            java.util.Map<String, String> metadata = new java.util.HashMap<>();
            metadata.put("projectId", projectId != null ? String.valueOf(projectId) : null);
            metadata.put("owner", owner);
            metadata.put("repo", repoName);
            metadata.put("branch", branch != null ? branch : "main");
            metadata.put("url", normalizedUrl);
            data.put("metadata", metadata);

            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("data", data);
            return response;
        } catch (Exception e) {
            if (isNewProjectCreated && newlyCreatedProject != null && newlyCreatedProject.getId() != null) {
                try {
                    log.info("[GitHub Import] Rolling back DB: Deleting partially created project ID: {}", newlyCreatedProject.getId());
                    projectRepository.delete(newlyCreatedProject);
                } catch (Exception dbRollbackEx) {
                    log.error("[GitHub Import] DB rollback failed: ", dbRollbackEx);
                }
            }
            if (e instanceof GitHubImportException) {
                throw (GitHubImportException) e;
            } else {
                throw new GitHubImportException("IMPORT_FAILED", e.getMessage() != null ? e.getMessage() : "Failed to import GitHub repository.", e);
            }
        } finally {
            if (tempDir != null) {
                long cleanupStart = System.currentTimeMillis();
                log.info("[GitHub Import] Master cleanup: Initiating final directory cleanup for: {}", tempDir.toAbsolutePath());
                try {
                    deleteDirectoryRecursively(tempDir.toFile());
                    log.info("[GitHub Import] Master cleanup: Temporary directory successfully cleaned up.");
                } catch (Exception cleanupEx) {
                    log.error("[GitHub Import] Master cleanup: Failed to clean up temporary directory {}: ", tempDir, cleanupEx);
                }
                long cleanupEnd = System.currentTimeMillis();
                cleanupTime = cleanupEnd - cleanupStart;
            }
            log.info("[GitHub Import Performance Summary]\n" +
                     "- URL validation: {} ms\n" +
                     "- clone: {} ms\n" +
                     "- scan: {} ms\n" +
                     "- persistence: {} ms\n" +
                     "- cleanup: {} ms\n" +
                     "Total Time: {} ms",
                     urlValidationTime, cloneTime, scanTime, persistenceTime, cleanupTime,
                     (urlValidationTime + cloneTime + scanTime + persistenceTime + cleanupTime));
        }
    }

    private void deleteDirectoryRecursively(java.io.File file) {
        if (file == null || !file.exists()) return;
        java.io.File[] files = file.listFiles();
        if (files != null) {
            for (java.io.File f : files) deleteDirectoryRecursively(f);
        }
        file.setWritable(true, false);
        if (!file.delete()) {
            file.deleteOnExit();
        }
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

    private boolean isIgnoredDirectory(String dirName) {
        if (dirName == null) return false;
        String lower = dirName.toLowerCase();
        return lower.equals("node_modules") ||
               lower.equals(".git") ||
               lower.equals("build") ||
               lower.equals("dist") ||
               lower.equals("target") ||
               lower.equals("bin") ||
               lower.equals("vendor") ||
               lower.equals("coverage") ||
               lower.equals(".idea") ||
               lower.equals(".vscode");
    }

    private boolean tryDownloadAndExtractZip(String owner, String repo, String branch, String accessToken, java.nio.file.Path tempDir) {
        String[] branchCandidates = (branch != null && !branch.isBlank())
                ? new String[]{branch}
                : new String[]{"main", "master", "HEAD"};

        for (String b : branchCandidates) {
            String zipUrl = String.format("https://codeload.github.com/%s/%s/zip/refs/heads/%s", owner, repo, b);
            log.info("[GitHub Zipball] Requesting HTTP zip archive from: {}", zipUrl);

            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                        .connectTimeout(java.time.Duration.ofSeconds(10))
                        .followRedirects(java.net.http.HttpClient.Redirect.ALWAYS)
                        .build();

                java.net.http.HttpRequest.Builder requestBuilder = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(zipUrl))
                        .timeout(java.time.Duration.ofSeconds(25))
                        .GET();

                if (accessToken != null && !accessToken.isBlank()) {
                    requestBuilder.header("Authorization", "Bearer " + accessToken);
                }

                java.net.http.HttpResponse<java.io.InputStream> response = client.send(
                        requestBuilder.build(), java.net.http.HttpResponse.BodyHandlers.ofInputStream());

                if (response.statusCode() == 200) {
                    int extractedCount = 0;
                    try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(response.body())) {
                        java.util.zip.ZipEntry entry;
                        while ((entry = zis.getNextEntry()) != null) {
                            if (entry.isDirectory()) continue;
                            String name = entry.getName();

                            // Strip root folder name (e.g., repo-main/src/...)
                            int firstSlash = name.indexOf('/');
                            if (firstSlash != -1) {
                                name = name.substring(firstSlash + 1);
                            }
                            if (name.isBlank()) continue;

                            java.nio.file.Path targetPath = tempDir.resolve(name);
                            java.nio.file.Files.createDirectories(targetPath.getParent());
                            java.nio.file.Files.copy(zis, targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                            extractedCount++;
                        }
                    }
                    if (extractedCount > 0) {
                        log.info("[GitHub Zipball] Successfully extracted {} files from branch '{}'.", extractedCount, b);
                        return true;
                    }
                } else {
                    log.warn("[GitHub Zipball] HTTP request for branch '{}' returned status: {}", b, response.statusCode());
                }
            } catch (Exception ex) {
                log.warn("[GitHub Zipball] Zipball stream attempt failed for branch '{}': {}", b, ex.getMessage());
            }
        }
        return false;
    }

}
