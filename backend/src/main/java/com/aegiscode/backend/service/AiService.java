package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
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

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

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
}
