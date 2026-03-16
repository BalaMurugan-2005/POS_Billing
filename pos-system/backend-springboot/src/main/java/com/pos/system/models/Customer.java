package com.pos.system.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(unique = true)
    private String loyaltyNumber;

    @Builder.Default
    private BigDecimal loyaltyPoints = BigDecimal.ZERO;

    private String tier; // Bronze, Silver, Gold, Platinum

    @Column(name = "qr_code")
    private String qrCode;

    @Column(name = "preferred_payment_method")
    private String preferredPaymentMethod;

    @Column(name = "date_of_birth")
    private java.time.LocalDate dateOfBirth;

    @Column(name = "anniversary_date")
    private java.time.LocalDate anniversaryDate;

    @Builder.Default
    @Column(name = "newsletter_subscription", nullable = false)
    private Boolean newsletterSubscription = false;

    @Builder.Default
    @Column(name = "total_purchases")
    private BigDecimal totalPurchases = BigDecimal.ZERO;

    @Column(name = "last_purchase_date")
    private LocalDateTime lastPurchaseDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}