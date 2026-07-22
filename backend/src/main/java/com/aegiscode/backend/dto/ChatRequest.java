package com.aegiscode.backend.dto;

import java.util.List;
import java.util.Map;

public class ChatRequest {
    private String message;
    private List<Map<String, String>> history;
    private String projectName;
    private ProjectFile selectedFile;
    private List<ProjectFile> relevantFiles;
    private Map<String, Object> projectMetrics;
    private Map<String, Object> astData;

    public ChatRequest() {}

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<Map<String, String>> getHistory() {
        return history;
    }

    public void setHistory(List<Map<String, String>> history) {
        this.history = history;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public ProjectFile getSelectedFile() {
        return selectedFile;
    }

    public void setSelectedFile(ProjectFile selectedFile) {
        this.selectedFile = selectedFile;
    }

    public List<ProjectFile> getRelevantFiles() {
        return relevantFiles;
    }

    public void setRelevantFiles(List<ProjectFile> relevantFiles) {
        this.relevantFiles = relevantFiles;
    }

    public Map<String, Object> getProjectMetrics() {
        return projectMetrics;
    }

    public void setProjectMetrics(Map<String, Object> projectMetrics) {
        this.projectMetrics = projectMetrics;
    }

    public Map<String, Object> getAstData() {
        return astData;
    }

    public void setAstData(Map<String, Object> astData) {
        this.astData = astData;
    }
}
