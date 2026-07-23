package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    private final AnalysisRepository analysisRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Autowired
    public HistoryService(AnalysisRepository analysisRepository,
                          ProjectRepository projectRepository,
                          UserRepository userRepository) {
        this.analysisRepository = analysisRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns all analyses for a project, newest first.
     * Validates that the authenticated user owns the project.
     */
    @Transactional(readOnly = true)
    public List<AnalysisResponse> getAnalysesForProject(Long projectId, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        // Ownership check
        if (!project.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return analysisRepository.findByProjectOrderByCreatedAtDesc(project)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Deletes a single analysis by id.
     * Validates that the authenticated user owns it.
     */
    @Transactional
    public void deleteAnalysis(Long id, Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Analysis not found"));

        if (!analysis.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        analysisRepository.delete(analysis);
    }

    private AnalysisResponse toResponse(Analysis a) {
        AnalysisResponse r = new AnalysisResponse();
        r.setId(a.getId());
        r.setFileName(a.getFileName());
        r.setLanguage(a.getLanguage());
        r.setSummary(a.getSummary());
        r.setBugs(a.getBugs());
        r.setSuggestions(a.getSuggestions());
        r.setComplexity(a.getComplexity());
        r.setTests(a.getTests());
        r.setMetrics(a.getMetrics());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }
}
