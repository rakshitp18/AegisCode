package com.aegiscode.backend.dto;

import java.util.List;

public class AnalysisResponse {
    private String summary;
    private List<String> bugs;
    private List<String> suggestions;
    private String complexity;
    private List<String> tests;
    private CodeMetrics metrics;

    public AnalysisResponse() {
    }

    public AnalysisResponse(String summary, List<String> bugs, List<String> suggestions, String complexity, List<String> tests, CodeMetrics metrics) {
        this.summary = summary;
        this.bugs = bugs;
        this.suggestions = suggestions;
        this.complexity = complexity;
        this.tests = tests;
        this.metrics = metrics;
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
}
