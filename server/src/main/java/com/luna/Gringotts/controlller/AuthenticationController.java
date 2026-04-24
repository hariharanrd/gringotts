package com.luna.Gringotts.controlller;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.UserRepository;
import com.luna.Gringotts.services.AppConfigurationService;
import com.luna.Gringotts.services.AuthenticationService;
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
    private final UserRepository userRepository;

    @Value("${production:false}")
    private String production;

    @Autowired
    AppConfigurationService appConfigurationService;

    public AuthenticationController(AuthenticationService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody RegisterRequest request) {
        boolean registrationAllowed = Boolean.parseBoolean(appConfigurationService.getValue("IAM", "USER_REGISTRATION", "false"));
        if(registrationAllowed) {
            return ResponseEntity.ok(service.register(request.getUsername(), request.getPassword()));
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/pre-authenticate")
    public ResponseEntity<PreAuthenticateResponse> preAuthenticate(
            @RequestBody PreAuthenticateRequest request,
            @RequestHeader(value = "X-Trust-Token", required = false) String trustToken,
            HttpServletResponse response) {
        AuthenticationService.PreAuthResult result = service.preAuthenticate(
                request.getUsername(), request.getPassword(), trustToken);

        if (!result.requiresMfa()) {
            setSessionCookie(result.jwt(), response);
            return ResponseEntity.ok(new PreAuthenticateResponse(false, null));
        }

        return ResponseEntity.ok(new PreAuthenticateResponse(true, result.preAuthToken()));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticateResponse> authenticate(
            @RequestBody AuthenticateRequest request,
            HttpServletResponse response) {
        AuthenticationService.MfaResult result = service.completeMfa(
                request.getPreAuthToken(), request.getCode(), request.isTrustBrowser());

        setSessionCookie(result.jwt(), response);

        return ResponseEntity.ok(new AuthenticateResponse(result.trustToken()));
    }

    private void setSessionCookie(String token, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("__session", token)
                .httpOnly(true)
                .secure(Boolean.parseBoolean(production))
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
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
    public ResponseEntity<Map<String, String>> checkAuth() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {

            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user == null) return ResponseEntity.status(403).build();

            return ResponseEntity.ok(Map.of(
                    "username", user.getUsername(),
                    "displayName", user.getDisplayName() != null ? user.getDisplayName() : "",
                    "profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : ""
            ));
        }
        return ResponseEntity.status(403).build();
    }

    public static class RegisterRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class PreAuthenticateRequest {
        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static record PreAuthenticateResponse(boolean requiresMfa, String preAuthToken) {
    }

    public static class AuthenticateRequest {
        private String preAuthToken;
        private int code;
        private boolean trustBrowser;

        public String getPreAuthToken() {
            return preAuthToken;
        }

        public void setPreAuthToken(String preAuthToken) {
            this.preAuthToken = preAuthToken;
        }

        public int getCode() {
            return code;
        }

        public void setCode(int code) {
            this.code = code;
        }

        public boolean isTrustBrowser() {
            return trustBrowser;
        }

        public void setTrustBrowser(boolean trustBrowser) {
            this.trustBrowser = trustBrowser;
        }
    }

    public static record AuthenticateResponse(String trustToken) {
    }
}
