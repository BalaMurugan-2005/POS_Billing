package com.pos.system.repositories;

import com.pos.system.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    
    Optional<Customer> findByLoyaltyNumber(String loyaltyNumber);
    
    Optional<Customer> findByUserId(Long userId);
    
    @Query("SELECT c FROM Customer c WHERE c.tier = :tier")
    List<Customer> findByTier(@Param("tier") String tier);
    
    @Query("SELECT c FROM Customer c ORDER BY c.loyaltyPoints DESC")
    List<Customer> findTopCustomers(Pageable pageable);
    
    @Query("SELECT COUNT(c) FROM Customer c WHERE c.tier = :tier")
    long countByTier(@Param("tier") String tier);
}