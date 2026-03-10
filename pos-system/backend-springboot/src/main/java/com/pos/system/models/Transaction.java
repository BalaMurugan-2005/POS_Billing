package com.pos.system.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = true)
    private String transactionNumber;

    @ManyToOne
    @JoinColumn(name = "cashier_id")
    private User cashier;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Builder.Default
    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<TransactionItem> items = new ArrayList<>();

    private BigDecimal subtotal;

    private BigDecimal tax;

    private BigDecimal discount;

    private BigDecimal total;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount;

    @Column(name = "amount_change")
    private BigDecimal change;

    private String status; // COMPLETED, VOID, REFUNDED

    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (transactionNumber == null) {
            transactionNumber = generateTransactionNumber();
        }
    }

    private String generateTransactionNumber() {
        return "TXN" + System.currentTimeMillis();
    }
}