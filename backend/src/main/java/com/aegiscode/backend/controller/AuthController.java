package com.aegiscode.backend.controller;

import com.aegiscode.backend.dto.RegisterRequest;
import com.aegiscode.backend.entity.User;
import com.aegiscode.backend.service.UserService;
import org.springframework.web.bind.annotation.*;
import com.aegiscode.backend.dto.LoginRequest;
import com.aegiscode.backend.dto.AuthResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public User register(@jakarta.validation.Valid @RequestBody RegisterRequest request) {
        return service.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@jakarta.validation.Valid @RequestBody LoginRequest request) {
        return service.login(request);
    }
}