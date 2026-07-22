package com.aegiscode.backend.dto;

import java.util.List;

public class ProjectAnalysisResponse {
    private String architectureSummary;
    private String codeQualityOverview;
    private List<String> designPatterns;
    private List<String> duplicateLogic;
    private List<String> securityObservations;
    private List<String> performanceObservations;
    private List<String> refactoringSuggestions;
    private Integer healthScore;
    private Integer filesAnalyzed = 0;
    private Integer totalFiles = 0;
    private Boolean contextOmitted = false;
    private Integer nextOffset = 0;
    private Integer startOffset = 0;
    private Boolean isCombinedReport = false;
    private Integer totalBatchesAnalyzed = 1;

    public ProjectAnalysisResponse() {}

    public ProjectAnalysisResponse(String architectureSummary, String codeQualityOverview, List<String> designPatterns,
                                   List<String> duplicateLogic, List<String> securityObservations,
                                   List<String> performanceObservations, List<String> refactoringSuggestions,
                                   Integer healthScore) {
        this.architectureSummary = architectureSummary;
        this.codeQualityOverview = codeQualityOverview;
        this.designPatterns = designPatterns;
        this.duplicateLogic = duplicateLogic;
        this.securityObservations = securityObservations;
        this.performanceObservations = performanceObservations;
        this.refactoringSuggestions = refactoringSuggestions;
        this.healthScore = healthScore;
    }

    public String getArchitectureSummary() {
        return architectureSummary;
    }

    public void setArchitectureSummary(String architectureSummary) {
        this.architectureSummary = architectureSummary;
    }

    public String getCodeQualityOverview() {
        return codeQualityOverview;
    }

    public void setCodeQualityOverview(String codeQualityOverview) {
        this.codeQualityOverview = codeQualityOverview;
    }

    public List<String> getDesignPatterns() {
        return designPatterns;
    }

    public void setDesignPatterns(List<String> designPatterns) {
        this.designPatterns = designPatterns;
    }

    public List<String> getDuplicateLogic() {
        return duplicateLogic;
    }

    public void setDuplicateLogic(List<String> duplicateLogic) {
        this.duplicateLogic = duplicateLogic;
    }

    public List<String> getSecurityObservations() {
        return securityObservations;
    }

    public void setSecurityObservations(List<String> securityObservations) {
        this.securityObservations = securityObservations;
    }

    public List<String> getPerformanceObservations() {
        return performanceObservations;
    }

    public void setPerformanceObservations(List<String> performanceObservations) {
        this.performanceObservations = performanceObservations;
    }

    public List<String> getRefactoringSuggestions() {
        return refactoringSuggestions;
    }

    public void setRefactoringSuggestions(List<String> refactoringSuggestions) {
        this.refactoringSuggestions = refactoringSuggestions;
    }

    public Integer getHealthScore() {
        return healthScore;
    }

    public void setHealthScore(Integer healthScore) {
        this.healthScore = healthScore;
    }

    public Integer getFilesAnalyzed() {
        return filesAnalyzed;
    }

    public void setFilesAnalyzed(Integer filesAnalyzed) {
        this.filesAnalyzed = filesAnalyzed;
    }

    public Integer getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(Integer totalFiles) {
        this.totalFiles = totalFiles;
    }

    public Boolean getContextOmitted() {
        return contextOmitted;
    }

    public void setContextOmitted(Boolean contextOmitted) {
        this.contextOmitted = contextOmitted;
    }

    public Integer getNextOffset() {
        return nextOffset;
    }

    public void setNextOffset(Integer nextOffset) {
        this.nextOffset = nextOffset;
    }

    public Integer getStartOffset() {
        return startOffset;
    }

    public void setStartOffset(Integer startOffset) {
        this.startOffset = startOffset;
    }

    public Boolean getIsCombinedReport() {
        return isCombinedReport;
    }

    public void setIsCombinedReport(Boolean isCombinedReport) {
        this.isCombinedReport = isCombinedReport;
    }

    public Integer getTotalBatchesAnalyzed() {
        return totalBatchesAnalyzed;
    }

    public void setTotalBatchesAnalyzed(Integer totalBatchesAnalyzed) {
        this.totalBatchesAnalyzed = totalBatchesAnalyzed;
    }
}
