package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.dto.CodeMetrics;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AnalyzerService {

    private final AiService aiService;
    private final StaticAnalysisService staticAnalysisService;

    @Autowired
    public AnalyzerService(AiService aiService, StaticAnalysisService staticAnalysisService) {
        this.aiService = aiService;
        this.staticAnalysisService = staticAnalysisService;
    }

    public AnalysisResponse analyzeCode(String language, String code) {
        AnalysisResponse response = aiService.analyzeWithAi(language, code);
        CodeMetrics metrics = staticAnalysisService.analyzeStatic(language, code);
        response.setMetrics(metrics);
        return response;
    }
}
