package com.aegiscode.backend.controller;

import com.aegiscode.backend.dto.DashboardResponse;
import com.aegiscode.backend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/analytics
     * Returns user-wide overview metrics, charts, and recent activity logs.
     * Optionally takes a projectId parameter to append insights for that specific project.
     */
    @GetMapping("/analytics")
    public DashboardResponse getAnalytics(@RequestParam(required = false) Long projectId,
                                           Authentication authentication) {
        return dashboardService.getDashboardData(projectId, authentication);
    }
}
