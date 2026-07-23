package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private HttpClient mockHttpClient;

    @Mock
    private HttpResponse<String> mockResponse;

    @InjectMocks
    private AiService aiService;

    @BeforeEach
    void setUp() throws Exception {
        // Inject mock HttpClient using reflection
        Field clientField = AiService.class.getDeclaredField("httpClient");
        clientField.setAccessible(true);
        clientField.set(aiService, mockHttpClient);

        // Inject mock API key
        Field keyField = AiService.class.getDeclaredField("apiKey");
        keyField.setAccessible(true);
        keyField.set(aiService, "mock-api-key");
    }

    @Test
    void analyzeWithAi_HappyPath_ReturnsStructuredJSON() throws Exception {
        String jsonResponse = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"content\": \"{\\\"summary\\\":\\\"Mock Summary\\\",\\\"bugs\\\":[\\\"Bug 1\\\"],\\\"suggestions\\\":[\\\"Sug 1\\\"],\\\"complexity\\\":\\\"Low\\\",\\\"tests\\\":[\\\"Test 1\\\"]}\"\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(jsonResponse);
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        AnalysisResponse response = aiService.analyzeWithAi("java", "class A {}");

        assertNotNull(response);
        assertEquals("Mock Summary", response.getSummary());
        assertEquals("Low", response.getComplexity());
        assertEquals(1, response.getBugs().size());
        assertEquals("Bug 1", response.getBugs().get(0));
    }

    @Test
    void analyzeWithAi_APIErrorResponse_ReturnsFallback() throws Exception {
        when(mockResponse.statusCode()).thenReturn(500);
        when(mockResponse.body()).thenReturn("Internal Server Error");
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        AnalysisResponse response = aiService.analyzeWithAi("java", "class A {}");

        assertNotNull(response);
        assertEquals("AI returned an unexpected response.", response.getSummary());
        assertEquals("Unknown", response.getComplexity());
        assertTrue(response.getSuggestions().get(0).contains("Groq API error. Status: 500"));
    }

    @Test
    void analyzeWithAi_InvalidJSONResponse_ReturnsFallback() throws Exception {
        String jsonResponse = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"content\": \"Invalid non-json prompt result\"\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(jsonResponse);
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        AnalysisResponse response = aiService.analyzeWithAi("java", "class A {}");

        assertNotNull(response);
        assertEquals("AI returned an unexpected response.", response.getSummary());
        assertEquals("Unknown", response.getComplexity());
    }

    @Test
    void refactorWithAi_HappyPath_ReturnsRefactorResponse() throws Exception {
        String jsonResponse = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"content\": \"{\\\"originalCode\\\":\\\"int a = 1;\\\",\\\"refactoredCode\\\":\\\"final int a = 1;\\\",\\\"explanation\\\":\\\"Made final\\\",\\\"improvements\\\":[\\\"final\\\"]}\"\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(jsonResponse);
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        RefactorRequest request = new RefactorRequest();
        request.setLanguage("java");
        request.setScope("file");
        request.setFileContent("int a = 1;");
        request.setSelectedText("int a = 1;");
        request.setIntent("final");
        request.setCursorLine(1);
        
        RefactorResponse response = aiService.refactorWithAi(request);

        assertNotNull(response);
        assertEquals("int a = 1;", response.getOriginalCode());
        assertEquals("final int a = 1;", response.getRefactoredCode());
        assertEquals("Made final", response.getExplanation());
    }

    @Test
    void chatWithProjectContext_HappyPath_ReturnsResponseString() throws Exception {
        String jsonResponse = "{\n" +
                "  \"choices\": [{\n" +
                "    \"message\": {\n" +
                "      \"content\": \"Mock Chat Response\"\n" +
                "    }\n" +
                "  }]\n" +
                "}";

        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(jsonResponse);
        when(mockHttpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(mockResponse);

        ChatRequest request = new ChatRequest();
        request.setProjectName("TestProject");
        request.setMessage("How is the code?");
        request.setHistory(new ArrayList<>());
        
        ProjectFile projectFile = new ProjectFile("A.java", "java", "class A {}");
        request.setSelectedFile(projectFile);
        request.setRelevantFiles(new ArrayList<>());
        request.setProjectMetrics(new java.util.HashMap<>());

        String response = aiService.chatWithProjectContext(request);

        assertNotNull(response);
        assertEquals("Mock Chat Response", response);
    }
}
