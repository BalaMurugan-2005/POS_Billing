package com.pos.system.controllers;

import com.pos.system.models.PaymentRequest;
import com.pos.system.services.PaymentRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment-requests")
@RequiredArgsConstructor
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<PaymentRequest> createRequest(@RequestBody Map<String, Object> payload) {
        Long customerId = Long.valueOf(payload.get("customerId").toString());
        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        String method = payload.get("method").toString();
        
        return ResponseEntity.ok(paymentRequestService.createRequest(customerId, amount, method));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_CASHIER')")
    public ResponseEntity<List<PaymentRequest>> getAllPaymentRequests() {
        return ResponseEntity.ok(paymentRequestService.getAllPendingRequests());
    }

    @GetMapping("/active/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'CUSTOMER')")
    public ResponseEntity<List<PaymentRequest>> getActiveRequests(@PathVariable Long customerId) {
        return ResponseEntity.ok(paymentRequestService.getPendingRequestsByCustomer(customerId));
    }

    @GetMapping("/{requestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'CUSTOMER')")
    public ResponseEntity<PaymentRequest> getRequest(@PathVariable String requestId) {
        return ResponseEntity.ok(paymentRequestService.getRequest(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found")));
    }

    @PostMapping("/{requestId}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'CUSTOMER')")
    public ResponseEntity<PaymentRequest> updateStatus(
            @PathVariable String requestId,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        return ResponseEntity.ok(paymentRequestService.updateStatus(requestId, status));
    }
}
