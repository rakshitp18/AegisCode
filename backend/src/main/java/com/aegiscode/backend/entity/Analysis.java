package com.aegiscode.backend.entity;

import com.aegiscode.backend.dto.CodeMetrics;
import com.aegiscode.backend.entity.converter.CodeMetricsConverter;
import com.aegiscode.backend.entity.converter.ListStringConverter;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "analyses")
public class Analysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "language")
    private String language;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "bugs", columnDefinition = "TEXT")
    @Convert(converter = ListStringConverter.class)
    private List<String> bugs = new ArrayList<>();

    @Column(name = "suggestions", columnDefinition = "TEXT")
    @Convert(converter = ListStringConverter.class)
    private List<String> suggestions = new ArrayList<>();

    @Column(name = "complexity")
    private String complexity;

    @Column(name = "tests", columnDefinition = "TEXT")
    @Convert(converter = ListStringConverter.class)
    private List<String> tests = new ArrayList<>();

    @Column(name = "metrics", columnDefinition = "TEXT")
    @Convert(converter = CodeMetricsConverter.class)
    private CodeMetrics metrics;

    @Column(name = "analysis_type")
    private String analysisType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Analysis() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getAnalysisType() {
        return analysisType;
    }

    public void setAnalysisType(String analysisType) {
        this.analysisType = analysisType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}