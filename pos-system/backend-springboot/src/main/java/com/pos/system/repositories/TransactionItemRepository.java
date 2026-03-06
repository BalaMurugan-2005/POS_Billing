package com.pos.system.repositories;

import com.pos.system.models.TransactionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionItemRepository extends JpaRepository<TransactionItem, Long> {
    
    List<TransactionItem> findByTransactionId(Long transactionId);
    
    List<TransactionItem> findByProductId(Long productId);
}