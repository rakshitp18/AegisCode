package com.aegiscode.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CodeRequest {

    @NotBlank(message = "Language is required")
    private String language;

    @NotBlank(message = "Code is required")
    private String code;

    private String projectName;
    private String fileName;
    private Long projectId;

    public CodeRequest() {}

    public CodeRequest(String language, String code) {
        this.language = language;
        this.code = code;
    }

    public CodeRequest(String language, String code, String projectName, String fileName) {
        this.language = language;
        this.code = code;
        this.projectName = projectName;
        this.fileName = fileName;
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
}
