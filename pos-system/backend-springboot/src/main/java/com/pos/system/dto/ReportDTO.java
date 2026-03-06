package com.pos.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    
    private LocalDate startDate;
    private LocalDate endDate;
    
    // Sales Summary
    private BigDecimal totalSales;
    private Long totalTransactions;
    private BigDecimal averageTransactionValue;
    private Integer totalItemsSold;
    
    // Payment Methods
    private Map<String, BigDecimal> paymentMethodBreakdown;
    
    // Top Products
    private List<ProductSalesDTO> topProducts;
    
    // Hourly Sales
    private Map<Integer, BigDecimal> hourlySales;
    
    // Category Sales
    private Map<String, BigDecimal> categorySales;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSalesDTO {
        private Long productId;
        private String productName;
        private Integer quantitySold;
        private BigDecimal revenue;
    }
}