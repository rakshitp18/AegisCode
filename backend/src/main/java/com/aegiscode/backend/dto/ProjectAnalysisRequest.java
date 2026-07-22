package com.aegiscode.backend.dto;

import java.util.List;

public class ProjectAnalysisRequest {
    private String projectName;
    private List<ProjectFile> files;
    private Integer startOffset = 0;

    public ProjectAnalysisRequest() {}

    public ProjectAnalysisRequest(String projectName, List<ProjectFile> files) {
        this.projectName = projectName;
        this.files = files;
        this.startOffset = 0;
    }

    public ProjectAnalysisRequest(String projectName, List<ProjectFile> files, Integer startOffset) {
        this.projectName = projectName;
        this.files = files;
        this.startOffset = startOffset;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public List<ProjectFile> getFiles() {
        return files;
    }

    public void setFiles(List<ProjectFile> files) {
        this.files = files;
    }

    public Integer getStartOffset() {
        return startOffset;
    }

    public void setStartOffset(Integer startOffset) {
        this.startOffset = startOffset;
    }
}
