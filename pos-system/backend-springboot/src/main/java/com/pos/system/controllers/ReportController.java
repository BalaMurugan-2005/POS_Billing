package com.pos.system.controllers;

import com.pos.system.dto.ReportDTO;
import com.pos.system.services.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ReportDTO> getDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        return ResponseEntity.ok(reportService.getDailyReport(date));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ReportDTO> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        
        return ResponseEntity.ok(reportService.getMonthlyReport(year, month));
    }

    @GetMapping("/range")
    public ResponseEntity<ReportDTO> getCustomDateRangeReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        
        return ResponseEntity.ok(reportService.getCustomDateRangeReport(start, end));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<ReportDTO.ProductSalesDTO>> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(defaultValue = "10") int limit) {
        
        return ResponseEntity.ok(reportService.getTopProducts(start, end, limit));
    }

    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> getInventoryReport() {
        return ResponseEntity.ok(reportService.getInventoryReport());
    }

    @GetMapping("/revenue-trends")
    public ResponseEntity<Map<String, Object>> getRevenueTrends(
            @RequestParam(defaultValue = "week") String period) {
        
        return ResponseEntity.ok(reportService.getRevenueTrends(period));
    }
}