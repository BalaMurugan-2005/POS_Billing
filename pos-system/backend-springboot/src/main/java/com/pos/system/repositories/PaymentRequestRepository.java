package com.pos.system.repositories;

import com.pos.system.models.PaymentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, Long> {

    List<PaymentRequest> findByCustomerId(Long customerId);
    
    Optional<PaymentRequest> findByRequestId(String requestId);
    
    List<PaymentRequest> findByCustomerIdAndStatus(Long customerId, String status);
}
