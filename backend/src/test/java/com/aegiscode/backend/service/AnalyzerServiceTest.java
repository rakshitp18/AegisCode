package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeMetrics;
import com.aegiscode.backend.dto.CodeRequest;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyzerServiceTest {

    @Mock
    private AiService aiService;

    @Mock
    private StaticAnalysisService staticAnalysisService;

    @Mock
    private AnalysisRepository analysisRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AnalyzerService analyzerService;

    private User testUser;
    private Project testProject;
    private AnalysisResponse mockAiResponse;
    private CodeMetrics mockMetrics;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testProject = new Project();
        testProject.setId(10L);
        testProject.setUser(testUser);

        mockAiResponse = new AnalysisResponse();
        mockAiResponse.setSummary("AI Summary");
        mockAiResponse.setComplexity("Low");
        mockAiResponse.setBugs(new ArrayList<>());
        mockAiResponse.setSuggestions(new ArrayList<>());
        mockAiResponse.setTests(new ArrayList<>());

        mockMetrics = new CodeMetrics(100, 2, 10, 1, 0);
    }

    @Test
    void analyzeCode_HappyPath_ReturnsResponse() {
        when(aiService.analyzeWithAi("java", "class A {}")).thenReturn(mockAiResponse);
        when(staticAnalysisService.analyzeStatic("java", "class A {}")).thenReturn(mockMetrics);

        AnalysisResponse response = analyzerService.analyzeCode("java", "class A {}");

        assertNotNull(response);
        assertEquals("AI Summary", response.getSummary());
        assertEquals(mockMetrics, response.getMetrics());
    }

    @Test
    void analyzeAndPersist_WithProjectAndUser_SavesToDatabase() {
        CodeRequest request = new CodeRequest("java", "class A {}", "TestProject", "A.java");
        request.setProjectId(10L);

        Analysis savedAnalysis = new Analysis();
        savedAnalysis.setId(100L);
        savedAnalysis.setFileName("A.java");
        savedAnalysis.setLanguage("java");
        savedAnalysis.setCreatedAt(LocalDateTime.now());

        when(aiService.analyzeWithAi("java", "class A {}")).thenReturn(mockAiResponse);
        when(staticAnalysisService.analyzeStatic("java", "class A {}")).thenReturn(mockMetrics);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(analysisRepository.save(any(Analysis.class))).thenReturn(savedAnalysis);

        AnalysisResponse response = analyzerService.analyzeAndPersist(request, authentication);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        verify(analysisRepository, times(1)).save(any(Analysis.class));
    }

    @Test
    void analyzeAndPersist_NoProject_DoesNotSaveToDatabase() {
        CodeRequest request = new CodeRequest("java", "class A {}", "TestProject", "A.java");
        request.setProjectId(null); // No project id

        when(aiService.analyzeWithAi("java", "class A {}")).thenReturn(mockAiResponse);
        when(staticAnalysisService.analyzeStatic("java", "class A {}")).thenReturn(mockMetrics);

        AnalysisResponse response = analyzerService.analyzeAndPersist(request, authentication);

        assertNotNull(response);
        assertNull(response.getId());
        verify(analysisRepository, never()).save(any(Analysis.class));
    }

    @Test
    void analyzeAndPersist_DatabaseSaveFailure_NonFatalFallback() {
        CodeRequest request = new CodeRequest("java", "class A {}", "TestProject", "A.java");
        request.setProjectId(10L);

        when(aiService.analyzeWithAi("java", "class A {}")).thenReturn(mockAiResponse);
        when(staticAnalysisService.analyzeStatic("java", "class A {}")).thenReturn(mockMetrics);
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.findById(10L)).thenReturn(Optional.of(testProject));
        when(analysisRepository.save(any(Analysis.class))).thenThrow(new RuntimeException("DB offline"));

        // Exception should be caught internally by try-catch inside service so endpoint still completes
        AnalysisResponse response = analyzerService.analyzeAndPersist(request, authentication);

        assertNotNull(response);
        assertNull(response.getId()); // ID remains null since save failed
    }
}
