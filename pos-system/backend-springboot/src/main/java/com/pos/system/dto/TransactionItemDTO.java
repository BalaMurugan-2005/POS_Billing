package com.pos.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionItemDTO {
    
    private Long id;
    private Long productId;
    private String productName;
    private String productBarcode;
    private Integer quantity;
    private BigDecimal weight;
    private BigDecimal price;
    private BigDecimal subtotal;
    private BigDecimal tax;
}