package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.DashboardResponse;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final AnalysisRepository analysisRepository;
    private final UserRepository userRepository;

    @Autowired
    public DashboardService(ProjectRepository projectRepository,
                            AnalysisRepository analysisRepository,
                            UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.analysisRepository = analysisRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get analytics dashboard metrics for the authenticated user.
     * If a projectId is provided, also compile insights for that specific project.
     */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(Long projectId, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        DashboardResponse response = new DashboardResponse();

        // 1. Fetch user projects and analyses
        List<Project> userProjects = projectRepository.findByUser(user);
        List<Analysis> userAnalyses = analysisRepository.findByUserOrderByCreatedAtDesc(user);

        // 2. Compute Overview Stats
        response.setTotalProjects((long) userProjects.size());
        response.setTotalAnalyses((long) userAnalyses.size());
        response.setTotalFilesAnalyzed(analysisRepository.countDistinctFileNamesByUser(user));
        
        long totalBugs = userAnalyses.stream()
                .filter(a -> a.getBugs() != null)
                .mapToLong(a -> a.getBugs().size())
                .sum();
        response.setBugsFound(totalBugs);

        // Refactors: Currently we don't have a Refactor entity, so we return 0 as a placeholder
        response.setRefactorsPerformed(0L);

        long githubImports = userProjects.stream()
                .filter(p -> p.getGithubUrl() != null && !p.getGithubUrl().trim().isEmpty())
                .count();
        response.setGithubReposImported(githubImports);

        // 3. Compute Language Distribution Chart
        Map<String, Long> languages = userAnalyses.stream()
                .filter(a -> a.getLanguage() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getLanguage().toLowerCase(),
                        Collectors.counting()
                ));
        response.setLanguagesAnalysed(languages);

        // 4. Compute Complexity Distribution Chart
        Map<String, Long> complexities = userAnalyses.stream()
                .filter(a -> a.getComplexity() != null)
                .collect(Collectors.groupingBy(
                        a -> a.getComplexity(),
                        Collectors.counting()
                ));
        response.setComplexityDistribution(complexities);

        // 5. Compute Analyses Over Time (last 7 days/runs mapped to dates)
        DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("MMM dd");
        Map<String, Long> activityMap = new TreeMap<>(); // sorted dates
        userAnalyses.stream()
                .filter(a -> a.getCreatedAt() != null)
                .forEach(a -> {
                    String dateStr = a.getCreatedAt().format(dayFormatter);
                    activityMap.put(dateStr, activityMap.getOrDefault(dateStr, 0L) + 1);
                });
        
        List<DashboardResponse.DateCountPoint> activity = activityMap.entrySet().stream()
                .map(e -> new DashboardResponse.DateCountPoint(e.getKey(), e.getValue()))
                .collect(Collectors.toList());
        response.setActivityOverTime(activity);

        // 6. Compute Bug Categories Chart
        // Map bugs to simple categories based on keyword presence
        Map<String, Long> bugCats = new HashMap<>();
        bugCats.put("Security", 0L);
        bugCats.put("Naming & Conventions", 0L);
        bugCats.put("Logic & Redundancy", 0L);
        bugCats.put("Performance", 0L);
        bugCats.put("Other", 0L);

        for (Analysis a : userAnalyses) {
            if (a.getBugs() == null) continue;
            for (String bug : a.getBugs()) {
                String lower = bug.toLowerCase();
                if (lower.contains("security") || lower.contains("injection") || lower.contains("xss") || lower.contains("credentials")) {
                    bugCats.put("Security", bugCats.get("Security") + 1);
                } else if (lower.contains("name") || lower.contains("naming") || lower.contains("convention") || lower.contains("standard")) {
                    bugCats.put("Naming & Conventions", bugCats.get("Naming & Conventions") + 1);
                } else if (lower.contains("redundant") || lower.contains("unused") || lower.contains("dead code") || lower.contains("duplicate")) {
                    bugCats.put("Logic & Redundancy", bugCats.get("Logic & Redundancy") + 1);
                } else if (lower.contains("performance") || lower.contains("memory") || lower.contains("leak") || lower.contains("slow")) {
                    bugCats.put("Performance", bugCats.get("Performance") + 1);
                } else {
                    bugCats.put("Other", bugCats.get("Other") + 1);
                }
            }
        }
        response.setBugCategories(bugCats);

        // 7. Recent Activity List
        List<DashboardResponse.ActivityItem> activityItems = new ArrayList<>();
        
        // Add projects creation events
        for (Project p : userProjects) {
            if (p.getCreatedAt() != null) {
                String desc = "Project '" + p.getName() + "' created";
                if (p.getGithubUrl() != null && !p.getGithubUrl().trim().isEmpty()) {
                    desc = "GitHub repository '" + p.getName() + "' imported";
                }
                activityItems.add(new DashboardResponse.ActivityItem(
                        p.getGithubUrl() != null && !p.getGithubUrl().trim().isEmpty() ? "github_import" : "project_creation",
                        desc,
                        p.getCreatedAt()
                ));
            }
        }

        // Add analysis run events
        for (Analysis a : userAnalyses) {
            if (a.getCreatedAt() != null) {
                activityItems.add(new DashboardResponse.ActivityItem(
                        "analysis",
                        "File '" + a.getFileName() + "' analyzed (" + a.getLanguage() + ")",
                        a.getCreatedAt()
                ));
            }
        }

        // Sort combined activity: newest first
        activityItems.sort((act1, act2) -> act2.getTimestamp().compareTo(act1.getTimestamp()));
        
        // Limit to top 10 items
        response.setRecentActivity(activityItems.stream().limit(10).collect(Collectors.toList()));

        // 8. Project Insights (if a valid projectId is specified)
        if (projectId != null) {
            Project activeProject = projectRepository.findById(projectId).orElse(null);
            if (activeProject != null && activeProject.getUser().getId().equals(user.getId())) {
                DashboardResponse.ProjectInsights insights = new DashboardResponse.ProjectInsights();
                
                List<Analysis> projectAnalyses = userAnalyses.stream()
                        .filter(a -> a.getProject().getId().equals(projectId))
                        .collect(Collectors.toList());

                insights.setTotalAnalyses((long) projectAnalyses.size());

                // Average Complexity
                if (!projectAnalyses.isEmpty()) {
                    Map<String, Long> complexityCounts = projectAnalyses.stream()
                            .filter(a -> a.getComplexity() != null)
                            .collect(Collectors.groupingBy(Analysis::getComplexity, Collectors.counting()));
                    String avgComp = complexityCounts.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse("Low");
                    insights.setAverageComplexity(avgComp);

                    // Latest analysis info
                    Analysis latest = projectAnalyses.get(0); // list is sorted newest first
                    insights.setLatestAnalysisFileName(latest.getFileName());
                    insights.setLatestAnalysisTimestamp(latest.getCreatedAt());
                } else {
                    insights.setAverageComplexity("N/A");
                }

                // Languages Used
                List<String> langs = projectAnalyses.stream()
                        .filter(a -> a.getLanguage() != null)
                        .map(a -> a.getLanguage().toLowerCase())
                        .distinct()
                        .collect(Collectors.toList());
                insights.setLanguagesUsed(langs);

                response.setActiveProjectInsights(insights);
            }
        }

        return response;
    }
}
