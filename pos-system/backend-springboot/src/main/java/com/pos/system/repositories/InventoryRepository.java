package com.pos.system.repositories;

import com.pos.system.models.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    
    List<Inventory> findByProductId(Long productId);
    
    List<Inventory> findByType(String type);
    
    List<Inventory> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT i.product.id, SUM(i.quantityChange) FROM Inventory i " +
           "WHERE i.createdAt BETWEEN :start AND :end GROUP BY i.product.id")
    List<Object[]> getInventoryMovement(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT i.type, COUNT(i) FROM Inventory i GROUP BY i.type")
    List<Object[]> getInventoryStatsByType();
}