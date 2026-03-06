package com.pos.system.repositories;

import com.pos.system.models.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    Optional<Product> findByBarcode(String barcode);
    
    List<Product> findByCategory(String category);
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.minStockLevel")
    List<Product> findLowStockProducts();
    
    @Query("SELECT p FROM Product p WHERE p.stockQuantity = 0")
    List<Product> findOutOfStockProducts();
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR p.barcode LIKE CONCAT('%', :search, '%')")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE p.isActive = true")
    List<Product> findAllActive();
    
    @Query("SELECT p.category, COUNT(p) FROM Product p GROUP BY p.category")
    List<Object[]> getProductCountByCategory();
    
    Boolean existsByBarcode(String barcode);
}