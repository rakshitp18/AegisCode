package com.aegiscode.backend.controller;

import com.aegiscode.backend.dto.AnalysisResponse;
import com.aegiscode.backend.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HistoryController {

    private final HistoryService historyService;

    @Autowired
    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    /**
     * GET /api/projects/{projectId}/analyses
     * Returns all analyses for the given project, newest first.
     */
    @GetMapping("/projects/{projectId}/analyses")
    public List<AnalysisResponse> getProjectHistory(@PathVariable Long projectId,
                                                     Authentication authentication) {
        return historyService.getAnalysesForProject(projectId, authentication);
    }

    /**
     * DELETE /api/analyses/{id}
     * Deletes a single analysis. Owner-only.
     */
    @DeleteMapping("/analyses/{id}")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable Long id,
                                               Authentication authentication) {
        historyService.deleteAnalysis(id, authentication);
        return ResponseEntity.noContent().build();
    }
}
