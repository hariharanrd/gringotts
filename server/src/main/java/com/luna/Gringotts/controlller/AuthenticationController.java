package com.luna.Gringotts.controlller;

import com.luna.Gringotts.services.AppConfigurationService;
import com.luna.Gringotts.services.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService service;

    @Value("${production:false}")
    private String production;

    @Autowired
    AppConfigurationService appConfigurationService;

    public AuthenticationController(AuthenticationService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        boolean registrationAllowed = Boolean.parseBoolean(appConfigurationService.getValue("IAM","USER_REGISTRATION","false"));
        if(registrationAllowed) {
            return ResponseEntity.ok(service.register(request.getUsername(), request.getPassword()));
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/authenticate")
    public ResponseEntity<Void> authenticate(
            @RequestBody AuthenticationRequest request,
            HttpServletRequest httpServletRequest,
            HttpServletResponse response
    ) {
        String token = service.authenticate(request.getUsername(), request.getPassword(), request.getCode());
        ResponseCookie cookie = ResponseCookie.from("__session", token)
                .httpOnly(true)
                .secure(Boolean.parseBoolean(production))
                .path("/")
                .maxAge(24 * 60 * 60)
                .sameSite("Lax")
                .build();
        
        response.addHeader("Set-Cookie", cookie.toString());
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("__session", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        
        response.addHeader("Set-Cookie", cookie.toString());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String,String>> checkAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {

            return ResponseEntity.ok(Map.of("username", authentication.getName()));
        }
        return ResponseEntity.status(403).build();
    }

    public static class RegisterRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthenticationRequest {
        private String username;
        private String password;
        private int code;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public int getCode() { return code; }
        public void setCode(int code) { this.code = code; }
    }
}
