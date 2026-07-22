package com.aegiscode.backend.controller;

import com.aegiscode.backend.dto.*;
import com.aegiscode.backend.service.AnalyzerService;
import com.aegiscode.backend.service.StaticAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/")
public class AnalysisController {

    private final AnalyzerService analyzerService;
    private final StaticAnalysisService staticAnalysisService;

    @Autowired
    public AnalysisController(AnalyzerService analyzerService, StaticAnalysisService staticAnalysisService) {
        this.analyzerService = analyzerService;
        this.staticAnalysisService = staticAnalysisService;
    }

    @GetMapping
    public Map<String, String> home() {
        return Collections.singletonMap("message", "Welcome to AegisCode Backend!");
    }

    @PostMapping("/analyze")
    public AnalysisResponse analyze(@RequestBody CodeRequest request) {
        return analyzerService.analyzeCode(request.getLanguage(), request.getCode());
    }

    @PostMapping("/analyze-project")
    public ProjectAnalysisResponse analyzeProject(@RequestBody ProjectAnalysisRequest request) {
        return analyzerService.analyzeProject(request);
    }

    @PostMapping("/analyze-project-static")
    public ProjectStaticAnalysisResponse analyzeProjectStatic(@RequestBody ProjectAnalysisRequest request) {
        return staticAnalysisService.analyzeProjectStatic(request);
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        String answer = analyzerService.chatWithProject(request);
        return new ChatResponse(answer);
    }

    @PostMapping("/github-import")
    public Map<String, Object> importGitHubRepository(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        return analyzerService.importGitHubRepository(url);
    }

    @PostMapping("/refactor")
    public RefactorResponse refactor(@RequestBody RefactorRequest request) {
        return analyzerService.refactorCode(request);
    }
}
