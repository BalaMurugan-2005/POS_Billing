package com.pos.system.services;

import com.pos.system.models.User;
import com.pos.system.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username).orElseGet(() -> {
            // Fallback: If it's pure numbers, it might be a Django user_id claim
            if (username.matches("\\d+")) {
                return userRepository.findById(Long.parseLong(username))
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with username or id: " + username));
            }
            throw new UsernameNotFoundException("User not found with username: " + username);
        });
    }

    @Transactional
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return user;
    }
}