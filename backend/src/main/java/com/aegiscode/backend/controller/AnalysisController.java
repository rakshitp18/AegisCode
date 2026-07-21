package com.aegiscode.backend.controller;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeRequest;
import com.aegiscode.backend.service.AnalyzerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/")
public class AnalysisController {

    private final AnalyzerService analyzerService;

    @Autowired
    public AnalysisController(AnalyzerService analyzerService) {
        this.analyzerService = analyzerService;
    }

    @GetMapping
    public Map<String, String> home() {
        return Collections.singletonMap("message", "Welcome to AegisCode Backend!");
    }

    @PostMapping("/analyze")
    public AnalysisResponse analyze(@RequestBody CodeRequest request) {
        return analyzerService.analyzeCode(request.getLanguage(), request.getCode());
    }
}
