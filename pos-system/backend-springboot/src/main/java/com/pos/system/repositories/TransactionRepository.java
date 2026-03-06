package com.pos.system.repositories;

import com.pos.system.models.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    List<Transaction> findByCashierId(Long cashierId);
    
    List<Transaction> findByCustomerId(Long customerId);
    
    List<Transaction> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT SUM(t.total) FROM Transaction t WHERE DATE(t.createdAt) = CURRENT_DATE")
    BigDecimal getTodaySales();
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE DATE(t.createdAt) = CURRENT_DATE")
    Long getTodayTransactionCount();
    
    @Query("SELECT FUNCTION('DATE', t.createdAt), SUM(t.total) FROM Transaction t " +
           "WHERE t.createdAt BETWEEN :start AND :end GROUP BY FUNCTION('DATE', t.createdAt)")
    List<Object[]> getDailySales(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT p.name, SUM(ti.quantity) as totalSold " +
           "FROM Transaction t JOIN t.items ti JOIN ti.product p " +
           "WHERE t.createdAt BETWEEN :start AND :end " +
           "GROUP BY p.id, p.name ORDER BY totalSold DESC")
    List<Object[]> getTopProducts(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, Pageable pageable);
    
    @Query("SELECT t.paymentMethod, COUNT(t), SUM(t.total) FROM Transaction t " +
           "WHERE t.createdAt BETWEEN :start AND :end GROUP BY t.paymentMethod")
    List<Object[]> getPaymentMethodStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}