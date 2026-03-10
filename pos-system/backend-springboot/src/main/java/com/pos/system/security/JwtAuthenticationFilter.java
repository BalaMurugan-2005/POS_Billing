package com.pos.system.security;

import com.pos.system.services.CustomUserDetailsService;
import com.pos.system.utils.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${DJANGO_API_URL:http://localhost:8000}")
    private String djangoApiUrl;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = parseJwt(request);
            
            if (jwt != null) {
                log.debug("JWT Token found in request: {}", request.getRequestURI());
                // Verify with Django microservice
                if (verifyWithDjango(jwt)) {
                    try {
                        String username = null;
                        try {
                            username = jwtUtil.getUsernameFromToken(jwt);
                        } catch (Exception e) {
                            log.warn("Verified by Django but Spring could not parse locally - signature likely mismatch. Attempting to decode payload...");
                            // If Django verified but Spring couldn't (signature mismatch), 
                            // we can try to get the subject from the payload as we already trust it.
                            String[] chunks = jwt.split("\\.");
                            if (chunks.length > 1) {
                                String payload = new String(java.util.Base64.getUrlDecoder().decode(chunks[1]));
                                try {
                                    Map<String, Object> map = new com.fasterxml.jackson.databind.ObjectMapper().readValue(payload, Map.class);
                                    // Try common keys for username/subject
                                    username = (String) map.get("sub");
                                    if (username == null) username = (String) map.get("username");
                                    if (username == null) username = (String) map.get("email");
                                    if (username == null && map.get("user_id") != null) {
                                        username = map.get("user_id").toString();
                                    }
                                    log.debug("Extracted username from payload: {}", username);
                                } catch (Exception ex) {
                                    log.error("Failed to decode payload: {}", ex.getMessage());
                                }
                            }
                        }
                        
                        if (username != null) {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            
                            UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            
                            log.debug("Set Authentication for user: {}", username);
                        }
                    } catch (Exception e) {
                        log.error("Error setting authentication: {}", e.getMessage());
                    }
                } else {
                    log.error("Token verification with Django failed");
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private boolean verifyWithDjango(String token) {
        try {
            // 1. First check locally - if it's a valid Spring-signed token, trust it
            if (jwtUtil.validateToken(token)) {
                return true;
            }

            // 2. If local check fails, it might be a Django token. Verify with Django service.
            String djangoUrl = djangoApiUrl + "/api/auth/verify/";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String requestBody = "{\"token\": \"" + token + "\"}";
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(djangoUrl, entity, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Boolean isValid = (Boolean) response.getBody().get("valid");
                if (isValid != null && isValid) {
                    // Try to extract username from the Django response if provided
                    String usernameFromDjango = (String) response.getBody().get("username");
                    if (usernameFromDjango != null) {
                        // Store it in the request so we can skip local parsing if needed
                        // (Alternatively, we could set authentication here)
                    }
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Error communicating with Django verification service: {}", e.getMessage());
            // Final fallback to local verification if Django is unavailable
            return jwtUtil.validateToken(token);
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        
        return null;
    }
}
