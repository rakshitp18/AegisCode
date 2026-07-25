package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.ProjectAnalysisResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AiResponseParser {

    private static final Logger log = LoggerFactory.getLogger(AiResponseParser.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Safely extracts the message content from the raw Groq API HTTP response body.
     * Prevents Jackson parsing exceptions if Groq or a proxy returns plain text / HTML.
     */
    public String extractContentFromGroqResponse(String httpResponseBody) {
        if (httpResponseBody == null || httpResponseBody.trim().isEmpty()) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(httpResponseBody);
            if (root.has("choices") && root.get("choices").isArray() && root.get("choices").size() > 0) {
                JsonNode choice = root.get("choices").get(0);
                if (choice.has("message") && choice.get("message").has("content")) {
                    return choice.get("message").get("content").asText("");
                }
            }
            if (root.has("content")) {
                return root.get("content").asText("");
            }
        } catch (Exception e) {
            log.warn("[AiResponseParser] Groq HTTP body is not standard JSON API envelope. Using raw body string.");
        }
        return httpResponseBody;
    }

    /**
     * Cleans raw AI response text: logs raw input, removes introductory text ("Here is...", "Below is..."),
     * strips markdown fences, extracts JSON boundaries { ... } or [ ... ], sanitizes control characters,
     * and returns a JsonNode.
     */
    public JsonNode parseJsonSafely(String rawResponse) throws Exception {
        log.info("[AiResponseParser] Raw Response:\n{}", rawResponse);

        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            log.error("[AiResponseParser] Validation Error: AI response string is null or blank.");
            throw new IllegalArgumentException("AI response is empty");
        }

        String text = rawResponse.trim();

        // 1. Remove markdown code block wrappers if wrapped as ```json ... ```
        if (text.startsWith("```")) {
            text = text.replaceAll("(?s)^```(?:json|markdown|[a-zA-Z]*)?\\s*\n?", "");
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3).trim();
            }
        }

        // 2. Remove common leading conversational sentences (e.g., "Here is...", "Below is...", "Certainly! ...:")
        text = text.replaceAll("(?i)^.*?(?:here (?:is|are)|below is|certainly|sure,|of course|i've refactored|here's|below).*?:\s*", "").trim();

        log.info("[AiResponseParser] Cleaned Response:\n{}", text);

        // 3. Extract outermost JSON object { ... } or array [ ... ] boundaries
        int firstBrace = text.indexOf("{");
        int lastBrace = text.lastIndexOf("}");
        int firstBracket = text.indexOf("[");
        int lastBracket = text.lastIndexOf("]");

        String extractedJson = text;
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            if (firstBracket == -1 || firstBrace < firstBracket) {
                extractedJson = text.substring(firstBrace, lastBrace + 1).trim();
            } else if (lastBracket > firstBracket) {
                extractedJson = text.substring(firstBracket, lastBracket + 1).trim();
            }
        } else if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket) {
            extractedJson = text.substring(firstBracket, lastBracket + 1).trim();
        }

        log.info("[AiResponseParser] Extracted JSON:\n{}", extractedJson);

        if ((!extractedJson.startsWith("{") || !extractedJson.endsWith("}")) &&
            (!extractedJson.startsWith("[") || !extractedJson.endsWith("]"))) {
            log.warn("[AiResponseParser] Validation Error: Candidate text does not have valid JSON boundaries { ... } or [ ... ]");
            throw new IllegalArgumentException("No JSON boundaries found in AI response.");
        }

        // 4. Primary Deserialization Attempt
        try {
            JsonNode parsedNode = objectMapper.readTree(extractedJson);
            log.info("[AiResponseParser] Parse Result: SUCCESS");
            return parsedNode;
        } catch (Exception primaryEx) {
            log.warn("[AiResponseParser] Primary JSON parse failed: {}. Attempting automatic repair...", primaryEx.getMessage());

            // 5. Automatic Repair: Sanitize unescaped control characters & quotes
            String sanitized = sanitizeJsonControlChars(extractedJson);
            try {
                JsonNode repairedNode = objectMapper.readTree(sanitized);
                log.info("[AiResponseParser] Parse Result: REPAIRED");
                return repairedNode;
            } catch (Exception repairEx) {
                log.error("[AiResponseParser] Parse Result: FAILED (Repair failed: {})", repairEx.getMessage());
                throw repairEx;
            }
        }
    }

    /**
     * Parse single file analysis AI response into AnalysisResponse DTO.
     */
    public AnalysisResponse parseAnalysisResponse(String rawResponse, String fallbackDetail) {
        AnalysisResponse response = new AnalysisResponse();
        try {
            JsonNode root = parseJsonSafely(rawResponse);
            response.setSummary(extractText(root, "summary", "Analysis completed successfully."));
            response.setBugs(extractStringList(root, "bugs"));
            response.setSuggestions(extractStringList(root, "suggestions"));
            response.setComplexity(extractText(root, "complexity", "Medium"));
            response.setTests(extractStringList(root, "tests"));
            return response;
        } catch (Exception e) {
            log.warn("[AiResponseParser] Non-JSON analysis response received. Recovering via plain text extraction...");
            response.setSummary("AI returned an unexpected response.");
            response.setBugs(new ArrayList<>());
            List<String> suggestions = new ArrayList<>();
            if (rawResponse != null && !rawResponse.trim().isEmpty()) {
                String clean = rawResponse.replaceAll("(?s)```[a-zA-Z]*\\s*(.*?)\\s*```", "$1").replaceAll("```", "").trim();
                if (clean.length() > 200) {
                    suggestions.add(clean.substring(0, 200) + "...");
                } else {
                    suggestions.add(clean);
                }
            } else if (fallbackDetail != null && !fallbackDetail.isEmpty()) {
                suggestions.add(fallbackDetail);
            } else {
                suggestions.add("Ensure the source file contains valid syntax.");
            }
            response.setSuggestions(suggestions);
            response.setComplexity("Unknown");
            response.setTests(new ArrayList<>());
            return response;
        }
    }

    /**
     * Parse project-wide analysis AI response into ProjectAnalysisResponse DTO.
     */
    public ProjectAnalysisResponse parseProjectAnalysisResponse(String rawResponse, String fallbackDetail) {
        ProjectAnalysisResponse response = new ProjectAnalysisResponse();
        try {
            JsonNode root = parseJsonSafely(rawResponse);
            response.setArchitectureSummary(extractText(root, "architectureSummary", "Project codebase analysis completed."));
            response.setCodeQualityOverview(extractText(root, "codeQualityOverview", "Code quality evaluation complete."));
            response.setDesignPatterns(extractStringList(root, "designPatterns"));
            response.setDuplicateLogic(extractStringList(root, "duplicateLogic"));
            response.setSecurityObservations(extractStringList(root, "securityObservations"));
            response.setPerformanceObservations(extractStringList(root, "performanceObservations"));
            response.setRefactoringSuggestions(extractStringList(root, "refactoringSuggestions"));

            int healthScore = 75;
            if (root.has("healthScore") && root.get("healthScore").isNumber()) {
                healthScore = Math.max(0, Math.min(100, root.get("healthScore").asInt()));
            }
            response.setHealthScore(healthScore);
            return response;
        } catch (Exception e) {
            log.warn("[AiResponseParser] Non-JSON project analysis response received. Recovering via plain text extraction...");
            response.setArchitectureSummary("Unable to evaluate architecture layout.");
            response.setCodeQualityOverview("Unable to evaluate code quality metrics.");
            response.setDesignPatterns(new ArrayList<>());
            response.setDuplicateLogic(new ArrayList<>());
            List<String> security = new ArrayList<>();
            security.add("Security scan advisory: " + (fallbackDetail != null ? fallbackDetail : "Scan required manual review."));
            response.setSecurityObservations(security);
            response.setPerformanceObservations(new ArrayList<>());
            List<String> suggestions = new ArrayList<>();
            suggestions.add("Retry project scan with smaller file batches if timeout occurs.");
            response.setRefactoringSuggestions(suggestions);
            response.setHealthScore(70);
            return response;
        }
    }


    /**
     * Clean chat response string: strip markdown fences if whole output is wrapped.
     */
    public String parseChatResponse(String rawResponse, String fallbackDefault) {
        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            return fallbackDefault != null ? fallbackDefault : "AI assistant is currently unavailable.";
        }
        String text = rawResponse.trim();
        if (text.startsWith("```markdown") && text.endsWith("```")) {
            text = text.substring(11, text.length() - 3).trim();
        } else if (text.startsWith("```") && text.endsWith("```")) {
            text = text.substring(3, text.length() - 3).trim();
        }
        return text;
    }

    private String extractText(JsonNode node, String fieldName, String defaultValue) {
        if (node.has(fieldName) && !node.get(fieldName).isNull()) {
            String val = node.get(fieldName).asText().trim();
            if (!val.isEmpty()) return val;
        }
        return defaultValue;
    }

    private List<String> extractStringList(JsonNode node, String fieldName) {
        List<String> list = new ArrayList<>();
        if (node.has(fieldName) && node.get(fieldName).isArray()) {
            node.get(fieldName).forEach(item -> {
                if (item != null && !item.isNull()) {
                    String s = item.asText().trim();
                    if (!s.isEmpty()) list.add(s);
                }
            });
        }
        return list;
    }

    /**
     * Sanitizes raw control characters (newlines, carriage returns, tabs) and unescaped
     * double quotes inside string values.
     */
    private String sanitizeJsonControlChars(String json) {
        if (json == null || json.isEmpty()) return json;
        StringBuilder sb = new StringBuilder(json.length() + 128);
        boolean inString = false;

        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);

            if (c == '"') {
                // Check if backslash escaped
                int backslashCount = 0;
                for (int j = i - 1; j >= 0 && json.charAt(j) == '\\'; j--) {
                    backslashCount++;
                }
                if (backslashCount % 2 == 0) {
                    inString = !inString;
                }
                sb.append(c);
                continue;
            }

            if (inString) {
                if (c == '\\') {
                    if (i + 1 < json.length()) {
                        char next = json.charAt(i + 1);
                        if (next == '"' || next == '\\' || next == '/' || next == 'b' || next == 'f' || next == 'n' || next == 'r' || next == 't' || next == 'u') {
                            sb.append(c);
                        } else {
                            sb.append("\\\\");
                        }
                    } else {
                        sb.append("\\\\");
                    }
                } else if (c == '\n') {
                    sb.append("\\n");
                } else if (c == '\r') {
                    sb.append("\\r");
                } else if (c == '\t') {
                    sb.append("\\t");
                } else if (c < 0x20) {
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
