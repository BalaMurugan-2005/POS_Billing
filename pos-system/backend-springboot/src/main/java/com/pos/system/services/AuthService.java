package com.pos.system.services;

import com.pos.system.dto.*;
import com.pos.system.models.Customer;
import com.pos.system.models.Role;
import com.pos.system.models.User;
import com.pos.system.repositories.CustomerRepository;
import com.pos.system.repositories.UserRepository;
import com.pos.system.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        log.info("Login attempt for username: {}", loginRequest.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = (User) authentication.getPrincipal();
        log.info("Login successful for user: {}, role: {}", user.getUsername(), user.getRole());
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String loyaltyNumber = null;
        if (user.getRole() == Role.ROLE_CUSTOMER) {
            loyaltyNumber = customerRepository.findByUserId(user.getId())
                    .map(Customer::getLoyaltyNumber)
                    .orElse(null);
        }

        String accessToken = jwtUtil.generateToken(user);

        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name().replace("ROLE_", "").toLowerCase())
                .isActive(user.isActive())
                .loyaltyNumber(loyaltyNumber)
                .build();

        return LoginResponse.builder()
                .token(accessToken)
                .user(userDTO)
                .build();
    }

    @Transactional
    public ApiResponse register(RegisterRequest registerRequest) {
        // Check if username exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            return new ApiResponse(false, "Username already exists");
        }

        // Check if email exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return new ApiResponse(false, "Email already exists");
        }

        // Create new user
        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .phone(registerRequest.getPhone())
                .role(Role.valueOf("ROLE_" + registerRequest.getRole().toUpperCase()))
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // If customer, create profile
        if (user.getRole() == Role.ROLE_CUSTOMER) {
            String loyaltyNumber = "LOY" + System.currentTimeMillis();
            Customer customer = Customer.builder()
                    .user(user)
                    .loyaltyNumber(loyaltyNumber)
                    .tier("BRONZE")
                    .loyaltyPoints(java.math.BigDecimal.ZERO)
                    .build();
            customerRepository.save(customer);
        }

        log.info("New user registered: {}", user.getUsername());

        return new ApiResponse(true, "User registered successfully");
    }

    public LoginResponse refreshToken(String refreshToken) {
        if (jwtUtil.validateToken(refreshToken)) {
            String username = jwtUtil.getUsernameFromToken(refreshToken);
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String newAccessToken = jwtUtil.generateToken(user);

            UserDTO userDTO = UserDTO.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().name().replace("ROLE_", "").toLowerCase())
                    .isActive(user.isActive())
                    .build();

            return LoginResponse.builder()
                    .token(newAccessToken)
                    .user(userDTO)
                    .build();
        } else {
            throw new RuntimeException("Invalid refresh token");
        }
    }

    public UserDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name().replace("ROLE_", "").toLowerCase())
                .isActive(user.isActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private List<String> getPermissionsForRole(Role role) {
        List<String> permissions = new ArrayList<>();
        
        switch (role) {
            case ROLE_ADMIN:
                permissions.addAll(List.of(
                    "VIEW_DASHBOARD", "MANAGE_USERS", "MANAGE_PRODUCTS", 
                    "MANAGE_INVENTORY", "VIEW_REPORTS", "PROCESS_TRANSACTIONS",
                    "VOID_TRANSACTIONS", "MANAGE_SETTINGS"
                ));
                break;
                
            case ROLE_CASHIER:
                permissions.addAll(List.of(
                    "VIEW_DASHBOARD", "PROCESS_TRANSACTIONS", "VIEW_PRODUCTS",
                    "VIEW_INVENTORY", "VOID_TRANSACTIONS"
                ));
                break;
                
            case ROLE_CUSTOMER:
                permissions.addAll(List.of(
                    "VIEW_OWN_TRANSACTIONS", "VIEW_OWN_PROFILE"
                ));
                break;
        }
        
        return permissions;
    }
}