package com.pos.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDTO {
    
    private Long id;
    private String transactionNumber;
    private UserDTO cashier;
    private CustomerDTO customer;
    private List<TransactionItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal discount;
    private BigDecimal total;
    private String paymentMethod;
    private BigDecimal paidAmount;
    private BigDecimal change;
    private String status;
    private LocalDateTime createdAt;
}