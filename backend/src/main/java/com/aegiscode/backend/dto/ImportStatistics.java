package com.aegiscode.backend.dto;

import java.util.Map;

public class ImportStatistics {
    private int totalFiles;
    private int importedFiles;
    private int skippedFiles;
    private int failedFiles;
    private Map<String, Integer> skippedReasons;
    private Map<String, Integer> failedReasons;
    private long executionTimeMs;

    public ImportStatistics() {}

    public ImportStatistics(int totalFiles, int importedFiles, int skippedFiles, int failedFiles,
                            Map<String, Integer> skippedReasons, Map<String, Integer> failedReasons,
                            long executionTimeMs) {
        this.totalFiles = totalFiles;
        this.importedFiles = importedFiles;
        this.skippedFiles = skippedFiles;
        this.failedFiles = failedFiles;
        this.skippedReasons = skippedReasons;
        this.failedReasons = failedReasons;
        this.executionTimeMs = executionTimeMs;
    }

    public int getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(int totalFiles) {
        this.totalFiles = totalFiles;
    }

    public int getImportedFiles() {
        return importedFiles;
    }

    public void setImportedFiles(int importedFiles) {
        this.importedFiles = importedFiles;
    }

    public int getSkippedFiles() {
        return skippedFiles;
    }

    public void setSkippedFiles(int skippedFiles) {
        this.skippedFiles = skippedFiles;
    }

    public int getFailedFiles() {
        return failedFiles;
    }

    public void setFailedFiles(int failedFiles) {
        this.failedFiles = failedFiles;
    }

    public Map<String, Integer> getSkippedReasons() {
        return skippedReasons;
    }

    public void setSkippedReasons(Map<String, Integer> skippedReasons) {
        this.skippedReasons = skippedReasons;
    }

    public Map<String, Integer> getFailedReasons() {
        return failedReasons;
    }

    public void setFailedReasons(Map<String, Integer> failedReasons) {
        this.failedReasons = failedReasons;
    }

    public long getExecutionTimeMs() {
        return executionTimeMs;
    }

    public void setExecutionTimeMs(long executionTimeMs) {
        this.executionTimeMs = executionTimeMs;
    }
}
