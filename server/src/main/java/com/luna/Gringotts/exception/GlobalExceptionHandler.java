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
        LOGGER.log(Level.SEVERE, "Exception occurred", ex);
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Database constraint violation");
        response.put("details", ex.getMostSpecificCause().getMessage());
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        LOGGER.log(Level.SEVERE, "Exception occurred", ex);
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", "Internal Error");
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}
