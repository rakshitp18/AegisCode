package com.aegiscode.backend.service;
import java.util.List;

import com.aegiscode.backend.dto.ProjectRequest;
import com.aegiscode.backend.dto.ProjectResponse;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.entity.Analysis;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import com.aegiscode.backend.repository.AnalysisRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AnalysisRepository analysisRepository;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          AnalysisRepository analysisRepository) {

        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.analysisRepository = analysisRepository;
    }

    public ProjectResponse createProject(ProjectRequest request,
                                         Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setGithubUrl(request.getGithubUrl());
        project.setUser(user);

        Project saved = projectRepository.save(project);

        return new ProjectResponse(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getGithubUrl(),
                saved.getCreatedAt()
        );
    }

    public List<ProjectResponse> getMyProjects(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return projectRepository.findByUser(user)
                .stream()
                .map(project -> new ProjectResponse(
                        project.getId(),
                        project.getName(),
                        project.getDescription(),
                        project.getGithubUrl(),
                        project.getCreatedAt()
                ))
                .toList();
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteProject(Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.aegiscode.backend.exception.ResourceNotFoundException("User not found"));

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new com.aegiscode.backend.exception.ResourceNotFoundException("Project not found"));

        if (!project.getUser().getId().equals(user.getId())) {
            throw new com.aegiscode.backend.exception.ForbiddenException("You do not have permission to delete this project");
        }

        List<Analysis> analyses = analysisRepository.findByProjectOrderByCreatedAtDesc(project);
        analysisRepository.deleteAll(analyses);

        projectRepository.delete(project);
    }
}