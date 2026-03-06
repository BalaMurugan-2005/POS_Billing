package com.pos.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String loyaltyNumber;
    private BigDecimal loyaltyPoints;
    private String tier;
    private String qrCode;
    private String preferredPaymentMethod;
    private LocalDateTime createdAt;
}