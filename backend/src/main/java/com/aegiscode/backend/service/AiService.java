package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.aegiscode.backend.dto.ChatRequest;
import com.aegiscode.backend.dto.ProjectFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);

    @Value("${groq.api.key:${GROQ_API_KEY:your_groq_api_key_here}}")
    private String apiKey;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final AiResponseParser responseParser;

    public AiService() {
        this(new AiResponseParser());
    }

    @Autowired
    public AiService(AiResponseParser responseParser) {
        this.responseParser = responseParser != null ? responseParser : new AiResponseParser();
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    public AnalysisResponse analyzeWithAi(String language, String code) {
        long startTime = System.currentTimeMillis();
        String prompt = "You are an expert software engineer.\n\n" +
                "Analyze the following " + language + " code.\n\n" +
                "IMPORTANT:\n" +
                "Return ONLY a valid JSON object.\n" +
                "Do not add explanations.\n" +
                "Do not wrap the JSON inside markdown.\n\n" +
                "Return exactly in this format:\n\n" +
                "{\n" +
                "    \"summary\": \"Brief summary of what the code does.\",\n" +
                "    \"bugs\": [\"Bug 1 description\", \"Bug 2 description\"],\n" +
                "    \"suggestions\": [\"Suggestion 1\", \"Suggestion 2\"],\n" +
                "    \"complexity\": \"Low / Medium / High\",\n" +
                "    \"tests\": [\"Test suggestion 1\", \"Test suggestion 2\"]\n" +
                "}\n\n" +
                "Code:\n" +
                code + "\n";

        log.info("[AI Service] Initiating single file analysis. Language: {}, Code Length: {} chars", language, code != null ? code.length() : 0);

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("temperature", 0.2);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            requestBody.put("messages", messages);

            String requestPayload = objectMapper.writeValueAsString(requestBody);
            long apiStartTime = System.currentTimeMillis();
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);
            long apiDuration = System.currentTimeMillis() - apiStartTime;

            if (response.statusCode() != 200) {
                log.error("[AI Service] Groq API error status: {}, body: {}", response.statusCode(), response.body());
                return responseParser.parseAnalysisResponse(null, "Groq API error. Status: " + response.statusCode());
            }

            String rawContent = responseParser.extractContentFromGroqResponse(response.body());

            long parseStartTime = System.currentTimeMillis();
            AnalysisResponse analysisResponse = responseParser.parseAnalysisResponse(rawContent, null);
            long parseDuration = System.currentTimeMillis() - parseStartTime;
            long totalDuration = System.currentTimeMillis() - startTime;

            log.info("[AI Service] Analysis completed in {}ms (API: {}ms, Parse: {}ms)", totalDuration, apiDuration, parseDuration);
            return analysisResponse;

        } catch (Exception e) {
            log.error("[AI Service] Single file analysis exception: {}", e.getMessage(), e);
            return responseParser.parseAnalysisResponse(null, "Analysis error: " + e.getMessage());
        }
    }

    public ProjectAnalysisResponse analyzeProjectWithAi(String projectName, String projectContext) {
        long startTime = System.currentTimeMillis();
        String prompt = "You are an expert software architect and security auditor.\n\n" +
                "Analyze the following codebase context for the project \"" + projectName + "\".\n" +
                "The context contains lists of files, their paths, and their structured outlines or contents.\n\n" +
                "IMPORTANT:\n" +
                "Return ONLY a valid JSON object matching the exact format schema specified below.\n" +
                "Do not add explanations or any other conversational text outside the JSON.\n" +
                "Do not wrap the JSON inside markdown code blocks (e.g. do not use ```json).\n\n" +
                "Return exactly in this JSON format:\n\n" +
                "{\n" +
                "    \"architectureSummary\": \"A concise summary describing the folder structure, project layout, and architecture (e.g., MVC, Layered, Monolith) observed.\",\n" +
                "    \"codeQualityOverview\": \"A high-level evaluation of overall clean code compliance, readability, and coding standards.\",\n" +
                "    \"designPatterns\": [\"Pattern 1 detected (brief explanation of where/how)\", \"Pattern 2 ...\"],\n" +
                "    \"duplicateLogic\": [\"Duplication observation 1 (specify files/methods)\", \"Duplication observation 2 ...\"],\n" +
                "    \"securityObservations\": [\"Security observation 1 (issues like hardcoded creds, SQL injections, sanitization problems)\", \"Security observation 2 ...\"],\n" +
                "    \"performanceObservations\": [\"Performance observation 1 (long loops, excessive memory, suboptimal calls)\", \"Performance observation 2 ...\"],\n" +
                "    \"refactoringSuggestions\": [\"Suggestion 1 (clear, actionable suggestion)\", \"Suggestion 2 ...\"],\n" +
                "    \"healthScore\": 85\n" +
                "}\n\n" +
                "The healthScore must be a single integer between 0 (highly problematic codebase) and 100 (flawless production-grade codebase).\n\n" +
                "Project Context Data:\n\n" +
                projectContext + "\n";

        log.info("[AI Service] Initiating project analysis for '{}'. Context Length: {} chars", projectName, projectContext != null ? projectContext.length() : 0);

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("temperature", 0.2);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            requestBody.put("messages", messages);

            String requestPayload = objectMapper.writeValueAsString(requestBody);
            long apiStartTime = System.currentTimeMillis();
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);
            long apiDuration = System.currentTimeMillis() - apiStartTime;

            if (response.statusCode() != 200) {
                log.error("[AI Service] Project analysis Groq API error status: {}, body: {}", response.statusCode(), response.body());
                return responseParser.parseProjectAnalysisResponse(null, "Groq API status: " + response.statusCode());
            }

            String rawContent = responseParser.extractContentFromGroqResponse(response.body());

            long parseStartTime = System.currentTimeMillis();
            ProjectAnalysisResponse projectResponse = responseParser.parseProjectAnalysisResponse(rawContent, null);
            long parseDuration = System.currentTimeMillis() - parseStartTime;
            long totalDuration = System.currentTimeMillis() - startTime;

            log.info("[AI Service] Project analysis completed in {}ms (API: {}ms, Parse: {}ms)", totalDuration, apiDuration, parseDuration);
            return projectResponse;

        } catch (Exception e) {
            log.error("[AI Service] Project analysis exception: {}", e.getMessage(), e);
            return responseParser.parseProjectAnalysisResponse(null, "Project analysis error: " + e.getMessage());
        }
    }

    public String chatWithProjectContext(ChatRequest request) {
        long startTime = System.currentTimeMillis();
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an expert AI software engineering assistant for AegisCode, an advanced code analyzer platform.\n");
        promptBuilder.append("Help the developer understand, debug, optimize, or write clean production code.\n\n");

        if (request.getProjectName() != null && !request.getProjectName().isEmpty()) {
            promptBuilder.append("Active Project Name: ").append(request.getProjectName()).append("\n");
        }

        if (request.getSelectedFile() != null && request.getSelectedFile().getPath() != null) {
            promptBuilder.append("Currently Focused File: ").append(request.getSelectedFile().getPath()).append("\n");
            if (request.getSelectedFile().getContent() != null && !request.getSelectedFile().getContent().isEmpty()) {
                promptBuilder.append("Focused File Snippet:\n```\n").append(request.getSelectedFile().getContent()).append("\n```\n\n");
            }
        }

        if (request.getRelevantFiles() != null && !request.getRelevantFiles().isEmpty()) {
            promptBuilder.append("Project Structure & Outline:\n");
            for (ProjectFile pf : request.getRelevantFiles()) {
                if (pf.getPath() != null) {
                    promptBuilder.append("- ").append(pf.getPath()).append("\n");
                }
            }
            promptBuilder.append("\n");
        }

        promptBuilder.append("User Query:\n").append(request.getMessage() != null ? request.getMessage() : "").append("\n");

        log.info("[AI Service] Initiating chat request for project '{}'. Prompt Length: {} chars", request.getProjectName(), promptBuilder.length());

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("temperature", 0.3);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", promptBuilder.toString());
            messages.add(userMessage);
            requestBody.put("messages", messages);

            String requestPayload = objectMapper.writeValueAsString(requestBody);
            long apiStartTime = System.currentTimeMillis();
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);
            long apiDuration = System.currentTimeMillis() - apiStartTime;

            if (response.statusCode() != 200) {
                log.error("[AI Service] Chat Groq API error status: {}, body: {}", response.statusCode(), response.body());
                return "AI assistant encountered an API error (status: " + response.statusCode() + "). Please try again.";
            }

            String rawContent = responseParser.extractContentFromGroqResponse(response.body());
            String cleanText = responseParser.parseChatResponse(rawContent, "AI assistant provided a response.");

            long totalDuration = System.currentTimeMillis() - startTime;
            log.info("[AI Service] Chat completed in {}ms (API: {}ms)", totalDuration, apiDuration);
            return cleanText;

        } catch (Exception e) {
            log.error("[AI Service] Chat request exception: {}", e.getMessage(), e);
            return "An error occurred while connecting to the AI Chat Service: " + e.getMessage();
        }
    }

    private HttpResponse<String> sendHttpRequestWithFallback(String requestPayload) throws Exception {
        String keyToUse = apiKey;
        String primaryModel = "llama-3.3-70b-versatile";
        String fallbackModel = "llama-3.1-8b-instant";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + keyToUse)
                .timeout(Duration.ofSeconds(25))
                .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception ex) {
            log.warn("[AI Service] Primary Groq request transient failure: {}. Retrying once...", ex.getMessage());
            Thread.sleep(1000);
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        }

        // Retry on 5xx transient server errors
        if (response.statusCode() >= 500) {
            log.warn("[AI Service] Groq API 5xx error status: {}. Retrying once...", response.statusCode());
            Thread.sleep(1000);
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        }

        // Tier 1: If primary model is rate limited (429), try fallback model
        if (response.statusCode() == 429) {
            log.info("[AI Service] Primary model rate limited (429). Retrying with {}...", fallbackModel);
            String fallbackPayload = requestPayload.replace(primaryModel, fallbackModel);

            HttpRequest fallbackRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + keyToUse)
                    .timeout(Duration.ofSeconds(25))
                    .POST(HttpRequest.BodyPublishers.ofString(fallbackPayload))
                    .build();

            response = httpClient.send(fallbackRequest, HttpResponse.BodyHandlers.ofString());

            int retryCount = 0;
            while (response.statusCode() == 429 && retryCount < 2) {
                retryCount++;
                double waitSeconds = 3.0;
                try {
                    String body = response.body();
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Please try again in ([0-9.]+)(m|s)");
                    java.util.regex.Matcher matcher = pattern.matcher(body);
                    if (matcher.find()) {
                        double val = Double.parseDouble(matcher.group(1));
                        String unit = matcher.group(2);
                        waitSeconds = "m".equals(unit) ? val * 60.0 : val;
                    }
                } catch (Exception ignored) {}

                if (waitSeconds > 35.0) {
                    log.warn("[AI Service] Rate limit wait time too long ({}s). Aborting long sleep.", waitSeconds);
                    break;
                }

                long sleepMillis = (long) ((waitSeconds + 1.0) * 1000.0);
                log.info("[AI Service] Fallback model rate limited (429). Sleeping {}ms before retry #{}...", sleepMillis, retryCount);
                Thread.sleep(sleepMillis);
                response = httpClient.send(fallbackRequest, HttpResponse.BodyHandlers.ofString());
            }
        }

        return response;
    }
}
