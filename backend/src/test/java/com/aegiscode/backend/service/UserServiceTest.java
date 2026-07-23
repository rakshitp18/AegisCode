package com.aegiscode.backend.service;

import com.aegiscode.backend.dto.AuthResponse;
import com.aegiscode.backend.dto.LoginRequest;
import com.aegiscode.backend.dto.RegisterRequest;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.repository.UserRepository;
import com.aegiscode.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        testUser.setPassword("hashedPassword");
    }

    @Test
    void register_HappyPath_Succeeds() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password");

        when(repository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashedPassword");
        when(repository.save(any(User.class))).thenReturn(testUser);

        User registered = userService.register(request);

        assertNotNull(registered);
        assertEquals("test@example.com", registered.getEmail());
        assertEquals("Test User", registered.getName());
        verify(repository, times(1)).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail_ThrowsRuntimeException() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password");

        when(repository.existsByEmail(request.getEmail())).thenReturn(true);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.register(request));
        assertEquals("Email already exists", exception.getMessage());
        verify(repository, never()).save(any(User.class));
    }

    @Test
    void login_HappyPath_ReturnsAuthResponse() {
        LoginRequest request = new LoginRequest("test@example.com", "password");

        when(repository.findByEmail(request.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(request.getPassword(), testUser.getPassword())).thenReturn(true);
        when(jwtService.generateToken(testUser.getEmail())).thenReturn("jwtToken");

        AuthResponse authResponse = userService.login(request);

        assertNotNull(authResponse);
        assertEquals("jwtToken", authResponse.getToken());
    }

    @Test
    void login_UserNotFound_ThrowsRuntimeException() {
        LoginRequest request = new LoginRequest("nonexistent@example.com", "password");

        when(repository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.login(request));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void login_InvalidCredentials_ThrowsRuntimeException() {
        LoginRequest request = new LoginRequest("test@example.com", "wrongPassword");

        when(repository.findByEmail(request.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(request.getPassword(), testUser.getPassword())).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.login(request));
        assertEquals("Invalid credentials", exception.getMessage());
    }

    @Test
    void getAllUsers_ReturnsList() {
        when(repository.findAll()).thenReturn(Arrays.asList(testUser));

        List<User> users = userService.getAllUsers();

        assertNotNull(users);
        assertEquals(1, users.size());
        assertEquals("test@example.com", users.get(0).getEmail());
    }
}
