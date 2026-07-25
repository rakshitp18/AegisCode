package com.aegiscode.backend.exception;

import com.aegiscode.backend.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(GitHubImportException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleGitHubImportException(
            GitHubImportException ex, jakarta.servlet.http.HttpServletRequest request) {
        
        log.error("[API Error] GitHub Import failed with code {}: {}", ex.getErrorCode(), ex.getMessage(), ex);

        java.util.Map<String, Object> error = new java.util.HashMap<>();
        error.put("code", ex.getErrorCode());
        error.put("errorCode", ex.getErrorCode());
        error.put("message", ex.getMessage());
        error.put("timestamp", System.currentTimeMillis());
        error.put("path", request.getRequestURI());

        HttpStatus status;
        switch (ex.getErrorCode()) {
            case "INVALID_URL":
                status = HttpStatus.BAD_REQUEST;
                break;
            case "PRIVATE_REPOSITORY":
                status = HttpStatus.FORBIDDEN;
                break;
            case "REPOSITORY_NOT_FOUND":
                status = HttpStatus.NOT_FOUND;
                break;
            case "CLONE_FAILED":
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                break;
            case "NETWORK_ERROR":
                status = HttpStatus.SERVICE_UNAVAILABLE;
                break;
            case "IMPORT_FAILED":
            default:
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                break;
        }

        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        log.warn("[API Error] Resource not found: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse("RESOURCE_NOT_FOUND", ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        log.warn("[API Error] Unauthorized access: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse("UNAUTHORIZED", ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleForbidden(ForbiddenException ex) {
        log.warn("[API Error] Forbidden access: {}", ex.getMessage());
        java.util.Map<String, Object> error = new java.util.HashMap<>();
        error.put("code", "ACCESS_DENIED");
        error.put("message", "You do not have permission to access this project.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        log.warn("[API Error] Bad request: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("[API Error] Illegal argument: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        log.warn("[API Error] Validation failed: {}", errors);
        ErrorResponse error = new ErrorResponse("VALIDATION_FAILED", "Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(org.springframework.security.core.AuthenticationException ex) {
        log.warn("[API Error] Authentication failed: {}", ex.getMessage());
        String msg = ex.getMessage() != null ? ex.getMessage() : "Authentication failed";
        ErrorResponse error = new ErrorResponse("UNAUTHORIZED", msg, null);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("[API Error] Access denied: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse("ACCESS_DENIED", "Access denied: " + ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("[API Error] Internal Server Error occurred: ", ex);
        String cleanMessage = "An unexpected error occurred. Please try again later.";
        if (ex.getMessage() != null && !ex.getMessage().trim().isEmpty()) {
            cleanMessage = ex.getMessage();
        }

        java.util.Map<String, String> details = new java.util.HashMap<>();
        Throwable cause = ex.getCause();
        if (cause != null) {
            details.put("rootCause", cause.getClass().getName());
            details.put("rootCauseMessage", cause.getMessage() != null ? cause.getMessage() : "No message");
        }

        StackTraceElement[] trace = ex.getStackTrace();
        if (trace != null && trace.length > 0) {
            details.put("location", trace[0].toString());
        }

        ErrorResponse error = new ErrorResponse("INTERNAL_SERVER_ERROR", cleanMessage, details.isEmpty() ? null : details);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
