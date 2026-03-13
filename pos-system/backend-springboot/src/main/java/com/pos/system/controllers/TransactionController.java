package com.pos.system.controllers;

import com.pos.system.dto.ApiResponse;
import com.pos.system.dto.TransactionDTO;
import com.pos.system.services.TransactionService;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<TransactionDTO> createTransaction(@Valid @RequestBody TransactionDTO transactionDTO) {
        return ResponseEntity.ok(transactionService.createTransaction(transactionDTO));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<TransactionDTO> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_CUSTOMER')")
    public ResponseEntity<Page<TransactionDTO>> getAllTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        return ResponseEntity.ok(transactionService.getAllTransactions(page, size, sortBy, sortDir));
    }

    @GetMapping("/range")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        return ResponseEntity.ok(transactionService.getTransactionsByDateRange(start, end));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<TransactionDTO> voidTransaction(
            @PathVariable Long id,
            @RequestParam String reason) {
        
        return ResponseEntity.ok(transactionService.voidTransaction(id, reason));
    }

    @PostMapping("/{id}/receipt")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<ApiResponse> sendReceipt(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        transactionService.sendReceipt(id, email);
        return ResponseEntity.ok(new ApiResponse(true, "Receipt sent successfully to " + email));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER', 'ROLE_CUSTOMER')")
    public ResponseEntity<List<TransactionDTO>> getTransactionsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(transactionService.getTransactionsByCustomer(customerId));
    }

    @GetMapping("/stats/today")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<?> getTodayStats() {
        return ResponseEntity.ok(new Object() {
            public final BigDecimal sales = transactionService.getTodaySales();
            public final Long count = transactionService.getTodayTransactionCount();
        });
    }
}