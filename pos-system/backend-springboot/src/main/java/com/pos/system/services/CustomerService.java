package com.pos.system.services;

import com.pos.system.dto.CustomerDTO;
import com.pos.system.models.Customer;
import com.pos.system.models.User;
import com.pos.system.repositories.CustomerRepository;
import com.pos.system.repositories.UserRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public Page<CustomerDTO> getAllCustomers(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return customerRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        return mapToDTO(customer);
    }

    @org.springframework.beans.factory.annotation.Value("${DJANGO_URL:http://localhost:8000}")
    private String djangoBaseUrl;

    public CustomerDTO getCustomerByLoyaltyNumber(String loyaltyNumber) {
        log.info("Fetching customer from Django service for loyalty: {}", loyaltyNumber);
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String djangoUrl = djangoBaseUrl + "/api/customers/loyalty/" + loyaltyNumber + "/";
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.getForEntity(djangoUrl, java.util.Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.Map<String, Object> body = response.getBody();
                CustomerDTO dto = new CustomerDTO();
                dto.setId(Long.valueOf(body.get("id").toString()));
                // Retrieve User dict
                java.util.Map<String, Object> userDict = (java.util.Map<String, Object>) body.get("user");
                if (userDict != null) {
                    dto.setEmail((String) userDict.get("email"));
                    dto.setName(userDict.get("first_name") + " " + userDict.get("last_name"));
                }
                dto.setLoyaltyNumber((String) body.get("loyalty_number"));
                dto.setTier((String) body.get("tier"));
                return dto;
            }
        } catch (Exception e) {
            log.error("Failed to fetch customer from Django: {}", e.getMessage());
        }
        
        // Fallback to local
        Customer customer = customerRepository.findByLoyaltyNumber(loyaltyNumber)
                .orElseThrow(() -> new RuntimeException("Customer not found with loyalty number: " + loyaltyNumber));
        return mapToDTO(customer);
    }

    public CustomerDTO getCustomerByUserId(Long userId) {
        Customer customer = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Customer not found for user: " + userId));
        return mapToDTO(customer);
    }

    public List<CustomerDTO> getCustomersByTier(String tier) {
        return customerRepository.findByTier(tier)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerDTO customerDTO) {
        User user = userRepository.findById(customerDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Customer customer = Customer.builder()
                .user(user)
                .loyaltyNumber(generateLoyaltyNumber())
                .loyaltyPoints(BigDecimal.ZERO)
                .tier("BRONZE")
                .preferredPaymentMethod(customerDTO.getPreferredPaymentMethod())
                .build();

        customer = customerRepository.save(customer);
        
        // Generate QR code
        String qrCode = generateQRCode(customer.getId());
        customer.setQrCode(qrCode);
        customer = customerRepository.save(customer);

        log.info("Customer created: {} with loyalty number: {}", 
                 user.getName(), customer.getLoyaltyNumber());

        return mapToDTO(customer);
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO customerDTO) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        customer.setTier(customerDTO.getTier());
        customer.setPreferredPaymentMethod(customerDTO.getPreferredPaymentMethod());

        customer = customerRepository.save(customer);
        log.info("Customer updated: {}", customer.getLoyaltyNumber());

        return mapToDTO(customer);
    }

    @Transactional
    public CustomerDTO addLoyaltyPoints(Long id, Integer points) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        BigDecimal newPoints = customer.getLoyaltyPoints().add(new BigDecimal(points));
        customer.setLoyaltyPoints(newPoints);

        // Update tier based on points
        updateTier(customer);

        customer = customerRepository.save(customer);
        log.info("Added {} loyalty points to customer: {}", points, customer.getLoyaltyNumber());

        return mapToDTO(customer);
    }

    public String generateQRCode(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        String customerData = String.format("{\"id\":%d,\"name\":\"%s\",\"loyaltyNumber\":\"%s\"}",
                customer.getId(),
                customer.getUser().getName(),
                customer.getLoyaltyNumber());

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(customerData, BarcodeFormat.QR_CODE, 200, 200);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();

            return Base64.getEncoder().encodeToString(pngData);
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code: {}", e.getMessage());
            return null;
        }
    }

    private String generateLoyaltyNumber() {
        return "LOY" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }

    private void updateTier(Customer customer) {
        int points = customer.getLoyaltyPoints().intValue();
        
        if (points >= 1000) {
            customer.setTier("PLATINUM");
        } else if (points >= 500) {
            customer.setTier("GOLD");
        } else if (points >= 100) {
            customer.setTier("SILVER");
        } else {
            customer.setTier("BRONZE");
        }
    }

    private CustomerDTO mapToDTO(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.setId(customer.getId());
        dto.setUserId(customer.getUser().getId());
        dto.setName(customer.getUser().getName());
        dto.setEmail(customer.getUser().getEmail());
        dto.setPhone(customer.getUser().getPhone());
        dto.setLoyaltyNumber(customer.getLoyaltyNumber());
        dto.setLoyaltyPoints(customer.getLoyaltyPoints());
        dto.setTier(customer.getTier());
        dto.setQrCode(customer.getQrCode());
        dto.setCreatedAt(customer.getCreatedAt());
        return dto;
    }
}