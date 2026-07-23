package com.aegiscode.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AnalysisResponse {
    private Long id;
    private String fileName;
    private String language;
    private String summary;
    private List<String> bugs;
    private List<String> suggestions;
    private String complexity;
    private List<String> tests;
    private CodeMetrics metrics;
    private LocalDateTime createdAt;

    public AnalysisResponse() {
    }

    public AnalysisResponse(Long id, String fileName, String language, String summary, List<String> bugs,
                            List<String> suggestions, String complexity, List<String> tests, CodeMetrics metrics,
                            LocalDateTime createdAt) {
        this.id = id;
        this.fileName = fileName;
        this.language = language;
        this.summary = summary;
        this.bugs = bugs;
        this.suggestions = suggestions;
        this.complexity = complexity;
        this.tests = tests;
        this.metrics = metrics;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public List<String> getBugs() {
        return bugs;
    }

    public void setBugs(List<String> bugs) {
        this.bugs = bugs;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public String getComplexity() {
        return complexity;
    }

    public void setComplexity(String complexity) {
        this.complexity = complexity;
    }

    public List<String> getTests() {
        return tests;
    }

    public void setTests(List<String> tests) {
        this.tests = tests;
    }

    public CodeMetrics getMetrics() {
        return metrics;
    }

    public void setMetrics(CodeMetrics metrics) {
        this.metrics = metrics;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
