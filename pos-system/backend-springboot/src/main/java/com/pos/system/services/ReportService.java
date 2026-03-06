package com.pos.system.services;

import com.pos.system.dto.ReportDTO;
import com.pos.system.models.Product;
import com.pos.system.models.Transaction;
import com.pos.system.repositories.ProductRepository;
import com.pos.system.repositories.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final ProductRepository productRepository;

    public ReportDTO getDailyReport(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionRepository.findByCreatedAtBetween(start, end);

        return generateReport(transactions, start, end);
    }

    public ReportDTO getMonthlyReport(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionRepository.findByCreatedAtBetween(start, end);

        return generateReport(transactions, start, end);
    }

    public ReportDTO getCustomDateRangeReport(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Transaction> transactions = transactionRepository.findByCreatedAtBetween(start, end);

        return generateReport(transactions, start, end);
    }

    public List<ReportDTO.ProductSalesDTO> getTopProducts(LocalDate startDate, LocalDate endDate, int limit) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Object[]> results = transactionRepository.getTopProducts(start, end, PageRequest.of(0, limit));

        return results.stream()
                .map(result -> ReportDTO.ProductSalesDTO.builder()
                        .productName((String) result[0])
                        .quantitySold(((Long) result[1]).intValue())
                        .revenue((BigDecimal) result[2])
                        .build())
                .collect(Collectors.toList());
    }

    public Map<String, Object> getInventoryReport() {
        Map<String, Object> report = new HashMap<>();

        List<Product> lowStock = productRepository.findLowStockProducts();
        List<Product> outOfStock = productRepository.findOutOfStockProducts();

        report.put("totalProducts", productRepository.count());
        report.put("lowStockCount", lowStock.size());
        report.put("outOfStockCount", outOfStock.size());
        report.put("lowStockProducts", lowStock.stream()
                .map(p -> Map.of(
                    "id", p.getId(),
                    "name", p.getName(),
                    "stock", p.getStockQuantity(),
                    "minStock", p.getMinStockLevel()
                ))
                .collect(Collectors.toList()));
        report.put("outOfStockProducts", outOfStock.stream()
                .map(p -> Map.of(
                    "id", p.getId(),
                    "name", p.getName()
                ))
                .collect(Collectors.toList()));

        // Category breakdown
        List<Object[]> categoryCounts = productRepository.getProductCountByCategory();
        report.put("categoryBreakdown", categoryCounts.stream()
                .map(row -> Map.of(
                    "category", row[0],
                    "count", row[1]
                ))
                .collect(Collectors.toList()));

        return report;
    }

    public Map<String, Object> getRevenueTrends(String period) {
        Map<String, Object> trends = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        switch (period.toLowerCase()) {
            case "week":
                trends.put("labels", getLastNDays(7));
                trends.put("data", getDailyRevenueForLastNDays(7));
                break;
            case "month":
                trends.put("labels", getLastNWeeks(4));
                trends.put("data", getWeeklyRevenueForLastNWeeks(4));
                break;
            case "year":
                trends.put("labels", getLastNMonths(12));
                trends.put("data", getMonthlyRevenueForLastNMonths(12));
                break;
            default:
                trends.put("labels", getLastNDays(7));
                trends.put("data", getDailyRevenueForLastNDays(7));
        }

        return trends;
    }

    private ReportDTO generateReport(List<Transaction> transactions, LocalDateTime start, LocalDateTime end) {
        ReportDTO report = new ReportDTO();
        report.setStartDate(start.toLocalDate());
        report.setEndDate(end.toLocalDate());

        // Calculate totals
        BigDecimal totalSales = transactions.stream()
                .map(Transaction::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        report.setTotalSales(totalSales);
        report.setTotalTransactions((long) transactions.size());

        // Average transaction value
        if (!transactions.isEmpty()) {
            report.setAverageTransactionValue(
                totalSales.divide(new BigDecimal(transactions.size()), 2, RoundingMode.HALF_UP)
            );
        } else {
            report.setAverageTransactionValue(BigDecimal.ZERO);
        }

        // Total items sold
        int totalItems = transactions.stream()
                .flatMap(t -> t.getItems().stream())
                .mapToInt(item -> item.getQuantity())
                .sum();
        report.setTotalItemsSold(totalItems);

        // Payment method breakdown
        Map<String, BigDecimal> paymentBreakdown = transactions.stream()
                .collect(Collectors.groupingBy(
                    Transaction::getPaymentMethod,
                    Collectors.mapping(
                        Transaction::getTotal,
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                    )
                ));
        report.setPaymentMethodBreakdown(paymentBreakdown);

        // Top products
        List<Object[]> topProductsData = transactionRepository.getTopProducts(start, end, PageRequest.of(0, 10));
        List<ReportDTO.ProductSalesDTO> topProducts = topProductsData.stream()
                .map(row -> ReportDTO.ProductSalesDTO.builder()
                        .productName((String) row[0])
                        .quantitySold(((Long) row[1]).intValue())
                        .revenue((BigDecimal) row[2])
                        .build())
                .collect(Collectors.toList());
        report.setTopProducts(topProducts);

        // Hourly sales
        Map<Integer, BigDecimal> hourlySales = transactions.stream()
                .collect(Collectors.groupingBy(
                    t -> t.getCreatedAt().getHour(),
                    Collectors.mapping(
                        Transaction::getTotal,
                        Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                    )
                ));
        report.setHourlySales(hourlySales);

        // Category sales
        Map<String, BigDecimal> categorySales = new HashMap<>();
        for (Transaction transaction : transactions) {
            for (var item : transaction.getItems()) {
                String category = item.getProduct().getCategory();
                categorySales.merge(category, item.getSubtotal(), BigDecimal::add);
            }
        }
        report.setCategorySales(categorySales);

        return report;
    }

    private List<String> getLastNDays(int n) {
        List<String> days = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            days.add(now.minusDays(i).format(java.time.format.DateTimeFormatter.ofPattern("EEE")));
        }
        return days;
    }

    private List<BigDecimal> getDailyRevenueForLastNDays(int n) {
        List<BigDecimal> revenue = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            LocalDate date = now.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            
            BigDecimal dailyTotal = transactionRepository.findByCreatedAtBetween(start, end).stream()
                    .map(Transaction::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            revenue.add(dailyTotal);
        }
        return revenue;
    }

    private List<String> getLastNWeeks(int n) {
        List<String> weeks = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i);
            weeks.add("Week " + (n - i));
        }
        return weeks;
    }

    private List<BigDecimal> getWeeklyRevenueForLastNWeeks(int n) {
        List<BigDecimal> revenue = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            LocalDate weekStart = now.minusWeeks(i);
            LocalDate weekEnd = weekStart.plusDays(6);
            
            LocalDateTime start = weekStart.atStartOfDay();
            LocalDateTime end = weekEnd.atTime(LocalTime.MAX);
            
            BigDecimal weeklyTotal = transactionRepository.findByCreatedAtBetween(start, end).stream()
                    .map(Transaction::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            revenue.add(weeklyTotal);
        }
        return revenue;
    }

    private List<String> getLastNMonths(int n) {
        List<String> months = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            LocalDate month = now.minusMonths(i);
            months.add(month.format(java.time.format.DateTimeFormatter.ofPattern("MMM")));
        }
        return months;
    }

    private List<BigDecimal> getMonthlyRevenueForLastNMonths(int n) {
        List<BigDecimal> revenue = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = n - 1; i >= 0; i--) {
            LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            
            LocalDateTime start = monthStart.atStartOfDay();
            LocalDateTime end = monthEnd.atTime(LocalTime.MAX);
            
            BigDecimal monthlyTotal = transactionRepository.findByCreatedAtBetween(start, end).stream()
                    .map(Transaction::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            revenue.add(monthlyTotal);
        }
        return revenue;
    }
}