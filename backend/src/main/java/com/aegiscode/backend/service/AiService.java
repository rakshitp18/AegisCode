package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.aegiscode.backend.dto.ChatRequest;
import com.aegiscode.backend.dto.ProjectFile;
import com.aegiscode.backend.dto.RefactorRequest;
import com.aegiscode.backend.dto.RefactorResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    @Value("${GROQ_API_KEY:}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public AnalysisResponse analyzeWithAi(String language, String code) {
        String prompt = "You are an expert software engineer.\n\n" +
                "Analyze the following " + language + " code.\n\n" +
                "IMPORTANT:\n" +
                "Return ONLY a valid JSON object.\n" +
                "Do not add explanations.\n" +
                "Do not wrap the JSON inside markdown.\n\n" +
                "Return exactly in this format:\n\n" +
                "{\n" +
                "    \"summary\": \"...\",\n" +
                "    \"bugs\": [\"...\"],\n" +
                "    \"suggestions\": [\"...\"],\n" +
                "    \"complexity\": \"...\",\n" +
                "    \"tests\": [\"...\"]\n" +
                "}\n\n" +
                "Code:\n\n" +
                code + "\n";

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
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);

            if (response.statusCode() != 200) {
                System.err.println("Groq API returned error status: " + response.statusCode());
                System.err.println("Error body: " + response.body());
                return getFallbackResponse("Groq API error. Status: " + response.statusCode());
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            String content = rootNode.path("choices").get(0).path("message").path("content").asText("");

            System.out.println("\n========== AI RESPONSE ==========");
            System.out.println(content);
            System.out.println("=================================\n");

            // Clean response
            String cleaned = content.replaceAll("(?s)```json\\s*(.*?)\\s*```", "$1")
                    .replaceAll("```", "")
                    .trim();

            int start = cleaned.indexOf("{");
            int end = cleaned.lastIndexOf("}");

            if (start != -1 && end != -1) {
                cleaned = cleaned.substring(start, end + 1);
            }

            JsonNode parsedJson = objectMapper.readTree(cleaned);
            
            AnalysisResponse analysisResponse = new AnalysisResponse();
            analysisResponse.setSummary(parsedJson.path("summary").asText(""));
            
            List<String> bugs = new ArrayList<>();
            parsedJson.path("bugs").forEach(node -> bugs.add(node.asText()));
            analysisResponse.setBugs(bugs);

            List<String> suggestions = new ArrayList<>();
            parsedJson.path("suggestions").forEach(node -> suggestions.add(node.asText()));
            analysisResponse.setSuggestions(suggestions);

            analysisResponse.setComplexity(parsedJson.path("complexity").asText(""));

            List<String> tests = new ArrayList<>();
            parsedJson.path("tests").forEach(node -> tests.add(node.asText()));
            analysisResponse.setTests(tests);

            return analysisResponse;

        } catch (Exception e) {
            System.err.println("\nJSON Parsing or Network Error: " + e.getMessage());
            e.printStackTrace();
            return getFallbackResponse("Unable to parse the AI response: " + e.getMessage());
        }
    }

    private AnalysisResponse getFallbackResponse(String errorMessage) {
        AnalysisResponse fallback = new AnalysisResponse();
        fallback.setSummary("AI returned an unexpected response.");
        fallback.setBugs(new ArrayList<>());
        
        List<String> suggestions = new ArrayList<>();
        suggestions.add(errorMessage);
        fallback.setSuggestions(suggestions);
        
        fallback.setComplexity("Unknown");
        fallback.setTests(new ArrayList<>());
        return fallback;
    }

    public ProjectAnalysisResponse analyzeProjectWithAi(String projectName, String projectContext) {
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
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);

            if (response.statusCode() != 200) {
                System.err.println("Groq API returned error status: " + response.statusCode());
                System.err.println("Error body: " + response.body());
                return getFallbackProjectResponse("Groq API error. Status: " + response.statusCode());
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            String content = rootNode.path("choices").get(0).path("message").path("content").asText("");

            System.out.println("\n========== AI PROJECT RESPONSE ==========");
            System.out.println(content);
            System.out.println("=========================================\n");

            // Clean response
            String cleaned = content.replaceAll("(?s)```json\\s*(.*?)\\s*```", "$1")
                    .replaceAll("```", "")
                    .trim();

            int start = cleaned.indexOf("{");
            int end = cleaned.lastIndexOf("}");

            if (start != -1 && end != -1) {
                cleaned = cleaned.substring(start, end + 1);
            }

            JsonNode parsedJson = objectMapper.readTree(cleaned);
            
            ProjectAnalysisResponse projectResponse = new ProjectAnalysisResponse();
            projectResponse.setArchitectureSummary(parsedJson.path("architectureSummary").asText(""));
            projectResponse.setCodeQualityOverview(parsedJson.path("codeQualityOverview").asText(""));

            List<String> designPatterns = new ArrayList<>();
            parsedJson.path("designPatterns").forEach(node -> designPatterns.add(node.asText()));
            projectResponse.setDesignPatterns(designPatterns);

            List<String> duplicateLogic = new ArrayList<>();
            parsedJson.path("duplicateLogic").forEach(node -> duplicateLogic.add(node.asText()));
            projectResponse.setDuplicateLogic(duplicateLogic);

            List<String> securityObservations = new ArrayList<>();
            parsedJson.path("securityObservations").forEach(node -> securityObservations.add(node.asText()));
            projectResponse.setSecurityObservations(securityObservations);

            List<String> performanceObservations = new ArrayList<>();
            parsedJson.path("performanceObservations").forEach(node -> performanceObservations.add(node.asText()));
            projectResponse.setPerformanceObservations(performanceObservations);

            List<String> refactoringSuggestions = new ArrayList<>();
            parsedJson.path("refactoringSuggestions").forEach(node -> refactoringSuggestions.add(node.asText()));
            projectResponse.setRefactoringSuggestions(refactoringSuggestions);

            projectResponse.setHealthScore(parsedJson.path("healthScore").asInt(70));

            return projectResponse;

        } catch (Exception e) {
            System.err.println("\nJSON Parsing or Network Error: " + e.getMessage());
            e.printStackTrace();
            return getFallbackProjectResponse("Unable to parse the AI response: " + e.getMessage());
        }
    }

    private ProjectAnalysisResponse getFallbackProjectResponse(String errorMessage) {
        ProjectAnalysisResponse fallback = new ProjectAnalysisResponse();
        fallback.setArchitectureSummary("Unable to perform project-wide architecture evaluation.");
        fallback.setCodeQualityOverview("Unable to perform project-wide code quality evaluation.");
        fallback.setDesignPatterns(new ArrayList<>());
        fallback.setDuplicateLogic(new ArrayList<>());
        
        List<String> security = new ArrayList<>();
        security.add("Security scan failed: " + errorMessage);
        fallback.setSecurityObservations(security);
        
        fallback.setPerformanceObservations(new ArrayList<>());
        
        List<String> suggestions = new ArrayList<>();
        suggestions.add("Check configuration: " + errorMessage);
        fallback.setRefactoringSuggestions(suggestions);
        
        fallback.setHealthScore(0);
        return fallback;
    }

    public String chatWithProjectContext(ChatRequest request) {
        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an expert AI software engineering assistant for AegisCode, an advanced code analyzer platform.\n");
        promptBuilder.append("Answer the user's question about the project \"").append(request.getProjectName()).append("\".\n\n");

        if (request.getProjectMetrics() != null && !request.getProjectMetrics().isEmpty()) {
            promptBuilder.append("### Project Metrics Overview:\n");
            request.getProjectMetrics().forEach((key, val) -> {
                promptBuilder.append("- ").append(key).append(": ").append(val).append("\n");
            });
            promptBuilder.append("\n");
        }

        if (request.getAstData() != null && !request.getAstData().isEmpty()) {
            promptBuilder.append("### Static Code Quality Diagnostics & AST Data:\n");
            request.getAstData().forEach((key, val) -> {
                promptBuilder.append("- ").append(key).append(": ").append(val).append("\n");
            });
            promptBuilder.append("\n");
        }

        if (request.getSelectedFile() != null && request.getSelectedFile().getContent() != null && !request.getSelectedFile().getContent().trim().isEmpty()) {
            promptBuilder.append("### Active File in Editor:\n");
            promptBuilder.append("Path: ").append(request.getSelectedFile().getPath()).append("\n");
            promptBuilder.append("Language: ").append(request.getSelectedFile().getLanguage()).append("\n");
            promptBuilder.append("Content:\n```").append(request.getSelectedFile().getLanguage()).append("\n");
            promptBuilder.append(request.getSelectedFile().getContent()).append("\n```\n\n");
        }

        if (request.getRelevantFiles() != null && !request.getRelevantFiles().isEmpty()) {
            promptBuilder.append("### Other Relevant Project Files:\n");
            for (ProjectFile pf : request.getRelevantFiles()) {
                if (pf.getContent() != null && !pf.getContent().trim().isEmpty()) {
                    promptBuilder.append("Path: ").append(pf.getPath()).append("\n");
                    promptBuilder.append("Content:\n```").append(pf.getLanguage()).append("\n");
                    promptBuilder.append(pf.getContent()).append("\n```\n\n");
                } else {
                    promptBuilder.append("- Path: ").append(pf.getPath()).append(" (outline/metadata only)\n");
                }
            }
        }

        promptBuilder.append("### User Query:\n").append(request.getMessage()).append("\n\n");
        promptBuilder.append("Provide a clear, detailed, and professional developer response. Use Markdown code blocks with syntax highlighting if you write any code.\n");

        String prompt = promptBuilder.toString();
        
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("temperature", 0.3);

            List<Map<String, String>> messages = new ArrayList<>();
            
            if (request.getHistory() != null) {
                for (Map<String, String> histMsg : request.getHistory()) {
                    Map<String, String> m = new HashMap<>();
                    m.put("role", histMsg.get("role"));
                    m.put("content", histMsg.get("content"));
                    messages.add(m);
                }
            }
            
            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);
            messages.add(userMessage);
            requestBody.put("messages", messages);

            String requestPayload = objectMapper.writeValueAsString(requestBody);
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);

            if (response.statusCode() != 200) {
                System.err.println("Groq API returned error status: " + response.statusCode());
                System.err.println("Error body: " + response.body());
                return "AI Chat Service is currently unavailable. Groq API error (status code: " + response.statusCode() + ").";
            }

            JsonNode rootNode = objectMapper.readTree(response.body());
            return rootNode.path("choices").get(0).path("message").path("content").asText("No response generated.");

        } catch (Exception e) {
            e.printStackTrace();
            return "An error occurred while connecting to the AI Chat Service: " + e.getMessage();
        }
    }

    public RefactorResponse refactorWithAi(RefactorRequest request) {
        String prompt = "You are an expert software refactoring assistant.\n\n" +
                "Refactor the following " + request.getLanguage() + " code based on the user intent: \"" + request.getIntent() + "\".\n\n" +
                "Refactoring Instructions according to the scope \"" + request.getScope() + "\":\n";
        
        if ("selection".equalsIgnoreCase(request.getScope())) {
            prompt += "- Target Scope: \"selection\"\n" +
                      "- Only refactor the following selected code block: \n" +
                      "```\n" + request.getSelectedText() + "\n```\n" +
                      "- Ensure your output 'originalCode' exactly matches this selected text: \n" +
                      "```\n" + request.getSelectedText() + "\n```\n";
        } else if ("method".equalsIgnoreCase(request.getScope())) {
            prompt += "- Target Scope: \"method\"\n" +
                      "- Analyze the full file content provided below.\n" +
                      "- Identify the single enclosing method or function that contains line number: " + request.getCursorLine() + ".\n" +
                      "- Extract this target method. The 'originalCode' field in the JSON response must contain the exact code of this original method.\n" +
                      "- Refactor this extracted method. The 'refactoredCode' field in the JSON response must contain the complete refactored version of this method.\n";
        } else {
            prompt += "- Target Scope: \"file\"\n" +
                      "- Refactor the entire file content.\n" +
                      "- The 'originalCode' field in the JSON response must contain the exact full file content.\n" +
                      "- The 'refactoredCode' field in the JSON response must contain the complete refactored file content.\n";
        }

        prompt += "\n" +
                "File Content for Context:\n" +
                "```\n" + request.getFileContent() + "\n```\n\n" +
                "IMPORTANT:\n" +
                "Return ONLY a valid JSON object matching the exact schema below.\n" +
                "Do not write explanations outside the JSON structure. Do not wrap the JSON inside markdown (e.g. no ```json).\n\n" +
                "Strict JSON Schema:\n" +
                "{\n" +
                "    \"originalCode\": \"the exact original code segment that was refactored\",\n" +
                "    \"refactoredCode\": \"the new refactored version of that code segment\",\n" +
                "    \"explanation\": \"a clear markdown formatted explanation detailing what design choices were made\",\n" +
                "    \"improvements\": [\"Improvement description 1\", \"Improvement description 2\"]\n" +
                "}\n";

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
            HttpResponse<String> response = sendHttpRequestWithFallback(requestPayload);

            RefactorResponse refactorResponse = new RefactorResponse();
            if (response.statusCode() != 200) {
                System.err.println("Groq API returned error status for refactoring: " + response.statusCode());
                refactorResponse.setOriginalCode(request.getSelectedText() != null ? request.getSelectedText() : request.getFileContent());
                refactorResponse.setRefactoredCode(refactorResponse.getOriginalCode());
                refactorResponse.setExplanation("Refactoring failed due to Groq API error (status code: " + response.statusCode() + ").");
                refactorResponse.setImprovements(new ArrayList<>());
                return refactorResponse;
            }

            JsonNode parsedJson = objectMapper.readTree(response.body());
            String jsonText = parsedJson.path("choices").get(0).path("message").path("content").asText("");

            // Clean markdown wrapping if present
            if (jsonText.trim().startsWith("```")) {
                int firstBrace = jsonText.indexOf("{");
                int lastBrace = jsonText.lastIndexOf("}");
                if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
                }
            }

            // Sanitize raw control characters (newlines, tabs, carriage returns) that the
            // AI embeds literally inside JSON string values — Jackson cannot parse these.
            jsonText = sanitizeJsonControlChars(jsonText);

            JsonNode refactoredJson = objectMapper.readTree(jsonText);
            refactorResponse.setOriginalCode(refactoredJson.path("originalCode").asText(""));
            refactorResponse.setRefactoredCode(refactoredJson.path("refactoredCode").asText(""));
            refactorResponse.setExplanation(refactoredJson.path("explanation").asText(""));

            List<String> improvements = new ArrayList<>();
            refactoredJson.path("improvements").forEach(node -> improvements.add(node.asText()));
            refactorResponse.setImprovements(improvements);

            // Double check values - fallback to safe defaults if they are blank
            if (refactorResponse.getOriginalCode().isEmpty()) {
                if ("selection".equalsIgnoreCase(request.getScope())) {
                    refactorResponse.setOriginalCode(request.getSelectedText());
                } else if ("file".equalsIgnoreCase(request.getScope())) {
                    refactorResponse.setOriginalCode(request.getFileContent());
                }
            }
            if (refactorResponse.getRefactoredCode().isEmpty()) {
                refactorResponse.setRefactoredCode(refactorResponse.getOriginalCode());
            }

            return refactorResponse;

        } catch (Exception e) {
            e.printStackTrace();
            RefactorResponse errorResponse = new RefactorResponse();
            errorResponse.setOriginalCode(request.getSelectedText() != null ? request.getSelectedText() : request.getFileContent());
            errorResponse.setRefactoredCode(errorResponse.getOriginalCode());
            errorResponse.setExplanation("An exception occurred during refactoring: " + e.getMessage());
            errorResponse.setImprovements(new ArrayList<>());
            return errorResponse;
        }
    }

    private HttpResponse<String> sendHttpRequestWithFallback(String requestPayload) throws Exception {
        String primaryModel = "llama-3.3-70b-versatile";
        String fallbackModel = "llama-3.1-8b-instant";
        
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        // Tier 1: If primary model is rate limited, try fallback model
        if (response.statusCode() == 429) {
            System.out.println("Primary model rate limited (429). Retrying with llama-3.1-8b-instant...");
            String fallbackPayload = requestPayload.replace(primaryModel, fallbackModel);
            
            HttpRequest fallbackRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(fallbackPayload))
                    .build();
            
            response = httpClient.send(fallbackRequest, HttpResponse.BodyHandlers.ofString());
            
            // Tier 2: If fallback model is also rate limited, short sleep & retry if wait is small
            int retryCount = 0;
            while (response.statusCode() == 429 && retryCount < 2) {
                retryCount++;
                double waitSeconds = 3.0; // default short wait
                try {
                    String body = response.body();
                    java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("Please try again in ([0-9.]+)(m|s)");
                    java.util.regex.Matcher matcher = pattern.matcher(body);
                    if (matcher.find()) {
                        double val = Double.parseDouble(matcher.group(1));
                        String unit = matcher.group(2);
                        if ("m".equals(unit)) {
                            waitSeconds = val * 60.0;
                        } else {
                            waitSeconds = val;
                        }
                    }
                } catch (Exception ex) {
                    // Ignore parsing exceptions
                }
                
                // If required wait time exceeds 35 seconds (e.g. daily limit hit), abort long sleep
                if (waitSeconds > 35.0) {
                    System.out.println("Rate limit wait time too long (" + waitSeconds + "s). Aborting long sleep.");
                    break;
                }
                
                long sleepMillis = (long) ((waitSeconds + 1.0) * 1000.0); // Wait for the full required time + 1s buffer to clear the rolling window
                System.out.println("Fallback model rate limited (429). Sleeping " + sleepMillis + "ms before retry #" + retryCount + "...");
                Thread.sleep(sleepMillis);
                response = httpClient.send(fallbackRequest, HttpResponse.BodyHandlers.ofString());
            }
        }
        
        return response;
    }

    /**
     * Sanitizes raw control characters (newlines, carriage returns, tabs) that appear
     * INSIDE JSON string values in the AI's response. Jackson's strict parser rejects
     * these as-is (they must be represented as \\n, \\r, \\t etc.). This method uses a
     * simple character-level state machine to track whether the parser is currently
     * inside a JSON string literal and only then replaces the raw characters.
     */
    private String sanitizeJsonControlChars(String json) {
        if (json == null || json.isEmpty()) return json;

        StringBuilder sb = new StringBuilder(json.length() + 128);
        boolean inString = false;
        boolean escaped = false;

        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);

            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }

            if (c == '\\' && inString) {
                sb.append(c);
                escaped = true;
                continue;
            }

            if (c == '"') {
                inString = !inString;
                sb.append(c);
                continue;
            }

            if (inString) {
                // Replace raw control characters with their JSON escape sequences
                if (c == '\n') {
                    sb.append("\\n");
                } else if (c == '\r') {
                    sb.append("\\r");
                } else if (c == '\t') {
                    sb.append("\\t");
                } else if (c < 0x20) {
                    // Other control characters - encode as hex unicode escape
                    sb.append("\\u").append(String.format("%04x", (int) c));
                } else {
                    sb.append(c);
                }
            } else {
                sb.append(c);
            }
        }

        return sb.toString();
    }
}
