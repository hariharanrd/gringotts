package com.luna.Gringotts.services;

import com.luna.Gringotts.records.TrustedBrowser;
import com.luna.Gringotts.repository.TrustedBrowserRepository;
import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthenticator gAuth;
    private final TrustedBrowserRepository trustedBrowserRepository;
    private final DefaultDataInitializer defaultDataInitializer;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            TrustedBrowserRepository trustedBrowserRepository,
            DefaultDataInitializer defaultDataInitializer
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.trustedBrowserRepository = trustedBrowserRepository;
        this.defaultDataInitializer = defaultDataInitializer;
        this.gAuth = new GoogleAuthenticator();
    }

    @CacheEvict(value = "users", allEntries = true)
    public Map<String, Object> register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            return Map.of("status", "error", "message", "User already exists", "status_code", 409);
        }

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setTotpSecret(key.getKey());
        
        userRepository.save(user);
        
        String preAuthToken = jwtService.generatePreAuthToken(username);

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("secret", key.getKey());
        response.put("otpAuthTotpURL", "otpauth://totp/Gringotts:" + username + "?secret=" + key.getKey() + "&issuer=Gringotts");
        response.put("preAuthToken", preAuthToken);
        
        return response;
    }

    public String authenticate(String username, String password, int code) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
        );

        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!gAuth.authorize(user.getTotpSecret(), code)) {
            throw new RuntimeException("Invalid 2FA code");
        }

        return jwtService.generateToken(user);
    }

    public Map<String, Object> preAuthenticate(String username, String password, String trustToken) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch(DisabledException | UsernameNotFoundException | BadCredentialsException ue){
            return Map.of("status", "error", "message", "Bad Credentials", "status_code", 401);
        }

        if (trustToken != null) {
            Optional<TrustedBrowser> trusted = trustedBrowserRepository.findByToken(trustToken);
            if (trusted.isPresent() && trusted.get().getUsername().equals(username) &&
                trusted.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                
                User user = userRepository.findByUsername(username).orElseThrow();
                return Map.of(
                    "status", "success",
                    "requiresMfa", false,
                    "jwt", jwtService.generateToken(user)
                );
            }
        }

        return Map.of(
            "status", "success",
            "requiresMfa", true,
            "preAuthToken", jwtService.generatePreAuthToken(username)
        );
    }

    public Map<String, Object> completeMfa(String preAuthToken, int code, boolean trustBrowser) {
        if (!jwtService.isPreAuthTokenValid(preAuthToken)) {
            return Map.of("status", "error", "message", "Invalid or expired session. Please login again.", "status_code", 401);
        }

        String username = jwtService.extractPreAuthUsername(preAuthToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!gAuth.authorize(user.getTotpSecret(), code)) {
            return Map.of("status", "error", "message", "Invalid 2FA code", "status_code", 401);
        }

        if (!user.isConfirmed()) {
            user.setConfirmed(true);
            userRepository.save(user);
            defaultDataInitializer.initializeCategories(user);
        }

        String jwt = jwtService.generateToken(user);
        String trustToken = null;

        if (trustBrowser) {
            trustToken = UUID.randomUUID().toString();
            TrustedBrowser tb = new TrustedBrowser();
            tb.setToken(trustToken);
            tb.setUsername(username);
            tb.setExpiresAt(LocalDateTime.now().plusMonths(3));
            trustedBrowserRepository.save(tb);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("jwt", jwt);
        if (trustToken != null) response.put("trustToken", trustToken);
        return response;
    }

    public static record PreAuthResult(boolean requiresMfa, String preAuthToken, String jwt, String trustToken) {}
    public static record MfaResult(String jwt, String trustToken) {}
}
