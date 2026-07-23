package com.aegiscode.backend.dto;

import java.time.LocalDateTime;

public class ProjectResponse {

    private Long id;
    private String name;
    private String description;
    private String githubUrl;
    private LocalDateTime createdAt;

    public ProjectResponse() {}

    public ProjectResponse(Long id,
                           String name,
                           String description,
                           String githubUrl,
                           LocalDateTime createdAt) {

        this.id = id;
        this.name = name;
        this.description = description;
        this.githubUrl = githubUrl;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}