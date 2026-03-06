package com.pos.system.services;

import com.pos.system.dto.ProductDTO;
import com.pos.system.models.Product;
import com.pos.system.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    @Cacheable(value = "products", key = "#id")
    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapToDTO(product);
    }

    @Cacheable(value = "products", key = "#barcode")
    public ProductDTO getProductByBarcode(String barcode) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("Product not found with barcode: " + barcode));
        return mapToDTO(product);
    }

    public Page<ProductDTO> getAllProducts(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return productRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    public Page<ProductDTO> searchProducts(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return productRepository.searchProducts(query, pageable)
                .map(this::mapToDTO);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO createProduct(ProductDTO productDTO) {
        // Check if barcode already exists
        if (productRepository.existsByBarcode(productDTO.getBarcode())) {
            throw new RuntimeException("Product with barcode " + productDTO.getBarcode() + " already exists");
        }

        Product product = mapToEntity(productDTO);
        product = productRepository.save(product);
        
        log.info("Product created: {}", product.getName());
        return mapToDTO(product);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if barcode is being changed and if it already exists
        if (!product.getBarcode().equals(productDTO.getBarcode()) && 
            productRepository.existsByBarcode(productDTO.getBarcode())) {
            throw new RuntimeException("Product with barcode " + productDTO.getBarcode() + " already exists");
        }

        updateProductFields(product, productDTO);
        product = productRepository.save(product);
        
        log.info("Product updated: {}", product.getName());
        return mapToDTO(product);
    }

    @Transactional
    @CacheEvict(value = "products", allEntries = true)
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        // Soft delete
        product.setIsActive(false);
        productRepository.save(product);
        
        log.info("Product deleted (soft): {}", product.getName());
    }

    public List<ProductDTO> getLowStockProducts() {
        return productRepository.findLowStockProducts()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ProductDTO> getOutOfStockProducts() {
        return productRepository.findOutOfStockProducts()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "products", key = "#id")
    public ProductDTO updateStock(Long id, Integer quantity, String type) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        int newQuantity;
        switch (type) {
            case "ADD":
                newQuantity = product.getStockQuantity() + quantity;
                break;
            case "REMOVE":
                newQuantity = product.getStockQuantity() - quantity;
                if (newQuantity < 0) {
                    throw new RuntimeException("Insufficient stock");
                }
                break;
            case "SET":
                newQuantity = quantity;
                break;
            default:
                throw new RuntimeException("Invalid stock update type");
        }

        product.setStockQuantity(newQuantity);
        product = productRepository.save(product);
        
        log.info("Stock updated for product {}: {} -> {}", product.getName(), 
                 product.getStockQuantity(), newQuantity);
        
        return mapToDTO(product);
    }

    private ProductDTO mapToDTO(Product product) {
        return ProductDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .barcode(product.getBarcode())
                .description(product.getDescription())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .taxRate(product.getTaxRate())
                .stockQuantity(product.getStockQuantity())
                .minStockLevel(product.getMinStockLevel())
                .maxStockLevel(product.getMaxStockLevel())
                .category(product.getCategory())
                .brand(product.getBrand())
                .unit(product.getUnit())
                .isWeighted(product.getIsWeighted())
                .pricePerKg(product.getPricePerKg())
                .imageUrl(product.getImageUrl())
                .isActive(product.getIsActive())
                .build();
    }

    private Product mapToEntity(ProductDTO dto) {
        return Product.builder()
                .name(dto.getName())
                .barcode(dto.getBarcode())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .costPrice(dto.getCostPrice())
                .taxRate(dto.getTaxRate())
                .stockQuantity(dto.getStockQuantity())
                .minStockLevel(dto.getMinStockLevel())
                .maxStockLevel(dto.getMaxStockLevel())
                .category(dto.getCategory())
                .brand(dto.getBrand())
                .unit(dto.getUnit())
                .isWeighted(dto.getIsWeighted())
                .pricePerKg(dto.getPricePerKg())
                .imageUrl(dto.getImageUrl())
                .isActive(dto.getIsActive())
                .build();
    }

    private void updateProductFields(Product product, ProductDTO dto) {
        product.setName(dto.getName());
        product.setBarcode(dto.getBarcode());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        product.setCostPrice(dto.getCostPrice());
        product.setTaxRate(dto.getTaxRate());
        product.setMinStockLevel(dto.getMinStockLevel());
        product.setMaxStockLevel(dto.getMaxStockLevel());
        product.setCategory(dto.getCategory());
        product.setBrand(dto.getBrand());
        product.setUnit(dto.getUnit());
        product.setIsWeighted(dto.getIsWeighted());
        product.setPricePerKg(dto.getPricePerKg());
        product.setImageUrl(dto.getImageUrl());
    }
}