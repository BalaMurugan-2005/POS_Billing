package com.pos.system.services;

import com.pos.system.dto.UserDTO;
import com.pos.system.models.Role;
import com.pos.system.models.User;
import com.pos.system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserDTO> getAllUsers(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return userRepository.findAll(pageable)
                .map(this::mapToDTO);
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    public List<UserDTO> getUsersByRole(String role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<UserDTO> searchUsers(String query) {
        return userRepository.searchUsers(query)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDTO createUser(UserDTO userDTO) {
        // Check if username exists
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email exists
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .username(userDTO.getUsername())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .name(userDTO.getName())
                .email(userDTO.getEmail())
                .phone(userDTO.getPhone())
                .role(Role.valueOf("ROLE_" + userDTO.getRole().toUpperCase()))
                .isActive(userDTO.isActive())
                .build();

        user = userRepository.save(user);
        log.info("User created: {}", user.getUsername());

        return mapToDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if username is being changed and if it already exists
        if (!user.getUsername().equals(userDTO.getUsername()) && 
            userRepository.existsByUsername(userDTO.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(userDTO.getEmail()) && 
            userRepository.existsByEmail(userDTO.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setName(userDTO.getName());
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setRole(Role.valueOf("ROLE_" + userDTO.getRole().toUpperCase()));
        
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }

        user = userRepository.save(user);
        log.info("User updated: {}", user.getUsername());

        return mapToDTO(user);
    }

    @Transactional
    public UserDTO toggleUserStatus(Long id, boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        user = userRepository.save(user);
        
        log.info("User status updated: {} - active: {}", user.getUsername(), active);

        return mapToDTO(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Soft delete
        user.setActive(false);
        userRepository.save(user);
        
        log.info("User deleted (soft): {}", user.getUsername());
    }

    private UserDTO mapToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole().name().replace("ROLE_", "").toLowerCase());
        dto.setActive(user.isActive());
        dto.setLastLogin(user.getLastLogin());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}