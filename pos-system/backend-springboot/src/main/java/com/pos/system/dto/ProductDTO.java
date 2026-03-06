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
public class ProductDTO {
    
    private Long id;
    private String name;
    private String barcode;
    private String description;
    private BigDecimal price;
    private BigDecimal costPrice;
    private BigDecimal taxRate;
    private Integer stockQuantity;
    private Integer minStockLevel;
    private Integer maxStockLevel;
    private String category;
    private String brand;
    private String unit;
    private Boolean isWeighted;
    private BigDecimal pricePerKg;
    private String imageUrl;
    private Boolean isActive;
}