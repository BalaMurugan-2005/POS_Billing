package com.pos.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private Long id;
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private String role;
    private boolean isActive;
    private String loyaltyNumber;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
}