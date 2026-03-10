package com.pos.system.services;

import com.pos.system.models.Customer;
import com.pos.system.models.PaymentRequest;
import com.pos.system.models.User;
import com.pos.system.repositories.CustomerRepository;
import com.pos.system.repositories.PaymentRequestRepository;
import com.pos.system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    @Transactional
    public PaymentRequest createRequest(Long userId, BigDecimal amount, String method) {
        User cashier = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found for user: " + userId));

        PaymentRequest request = PaymentRequest.builder()
                .customer(customer)
                .cashier(cashier)
                .amount(amount)
                .method(method)
                .status("PENDING")
                .build();

        request = paymentRequestRepository.save(request);
        log.info("Payment request created: {} for customer user: {}", request.getRequestId(), userId);
        return request;
    }

    public List<PaymentRequest> getPendingRequestsByCustomer(Long userId) {
        Optional<Customer> customerOpt = customerRepository.findByUserId(userId);
        if (customerOpt.isEmpty()) {
            log.warn("No customer profile found for userId: {}. Returning empty payment request list.", userId);
            return List.of();
        }
        return paymentRequestRepository.findByCustomerIdAndStatus(customerOpt.get().getId(), "PENDING");
    }

    public List<PaymentRequest> getAllPendingRequests() {
        return paymentRequestRepository.findAll()
                .stream()
                .filter(r -> "PENDING".equals(r.getStatus()))
                .toList();
    }

    public Optional<PaymentRequest> getRequest(String requestId) {
        return paymentRequestRepository.findByRequestId(requestId);
    }
    
    @Transactional
    public PaymentRequest updateStatus(String requestId, String status) {
        PaymentRequest request = paymentRequestRepository.findByRequestId(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));
        
        request.setStatus(status);
        request = paymentRequestRepository.save(request);
        log.info("Payment request {} updated to status {}", requestId, status);
        return request;
    }
}
