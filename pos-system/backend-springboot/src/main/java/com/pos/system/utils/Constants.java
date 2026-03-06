package com.pos.system.utils;

public class Constants {
    
    // Role Constants
    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_CASHIER = "ROLE_CASHIER";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";
    
    // Transaction Status
    public static final String TRANSACTION_COMPLETED = "COMPLETED";
    public static final String TRANSACTION_VOID = "VOID";
    public static final String TRANSACTION_REFUNDED = "REFUNDED";
    public static final String TRANSACTION_PENDING = "PENDING";
    
    // Payment Methods
    public static final String PAYMENT_CASH = "CASH";
    public static final String PAYMENT_CARD = "CARD";
    public static final String PAYMENT_UPI = "UPI";
    
    // Inventory Types
    public static final String INVENTORY_SALE = "SALE";
    public static final String INVENTORY_PURCHASE = "PURCHASE";
    public static final String INVENTORY_ADJUSTMENT = "ADJUSTMENT";
    public static final String INVENTORY_RETURN = "RETURN";
    
    // Customer Tiers
    public static final String TIER_BRONZE = "BRONZE";
    public static final String TIER_SILVER = "SILVER";
    public static final String TIER_GOLD = "GOLD";
    public static final String TIER_PLATINUM = "PLATINUM";
    
    // API Endpoints
    public static final String API_AUTH = "/auth";
    public static final String API_USERS = "/users";
    public static final String API_PRODUCTS = "/products";
    public static final String API_TRANSACTIONS = "/transactions";
    public static final String API_REPORTS = "/reports";
    public static final String API_INVENTORY = "/inventory";
    public static final String API_CUSTOMERS = "/customers";
    
    // Messages
    public static final String MSG_USER_NOT_FOUND = "User not found";
    public static final String MSG_PRODUCT_NOT_FOUND = "Product not found";
    public static final String MSG_TRANSACTION_NOT_FOUND = "Transaction not found";
    public static final String MSG_INSUFFICIENT_STOCK = "Insufficient stock";
    public static final String MSG_INVALID_CREDENTIALS = "Invalid username or password";
    public static final String MSG_USERNAME_EXISTS = "Username already exists";
    public static final String MSG_EMAIL_EXISTS = "Email already exists";
    public static final String MSG_BARCODE_EXISTS = "Barcode already exists";
    
    // Pagination
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
}