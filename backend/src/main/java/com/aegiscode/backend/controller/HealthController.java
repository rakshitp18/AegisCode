package com.aegiscode.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> components = new HashMap<>();

        boolean isDbHealthy = checkDatabase();
        components.put("database", isDbHealthy ? "UP" : "DOWN");

        String overallStatus = isDbHealthy ? "UP" : "DEGRADED";

        response.put("status", overallStatus);
        response.put("service", "AegisCode Backend");
        response.put("timestamp", Instant.now().toString());
        response.put("components", components);

        return ResponseEntity.ok(response);
    }

    private boolean checkDatabase() {
        if (dataSource == null) {
            return false;
        }
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(2);
        } catch (Exception e) {
            return false;
        }
    }
}
