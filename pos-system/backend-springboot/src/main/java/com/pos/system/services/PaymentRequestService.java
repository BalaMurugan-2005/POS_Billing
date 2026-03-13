package com.pos.system.services;

import com.pos.system.models.Customer;
import com.pos.system.models.PaymentRequest;
import com.pos.system.models.User;
import com.pos.system.repositories.CustomerRepository;
import com.pos.system.repositories.PaymentRequestRepository;
import com.pos.system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    
    @Value("${DJANGO_API_URL:http://localhost:8000}")
    private String djangoApiUrl;

    @Transactional
    public PaymentRequest createRequest(Long userId, BigDecimal amount, String method) {
        User cashier = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        // Try to find customer locally first
        var customerOpt = customerRepository.findByUserId(userId);
        Customer customer = null;
        
        if (customerOpt.isPresent()) {
            customer = customerOpt.get();
        } else {
            // If not found locally, try to fetch from Django and create a local record
            log.info("Customer not found locally for userId: {}, attempting to fetch from Django", userId);
            try {
                RestTemplate restTemplate = new RestTemplate();
                String djangoUrl = djangoApiUrl + "/api/customers/user/" + userId + "/";
                ResponseEntity<Map> response = restTemplate.getForEntity(djangoUrl, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> body = response.getBody();
                    // Create a new customer record with data from Django
                    customer = Customer.builder()
                            .loyaltyNumber((String) body.get("loyalty_number"))
                            .tier((String) body.get("tier"))
                            .loyaltyPoints(new BigDecimal(body.get("loyalty_points").toString()))
                            .build();
                    
                    // Create a User reference with the Django user ID
                    User userRef = new User();
                    userRef.setId(userId);
                    customer.setUser(userRef);
                    
                    // Save the new customer locally
                    customer = customerRepository.save(customer);
                    log.info("Created local customer record from Django data for userId: {}", userId);
                }
            } catch (Exception e) {
                log.warn("Failed to fetch customer from Django for userId {}: {}", userId, e.getMessage());
                // Fallback: create a basic customer profile so the PaymentRequest isn't orphaned
                User existingUser = userRepository.findById(userId).orElse(null);
                if (existingUser != null) {
                    log.info("Creating a basic fallback customer profile for existing user ID: {}", userId);
                    customer = Customer.builder()
                            .user(existingUser)
                            .tier("bronze")
                            .loyaltyPoints(BigDecimal.ZERO)
                            .build();
                    customer = customerRepository.save(customer);
                } else {
                    log.warn("Cannot create fallback customer profile: User ID {} does not exist in DB", userId);
                }
            }
        }
        
        // Generate requestId here with full UUID to guarantee uniqueness even under concurrency
        String requestId = "PAY-" + java.util.UUID.randomUUID().toString().toUpperCase().replace("-", "");
        
        PaymentRequest request = PaymentRequest.builder()
                .requestId(requestId)
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
