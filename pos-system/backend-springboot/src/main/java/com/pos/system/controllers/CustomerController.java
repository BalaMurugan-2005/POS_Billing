package com.pos.system.controllers;

import com.pos.system.dto.ApiResponse;
import com.pos.system.dto.CustomerDTO;
import com.pos.system.services.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<Page<CustomerDTO>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        return ResponseEntity.ok(customerService.getAllCustomers(page, size, sortBy, sortDir));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<CustomerDTO> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/loyalty/{loyaltyNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<CustomerDTO> getCustomerByLoyaltyNumber(@PathVariable String loyaltyNumber) {
        return ResponseEntity.ok(customerService.getCustomerByLoyaltyNumber(loyaltyNumber));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'CUSTOMER')")
    public ResponseEntity<CustomerDTO> getCustomerByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(customerService.getCustomerByUserId(userId));
    }

    @GetMapping("/tier/{tier}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerDTO>> getCustomersByTier(@PathVariable String tier) {
        return ResponseEntity.ok(customerService.getCustomersByTier(tier));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<CustomerDTO> createCustomer(@Valid @RequestBody CustomerDTO customerDTO) {
        return ResponseEntity.ok(customerService.createCustomer(customerDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<CustomerDTO> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody CustomerDTO customerDTO) {
        
        return ResponseEntity.ok(customerService.updateCustomer(id, customerDTO));
    }

    @PostMapping("/{id}/points")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<CustomerDTO> addLoyaltyPoints(
            @PathVariable Long id,
            @RequestParam Integer points) {
        
        return ResponseEntity.ok(customerService.addLoyaltyPoints(id, points));
    }

    @GetMapping("/{id}/qr")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'CUSTOMER')")
    public ResponseEntity<String> generateQRCode(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.generateQRCode(id));
    }
}