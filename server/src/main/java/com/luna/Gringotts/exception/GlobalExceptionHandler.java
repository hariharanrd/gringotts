package com.luna.Gringotts.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = Logger.getLogger(GlobalExceptionHandler.class.getName());

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        LOGGER.log(Level.SEVERE, "Database constraint violation occurred", ex);
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        
        String details = ex.getMostSpecificCause().getMessage();
        String message = "Database constraint violation. ";
        if (details != null && (details.contains("referenced from table") || details.contains("violates foreign key constraint"))) {
            message += "This record is still being used by other entries.";
        } else {
            message += "Please ensure no other records are referencing this entry.";
        }
        
        response.put("message", message);
        response.put("details", details);
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }


    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        LOGGER.log(Level.SEVERE, "Exception occurred", ex);
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        
        String message = ex.getMessage() != null ? ex.getMessage() : "Internal Error";
        response.put("message", message);
        
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String lowerMsg = message.toLowerCase();
        if (lowerMsg.contains("credentials") || 
            lowerMsg.contains("password is incorrect") || 
            lowerMsg.contains("2fa code") || 
            lowerMsg.contains("expired session") ||
            lowerMsg.contains("invalid token")) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (lowerMsg.contains("already exists")) {
            status = HttpStatus.CONFLICT;
        }
        
        return new ResponseEntity<>(response, status);
    }
}
