package com.aegiscode.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class DashboardResponse {
    private Long totalProjects;
    private Long totalAnalyses;
    private Long totalFilesAnalyzed;
    private Long bugsFound;
    private Long refactorsPerformed;
    private Long githubReposImported;

    private Map<String, Long> languagesAnalysed;
    private Map<String, Long> complexityDistribution;
    private List<DateCountPoint> activityOverTime;
    private Map<String, Long> bugCategories;
    private List<ActivityItem> recentActivity;
    private ProjectInsights activeProjectInsights;

    public DashboardResponse() {}

    public Long getTotalProjects() { return totalProjects; }
    public void setTotalProjects(Long totalProjects) { this.totalProjects = totalProjects; }

    public Long getTotalAnalyses() { return totalAnalyses; }
    public void setTotalAnalyses(Long totalAnalyses) { this.totalAnalyses = totalAnalyses; }

    public Long getTotalFilesAnalyzed() { return totalFilesAnalyzed; }
    public void setTotalFilesAnalyzed(Long totalFilesAnalyzed) { this.totalFilesAnalyzed = totalFilesAnalyzed; }

    public Long getBugsFound() { return bugsFound; }
    public void setBugsFound(Long bugsFound) { this.bugsFound = bugsFound; }

    public Long getRefactorsPerformed() { return refactorsPerformed; }
    public void setRefactorsPerformed(Long refactorsPerformed) { this.refactorsPerformed = refactorsPerformed; }

    public Long getGithubReposImported() { return githubReposImported; }
    public void setGithubReposImported(Long githubReposImported) { this.githubReposImported = githubReposImported; }

    public Map<String, Long> getLanguagesAnalysed() { return languagesAnalysed; }
    public void setLanguagesAnalysed(Map<String, Long> languagesAnalysed) { this.languagesAnalysed = languagesAnalysed; }

    public Map<String, Long> getComplexityDistribution() { return complexityDistribution; }
    public void setComplexityDistribution(Map<String, Long> complexityDistribution) { this.complexityDistribution = complexityDistribution; }

    public List<DateCountPoint> getActivityOverTime() { return activityOverTime; }
    public void setActivityOverTime(List<DateCountPoint> activityOverTime) { this.activityOverTime = activityOverTime; }

    public Map<String, Long> getBugCategories() { return bugCategories; }
    public void setBugCategories(Map<String, Long> bugCategories) { this.bugCategories = bugCategories; }

    public List<ActivityItem> getRecentActivity() { return recentActivity; }
    public void setRecentActivity(List<ActivityItem> recentActivity) { this.recentActivity = recentActivity; }

    public ProjectInsights getActiveProjectInsights() { return activeProjectInsights; }
    public void setActiveProjectInsights(ProjectInsights activeProjectInsights) { this.activeProjectInsights = activeProjectInsights; }

    // Nested classes
    public static class DateCountPoint {
        private String date;
        private Long count;

        public DateCountPoint() {}
        public DateCountPoint(String date, Long count) {
            this.date = date;
            this.count = count;
        }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }

        public Long getCount() { return count; }
        public void setCount(Long count) { this.count = count; }
    }

    public static class ActivityItem {
        private String type; // "analysis", "project_creation", "github_import", "refactor"
        private String description;
        private LocalDateTime timestamp;

        public ActivityItem() {}
        public ActivityItem(String type, String description, LocalDateTime timestamp) {
            this.type = type;
            this.description = description;
            this.timestamp = timestamp;
        }

        public String getType() { return type; }
        public void setType(String type) { this.type = type; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    }

    public static class ProjectInsights {
        private Long totalAnalyses;
        private String averageComplexity;
        private List<String> languagesUsed;
        private String latestAnalysisFileName;
        private LocalDateTime latestAnalysisTimestamp;

        public ProjectInsights() {}

        public Long getTotalAnalyses() { return totalAnalyses; }
        public void setTotalAnalyses(Long totalAnalyses) { this.totalAnalyses = totalAnalyses; }

        public String getAverageComplexity() { return averageComplexity; }
        public void setAverageComplexity(String averageComplexity) { this.averageComplexity = averageComplexity; }

        public List<String> getLanguagesUsed() { return languagesUsed; }
        public void setLanguagesUsed(List<String> languagesUsed) { this.languagesUsed = languagesUsed; }

        public String getLatestAnalysisFileName() { return latestAnalysisFileName; }
        public void setLatestAnalysisFileName(String latestAnalysisFileName) { this.latestAnalysisFileName = latestAnalysisFileName; }

        public LocalDateTime getLatestAnalysisTimestamp() { return latestAnalysisTimestamp; }
        public void setLatestAnalysisTimestamp(LocalDateTime latestAnalysisTimestamp) { this.latestAnalysisTimestamp = latestAnalysisTimestamp; }
    }
}
