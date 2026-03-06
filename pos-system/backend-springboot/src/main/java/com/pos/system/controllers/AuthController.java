package com.pos.system.controllers;

import com.pos.system.dto.ApiResponse;
import com.pos.system.dto.LoginRequest;
import com.pos.system.dto.LoginResponse;
import com.pos.system.dto.RegisterRequest;
import com.pos.system.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        ApiResponse response = authService.register(registerRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestHeader("Authorization") String token) {
        String refreshToken = token.substring(7);
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser());
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout() {
        // In JWT, logout is handled client-side by removing the token
        return ResponseEntity.ok(new ApiResponse(true, "Logged out successfully"));
    }
}