package com.pos.system.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "quantity_change")
    private Integer quantityChange;

    private String type; // SALE, PURCHASE, ADJUSTMENT, RETURN

    private String reason;

    @Column(name = "previous_quantity")
    private Integer previousQuantity;

    @Column(name = "new_quantity")
    private Integer newQuantity;

    @ManyToOne
    @JoinColumn(name = "performed_by")
    private User performedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}