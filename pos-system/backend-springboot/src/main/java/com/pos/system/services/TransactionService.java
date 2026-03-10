package com.pos.system.services;

import com.pos.system.dto.TransactionDTO;
import com.pos.system.dto.TransactionItemDTO;
import com.pos.system.models.*;
import com.pos.system.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final TransactionItemRepository transactionItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final InventoryRepository inventoryRepository;
    private final EmailService emailService;

    @Transactional
    public TransactionDTO createTransaction(TransactionDTO transactionDTO) {
        // Get current cashier
        User cashier = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        // Create transaction
        Transaction transaction = new Transaction();
        transaction.setCashier(cashier);
        transaction.setSubtotal(transactionDTO.getSubtotal());
        transaction.setTax(transactionDTO.getTax());
        transaction.setDiscount(transactionDTO.getDiscount());
        transaction.setTotal(transactionDTO.getTotal());
        transaction.setPaymentMethod(transactionDTO.getPaymentMethod());
        transaction.setPaidAmount(transactionDTO.getPaidAmount());
        transaction.setChange(transactionDTO.getChange());
        transaction.setStatus("COMPLETED");
        
        // Generate unique transaction number: TXN-<timestamp>-<random>
        String transactionNumber = "TXN-" + System.currentTimeMillis() + "-" + 
                (int)(Math.random() * 10000);
        transaction.setTransactionNumber(transactionNumber);

        // Set customer if provided
        if (transactionDTO.getCustomer() != null && transactionDTO.getCustomer().getId() != null) {
            Customer customer = customerRepository.findById(transactionDTO.getCustomer().getId())
                    .orElse(null);
            transaction.setCustomer(customer);
            
            // Update loyalty points
            if (customer != null) {
                BigDecimal points = customer.getLoyaltyPoints().add(
                    transactionDTO.getTotal().multiply(new BigDecimal("0.01")) // 1 point per dollar
                );
                customer.setLoyaltyPoints(points);
                customerRepository.save(customer);
            }
        }

        // Save transaction
        transaction = transactionRepository.save(transaction);

        // Process items and update inventory
        List<TransactionItem> items = new ArrayList<>();
        for (TransactionItemDTO itemDTO : transactionDTO.getItems()) {
            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + itemDTO.getProductId()));

            // Check stock
            if (product.getStockQuantity() < itemDTO.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            // Create transaction item
            TransactionItem item = new TransactionItem();
            item.setTransaction(transaction);
            item.setProduct(product);
            item.setQuantity(itemDTO.getQuantity());
            item.setWeight(itemDTO.getWeight());
            item.setPrice(itemDTO.getPrice());
            item.setSubtotal(itemDTO.getSubtotal());
            item.setTax(itemDTO.getTax());
            items.add(item);

            // Update inventory
            product.setStockQuantity(product.getStockQuantity() - itemDTO.getQuantity());
            productRepository.save(product);

            // Create inventory record
            Inventory inventory = new Inventory();
            inventory.setProduct(product);
            inventory.setQuantityChange(-itemDTO.getQuantity());
            inventory.setType("SALE");
            inventory.setReason("Transaction: " + transaction.getTransactionNumber());
            inventory.setPreviousQuantity(product.getStockQuantity() + itemDTO.getQuantity());
            inventory.setNewQuantity(product.getStockQuantity());
            inventory.setPerformedBy(cashier);
            inventoryRepository.save(inventory);

            // Check for low stock alert
            if (product.getStockQuantity() <= product.getMinStockLevel()) {
                log.warn("Low stock alert for product: {} (Stock: {})", 
                        product.getName(), product.getStockQuantity());
                // TODO: Send notification
            }
        }

        // Save all items
        transactionItemRepository.saveAll(items);
        transaction.setItems(items);

        // Send receipt email if customer has email
        if (transaction.getCustomer() != null && 
            transaction.getCustomer().getUser() != null && 
            transaction.getCustomer().getUser().getEmail() != null) {
            
            emailService.sendReceipt(transaction, transaction.getCustomer().getUser().getEmail());
        }

        log.info("Transaction created: {} by cashier: {}", 
                transaction.getTransactionNumber(), cashier.getUsername());

        return mapToDTO(transaction);
    }

    public TransactionDTO getTransactionById(Long id) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        return mapToDTO(transaction);
    }

    public Page<TransactionDTO> getAllTransactions(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return transactionRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    public List<TransactionDTO> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findByCreatedAtBetween(start, end)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<TransactionDTO> getTransactionsByCustomer(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found for user: " + userId));
        
        return transactionRepository.findByCustomerId(customer.getId())
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionDTO voidTransaction(Long id, String reason) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!"COMPLETED".equals(transaction.getStatus())) {
            throw new RuntimeException("Transaction cannot be voided");
        }

        // Restore inventory
        for (TransactionItem item : transaction.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);

            // Create inventory record
            Inventory inventory = new Inventory();
            inventory.setProduct(product);
            inventory.setQuantityChange(item.getQuantity());
            inventory.setType("RETURN");
            inventory.setReason("Void transaction: " + transaction.getTransactionNumber() + " - " + reason);
            inventory.setPreviousQuantity(product.getStockQuantity() - item.getQuantity());
            inventory.setNewQuantity(product.getStockQuantity());
            inventory.setPerformedBy((User) SecurityContextHolder.getContext().getAuthentication().getPrincipal());
            inventoryRepository.save(inventory);
        }

        // Update transaction status
        transaction.setStatus("VOID");
        transaction.setNotes(reason);
        transaction = transactionRepository.save(transaction);

        log.info("Transaction voided: {}", transaction.getTransactionNumber());

        return mapToDTO(transaction);
    }

    public BigDecimal getTodaySales() {
        return transactionRepository.getTodaySales();
    }

    public Long getTodayTransactionCount() {
        return transactionRepository.getTodayTransactionCount();
    }

    public void sendReceipt(Long id, String email) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));
        emailService.sendReceipt(transaction, email);
    }

    private TransactionDTO mapToDTO(Transaction transaction) {
        List<TransactionItemDTO> itemDTOs = transaction.getItems().stream()
                .map(this::mapItemToDTO)
                .collect(Collectors.toList());

        return TransactionDTO.builder()
                .id(transaction.getId())
                .transactionNumber(transaction.getTransactionNumber())
                .cashier(mapUserToDTO(transaction.getCashier()))
                .customer(transaction.getCustomer() != null ? mapCustomerToDTO(transaction.getCustomer()) : null)
                .items(itemDTOs)
                .subtotal(transaction.getSubtotal())
                .tax(transaction.getTax())
                .discount(transaction.getDiscount())
                .total(transaction.getTotal())
                .paymentMethod(transaction.getPaymentMethod())
                .paidAmount(transaction.getPaidAmount())
                .change(transaction.getChange())
                .status(transaction.getStatus())
                .createdAt(transaction.getCreatedAt())
                .build();
    }

    private TransactionItemDTO mapItemToDTO(TransactionItem item) {
        return TransactionItemDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getName())
                .productBarcode(item.getProduct().getBarcode())
                .quantity(item.getQuantity())
                .weight(item.getWeight())
                .price(item.getPrice())
                .subtotal(item.getSubtotal())
                .tax(item.getTax())
                .build();
    }

    private com.pos.system.dto.UserDTO mapUserToDTO(User user) {
        if (user == null) return null;
        return com.pos.system.dto.UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    private com.pos.system.dto.CustomerDTO mapCustomerToDTO(Customer customer) {
        if (customer == null) return null;
        return com.pos.system.dto.CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getUser() != null ? customer.getUser().getName() : null)
                .email(customer.getUser() != null ? customer.getUser().getEmail() : null)
                .loyaltyNumber(customer.getLoyaltyNumber())
                .loyaltyPoints(customer.getLoyaltyPoints())
                .tier(customer.getTier())
                .build();
    }
}