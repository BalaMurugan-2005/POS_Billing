package com.pos.system.exception;

import com.pos.system.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred (" + ex.getClass().getSimpleName() + ")";
        log.error("Runtime exception: ", ex);

        // Return 404 for 'not found' cases
        if (message.toLowerCase().contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, message));
        }
        // Return 409 for duplicate/conflict cases
        if (message.toLowerCase().contains("already exists")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, message));
        }
        
        // Return 400 for explicit bad request or validation messages
        if (message.toLowerCase().contains("required") || message.toLowerCase().contains("invalid")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse(false, message));
        }

        // Default: 500 Internal Server Error for null pointers and backend crashes
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, message));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String cause = ex.getMostSpecificCause().getMessage();
        log.error("Data integrity violation: {}", cause);

        String userMessage;
        if (cause != null && cause.toLowerCase().contains("unique")) {
            userMessage = "A record with this value already exists. Please use a unique barcode or identifier.";
        } else if (cause != null && cause.toLowerCase().contains("null")) {
            userMessage = "A required field is missing. Please fill in all required fields.";
        } else {
            userMessage = "A database constraint was violated: " + cause;
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, userMessage));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        log.error("Access denied: ", ex);
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse(false, "You do not have permission to access this resource"));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse> handleBadCredentialsException(BadCredentialsException ex) {
        log.error("Bad credentials: ", ex);
        ApiResponse response = new ApiResponse(false, "Invalid username or password");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse response = new ApiResponse(false, "Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: ", ex);
        ApiResponse response = new ApiResponse(false, "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}