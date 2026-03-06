package com.pos.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.pos.system.models.Role;
import com.pos.system.models.User;
import com.pos.system.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
public class PosSystemApplication {
    public static void main(String[] args) {
        SpringApplication.run(PosSystemApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String password = passwordEncoder.encode("Bala9677540588#");
            
            // Sync Admin
            userRepository.findByUsername("admin").ifPresentOrElse(
                user -> {
                    user.setPassword(password);
                    user.setRole(Role.ROLE_ADMIN);
                    userRepository.save(user);
                },
                () -> {
                    userRepository.save(User.builder()
                        .username("admin").password(password).name("Admin User")
                        .email("admin@pos.com").role(Role.ROLE_ADMIN).isActive(true).build());
                }
            );

            // Sync Cashier
            userRepository.findByUsername("cashier").ifPresentOrElse(
                user -> {
                    user.setPassword(password);
                    user.setRole(Role.ROLE_CASHIER);
                    userRepository.save(user);
                },
                () -> {
                    userRepository.save(User.builder()
                        .username("cashier").password(password).name("Cashier User")
                        .email("cashier@pos.com").role(Role.ROLE_CASHIER).isActive(true).build());
                }
            );

            // Sync Customer
            userRepository.findByUsername("customer").ifPresentOrElse(
                user -> {
                    user.setPassword(password);
                    user.setRole(Role.ROLE_CUSTOMER);
                    userRepository.save(user);
                },
                () -> {
                    userRepository.save(User.builder()
                        .username("customer").password(password).name("Customer User")
                        .email("customer@pos.com").role(Role.ROLE_CUSTOMER).isActive(true).build());
                }
            );
            
            System.out.println("Demo users synchronized with password: Bala9677540588#");
        };
    }
}