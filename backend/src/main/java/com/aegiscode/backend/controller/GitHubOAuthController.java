package com.aegiscode.backend.controller;

import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.UserRepository;
import com.aegiscode.backend.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/github")
public class GitHubOAuthController {

    private static final Logger log = LoggerFactory.getLogger(GitHubOAuthController.class);

    @Value("${github.client.id:}")
    private String clientId;

    @Value("${github.client.secret:}")
    private String clientSecret;

    @Value("${github.redirect.uri:http://localhost:5173/auth/github/callback}")
    private String redirectUri;

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;

    public GitHubOAuthController(UserRepository userRepository, JwtService jwtService, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = new RestTemplate();
    }

    @GetMapping("/login-url")
    public ResponseEntity<Map<String, String>> getGitHubLoginUrl() {
        Map<String, String> response = new HashMap<>();
        if (clientId == null || clientId.isBlank()) {
            response.put("enabled", "false");
            response.put("message", "GitHub OAuth Client ID is not configured.");
            return ResponseEntity.ok(response);
        }

        String sanitizedRedirectUri = redirectUri != null ? redirectUri.trim().replaceAll("(?<!:)/{2,}", "/") : "";
        String encodedRedirect = URLEncoder.encode(sanitizedRedirectUri, StandardCharsets.UTF_8);
        String url = String.format(
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo%%20user",
                clientId.trim(), encodedRedirect
        );

        response.put("enabled", "true");
        response.put("url", url);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleGitHubCallback(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String code = body != null ? body.get("code") : null;

        if (code == null || code.isBlank()) {
            response.put("success", false);
            response.put("message", "Authorization code is missing.");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Step 1: Exchange code for access token
            String tokenUrl = "https://github.com/login/oauth/access_token";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            headers.set("User-Agent", "AegisCode-App");

            Map<String, String> tokenRequest = new HashMap<>();
            tokenRequest.put("client_id", clientId);
            tokenRequest.put("client_secret", clientSecret);
            tokenRequest.put("code", code);
            tokenRequest.put("redirect_uri", redirectUri);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(tokenRequest, headers);
            ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(tokenUrl, entity, Map.class);

            Map<String, Object> tokenResponseBody = tokenResponse.getBody();
            if (tokenResponseBody == null || !tokenResponseBody.containsKey("access_token")) {
                log.error("[GitHub OAuth] Token exchange failed. Response body: {}", tokenResponseBody);
                String ghErr = tokenResponseBody != null && tokenResponseBody.containsKey("error_description")
                        ? (String) tokenResponseBody.get("error_description")
                        : (tokenResponseBody != null && tokenResponseBody.containsKey("error")
                        ? (String) tokenResponseBody.get("error")
                        : "Failed to retrieve access token from GitHub. Code may have expired.");

                response.put("success", false);
                response.put("message", ghErr);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            String accessToken = (String) tokenResponseBody.get("access_token");

            // Step 2: Fetch user details from GitHub API
            HttpHeaders userHeaders = new HttpHeaders();
            userHeaders.set("Authorization", "token " + accessToken);
            userHeaders.set("Accept", "application/vnd.github.v3+json");
            userHeaders.set("User-Agent", "AegisCode-App");
            HttpEntity<Void> userEntity = new HttpEntity<>(userHeaders);

            ResponseEntity<Map> userResponse = restTemplate.exchange(
                    "https://api.github.com/user", HttpMethod.GET, userEntity, Map.class);

            Map<String, Object> githubProfile = userResponse.getBody();
            String githubUsername = (githubProfile != null && githubProfile.containsKey("login"))
                    ? (String) githubProfile.get("login")
                    : "GitHub User";
            String githubEmail = (githubProfile != null && githubProfile.get("email") != null)
                    ? (String) githubProfile.get("email")
                    : null;

            // If primary email is null in profile, fetch from /user/emails endpoint
            if (githubEmail == null || githubEmail.isBlank()) {
                try {
                    ResponseEntity<List> emailsResponse = restTemplate.exchange(
                            "https://api.github.com/user/emails", HttpMethod.GET, userEntity, List.class);
                    if (emailsResponse.getBody() != null) {
                        for (Object item : emailsResponse.getBody()) {
                            if (item instanceof Map) {
                                Map<?, ?> emailMap = (Map<?, ?>) item;
                                Boolean primary = (Boolean) emailMap.get("primary");
                                if (Boolean.TRUE.equals(primary)) {
                                    githubEmail = (String) emailMap.get("email");
                                    break;
                                }
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("[GitHub OAuth] Unable to fetch user email list: {}", ex.getMessage());
                }
            }

            // Fallback synthetic email if still not provided by GitHub
            if (githubEmail == null || githubEmail.isBlank()) {
                githubEmail = githubUsername.toLowerCase() + "@users.noreply.github.com";
            }

            // Step 3: Connect or Sign In User
            User user;
            if (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser")) {
                // Connecting GitHub to existing logged-in account
                String currentUserEmail = authentication.getName();
                user = userRepository.findByEmail(currentUserEmail)
                        .orElseThrow(() -> new RuntimeException("Authenticated user not found."));
                user.setGithubAccessToken(accessToken);
                userRepository.save(user);
                log.info("[GitHub OAuth] Connected GitHub account @{} for logged-in user {}", githubUsername, currentUserEmail);
            } else {
                // Signing in via GitHub OAuth (unauthenticated user)
                final String targetEmail = githubEmail;
                user = userRepository.findByEmail(targetEmail).orElseGet(() -> {
                    User newUser = new User();
                    newUser.setName(githubUsername);
                    newUser.setEmail(targetEmail);
                    newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    return newUser;
                });
                user.setGithubAccessToken(accessToken);
                userRepository.save(user);

                String jwtToken = jwtService.generateToken(user.getEmail());
                response.put("token", jwtToken);
                response.put("user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail()
                ));
                log.info("[GitHub OAuth] User {} signed in successfully via GitHub OAuth.", user.getEmail());
            }

            response.put("success", true);
            response.put("connected", true);
            response.put("githubUsername", githubUsername);
            return ResponseEntity.ok(response);

        } catch (HttpStatusCodeException ex) {
            log.error("[GitHub OAuth] GitHub API HTTP Error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            String bodyStr = ex.getResponseBodyAsString();
            String ghMsg = "GitHub API authorization failed (" + ex.getStatusCode().value() + ").";
            if (bodyStr.contains("Bad credentials")) {
                ghMsg = "Bad credentials or expired authorization code. Please try signing in again.";
            } else if (!bodyStr.isBlank()) {
                ghMsg = "GitHub API Error: " + bodyStr;
            }
            response.put("success", false);
            response.put("message", ghMsg);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);

        } catch (Exception e) {
            log.error("[GitHub OAuth] Unexpected callback processing failure: ", e);
            response.put("success", false);
            response.put("message", "OAuth authorization failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getGitHubConnectionStatus(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication == null || authentication.getName() == null) {
            response.put("connected", false);
            return ResponseEntity.ok(response);
        }

        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        boolean isConnected = user != null && user.getGithubAccessToken() != null && !user.getGithubAccessToken().isBlank();

        response.put("connected", isConnected);
        if (isConnected && user != null) {
            response.put("githubUsername", user.getName());
        }
        return ResponseEntity.ok(response);
    }
}
