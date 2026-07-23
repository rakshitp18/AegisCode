package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.ProjectRequest;
import com.aegiscode.backend.dto.ProjectResponse;
import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProjectService projectService;

    private User testUser;
    private Project testProject;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");

        testProject = new Project();
        testProject.setId(1L);
        testProject.setName("Test Project");
        testProject.setDescription("Description");
        testProject.setGithubUrl("https://github.com/test/repo");
        testProject.setUser(testUser);
        testProject.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void createProject_HappyPath_Succeeds() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Test Project");
        request.setDescription("Description");
        request.setGithubUrl("https://github.com/test/repo");

        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.save(any(Project.class))).thenReturn(testProject);

        ProjectResponse response = projectService.createProject(request, authentication);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test Project", response.getName());
        assertEquals("https://github.com/test/repo", response.getGithubUrl());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void createProject_UserNotFound_ThrowsRuntimeException() {
        ProjectRequest request = new ProjectRequest();
        request.setName("Test Project");
        request.setDescription("Description");
        request.setGithubUrl("https://github.com/test/repo");

        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> projectService.createProject(request, authentication));
        assertEquals("User not found", exception.getMessage());
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    void getMyProjects_HappyPath_ReturnsList() {
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(projectRepository.findByUser(testUser)).thenReturn(Collections.singletonList(testProject));

        List<ProjectResponse> projects = projectService.getMyProjects(authentication);

        assertNotNull(projects);
        assertEquals(1, projects.size());
        assertEquals("Test Project", projects.get(0).getName());
    }

    @Test
    void getMyProjects_UserNotFound_ThrowsRuntimeException() {
        when(authentication.getName()).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> projectService.getMyProjects(authentication));
        assertEquals("User not found", exception.getMessage());
    }
}
