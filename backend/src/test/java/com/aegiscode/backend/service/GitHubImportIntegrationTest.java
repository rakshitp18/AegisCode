package com.aegiscode.backend.service;

import com.aegiscode.backend.entity.Project;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.AnalysisRepository;
import com.aegiscode.backend.repository.ProjectRepository;
import com.aegiscode.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;
import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class GitHubImportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AnalysisRepository analysisRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private AnalyzerService analyzerService;

    @BeforeEach
    void setUp() {
        analysisRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();

        // Clean up any left-over temp clones before running the test
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.getName().startsWith("aegiscode-clone-")) {
                        deleteDirectoryRecursively(f);
                    }
                }
            }
        }

        User user = new User();
        user.setName("Test User");
        user.setEmail("test2@example.com");
        user.setPassword(passwordEncoder.encode("password"));
        userRepository.save(user);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.getName().startsWith("aegiscode-clone-")) {
                        deleteDirectoryRecursively(f);
                    }
                }
            }
        }
    }

    private void deleteDirectoryRecursively(File file) {
        if (file == null || !file.exists()) return;
        File[] files = file.listFiles();
        if (files != null) {
            for (File f : files) deleteDirectoryRecursively(f);
        }
        file.setWritable(true, false);
        if (!file.delete()) {
            file.deleteOnExit();
        }
    }

    private String obtainAccessToken() throws Exception {
        return obtainAccessTokenFor("test2@example.com", "password");
    }

    private String obtainAccessTokenFor(String email, String password) throws Exception {
        Map<String, String> loginReq = new HashMap<>();
        loginReq.put("email", email);
        loginReq.put("password", password);

        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<String, Object> map = new ObjectMapper().readValue(response, Map.class);
        return (String) map.get("token");
    }

    @Test
    void testPublicRepositoryImport_Success() throws Exception {
        String token = obtainAccessToken();
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/octocat/Spoon-Knife");

        mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.projectName").value("Spoon-Knife"))
                .andExpect(jsonPath("$.data.id").exists());

        // Verify database state: project should be saved and associated
        User user = userRepository.findByEmail("test2@example.com").orElseThrow();
        List<Project> projects = projectRepository.findByUser(user);
        assertEquals(1, projects.size());
        assertEquals("Spoon-Knife", projects.get(0).getName());
        assertTrue(projects.get(0).getGithubUrl().contains("Spoon-Knife.git"));

        // Verify temporary clone directories are cleaned up
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    assertFalse(f.getName().startsWith("aegiscode-clone-"));
                }
            }
        }
    }

    @Test
    void testImport_InvalidUrl_ReturnsBadRequest() throws Exception {
        String token = obtainAccessToken();
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/owner");

        mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_URL"))
                .andExpect(jsonPath("$.message").value("Invalid repository URL format. Use: https://github.com/owner/repository"));

        // Verify temporary clone directories are cleaned up
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    assertFalse(f.getName().startsWith("aegiscode-clone-"));
                }
            }
        }
    }

    @Test
    void testImport_RepositoryNotFound_ReturnsInternalServerError() throws Exception {
        String token = obtainAccessToken();
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/spring-projects/non-existent-repo-999");

        mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("REPOSITORY_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("Repository not found. Please verify the URL is correct and public."));

        // Verify no project was saved in the database
        User user = userRepository.findByEmail("test2@example.com").orElseThrow();
        List<Project> projects = projectRepository.findByUser(user);
        assertEquals(0, projects.size());

        // Verify temporary clone directories are cleaned up
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    assertFalse(f.getName().startsWith("aegiscode-clone-"));
                }
            }
        }
    }

    @Test
    void testImport_PrivateRepository_ReturnsInternalServerError() throws Exception {
        String token = obtainAccessToken();
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/github/private-repo");

        String response = mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("REPOSITORY_NOT_FOUND"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Map<String, Object> map = new ObjectMapper().readValue(response, Map.class);
        String message = (String) map.get("message");
        // Accepts either "Access denied..." or "Repository not found..." since GitHub serves 404 for private repositories
        assertTrue(message.contains("Access denied") || message.contains("Repository not found"));

        // Verify no project was saved in the database
        User user = userRepository.findByEmail("test2@example.com").orElseThrow();
        List<Project> projects = projectRepository.findByUser(user);
        assertEquals(0, projects.size());

        // Verify temporary clone directories are cleaned up
        File tempClonesDir = new File(".temp-clones");
        if (tempClonesDir.exists()) {
            File[] files = tempClonesDir.listFiles();
            if (files != null) {
                for (File f : files) {
                    assertFalse(f.getName().startsWith("aegiscode-clone-"));
                }
            }
        }
    }

    @Test
    void testImport_RepeatedImport_DoesNotCreateDuplicateProject() throws Exception {
        String token = obtainAccessToken();
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/octocat/Spoon-Knife");

        // First import
        mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk());

        // Second import of the same repo
        mockMvc.perform(post("/github-import")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isOk());

        // Verify database: only 1 project should exist (no duplicates)
        User user = userRepository.findByEmail("test2@example.com").orElseThrow();
        List<Project> projects = projectRepository.findByUser(user);
        assertEquals(1, projects.size());
    }

    @Test
    void testImport_Unauthorized_Returns403() throws Exception {
        Map<String, String> request = new HashMap<>();
        request.put("url", "https://github.com/octocat/Spoon-Knife");

        mockMvc.perform(post("/github-import")
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAnalyze_ForbiddenProject_Returns403Forbidden() throws Exception {
        String token = obtainAccessToken();

        // Create another user
        User otherUser = new User();
        otherUser.setName("Other User");
        otherUser.setEmail("other@example.com");
        otherUser.setPassword(passwordEncoder.encode("password"));
        otherUser = userRepository.save(otherUser);

        // Create a project belonging to the other user
        Project otherProject = new Project();
        otherProject.setName("Other Project");
        otherProject.setGithubUrl("https://github.com/other/repo.git");
        otherProject.setUser(otherUser);
        otherProject = projectRepository.save(otherProject);

        // Try to analyze code with otherProject.getId() as authenticated user test2@example.com
        Map<String, Object> request = new HashMap<>();
        request.put("language", "java");
        request.put("code", "class A {}");
        request.put("fileName", "A.java");
        request.put("projectId", otherProject.getId());

        mockMvc.perform(post("/analyze")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"))
                .andExpect(jsonPath("$.message").value("You do not have permission to access this project."));
    }

    @Test
    void testShouldIgnoreFile_Logic() throws Exception {
        Method method = AnalyzerService.class.getDeclaredMethod("shouldIgnoreFile", String.class);
        method.setAccessible(true);

        // Ignored directories
        assertTrue((boolean) method.invoke(analyzerService, "node_modules/package.json"));
        assertTrue((boolean) method.invoke(analyzerService, "src/main/.git/config"));
        assertTrue((boolean) method.invoke(analyzerService, "target/classes/Main.class"));
        assertTrue((boolean) method.invoke(analyzerService, "build/libs/app.jar"));
        assertTrue((boolean) method.invoke(analyzerService, "dist/index.html"));
        assertTrue((boolean) method.invoke(analyzerService, "vendor/autoload.php"));
        assertTrue((boolean) method.invoke(analyzerService, "coverage/index.html"));
        assertTrue((boolean) method.invoke(analyzerService, ".idea/workspace.xml"));
        assertTrue((boolean) method.invoke(analyzerService, ".vscode/settings.json"));

        // Ignored extensions
        assertTrue((boolean) method.invoke(analyzerService, "src/Main.lock"));
        assertTrue((boolean) method.invoke(analyzerService, "package-lock.json"));
        assertTrue((boolean) method.invoke(analyzerService, "logo.png"));
        assertTrue((boolean) method.invoke(analyzerService, "docs/report.pdf"));

        // Supported extensions (should NOT ignore)
        assertFalse((boolean) method.invoke(analyzerService, "src/main/java/Main.java"));
        assertFalse((boolean) method.invoke(analyzerService, "src/index.js"));
        assertFalse((boolean) method.invoke(analyzerService, "README.md"));
    }
}