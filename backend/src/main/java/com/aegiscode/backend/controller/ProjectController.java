package com.aegiscode.backend.controller;

import java.util.List;
import com.aegiscode.backend.dto.ProjectRequest;
import com.aegiscode.backend.dto.ProjectResponse;
import com.aegiscode.backend.service.ProjectService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    @PostMapping
    public ProjectResponse createProject(@jakarta.validation.Valid @RequestBody ProjectRequest request,
                                         Authentication authentication) {

        return service.createProject(request, authentication);
    }
    @GetMapping
    public List<ProjectResponse> getMyProjects(Authentication authentication) {
        return service.getMyProjects(authentication);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<Void> deleteProject(@PathVariable Long id,
                                                                        Authentication authentication) {
        service.deleteProject(id, authentication);
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}