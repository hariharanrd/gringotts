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
    public Map<String, String> register(String username, String password) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        GoogleAuthenticatorKey key = gAuth.createCredentials();
        
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setTotpSecret(key.getKey());
        
        userRepository.save(user);
        
        String preAuthToken = jwtService.generatePreAuthToken(username);

        Map<String, String> response = new HashMap<>();
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

    public PreAuthResult preAuthenticate(String username, String password, String trustToken) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch(DisabledException | UsernameNotFoundException | BadCredentialsException ue){
            throw new RuntimeException("Bad Credentials");
        }

        if (trustToken != null) {
            Optional<TrustedBrowser> trusted = trustedBrowserRepository.findByToken(trustToken);
            if (trusted.isPresent() && trusted.get().getUsername().equals(username) &&
                trusted.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                
                User user = userRepository.findByUsername(username).orElseThrow();
                return new PreAuthResult(false, null, jwtService.generateToken(user), null);
            }
        }

        return new PreAuthResult(true, jwtService.generatePreAuthToken(username), null, null);
    }

    public MfaResult completeMfa(String preAuthToken, int code, boolean trustBrowser) {
        if (!jwtService.isPreAuthTokenValid(preAuthToken)) {
            throw new RuntimeException("Invalid or expired session. Please login again.");
        }

        String username = jwtService.extractPreAuthUsername(preAuthToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow();

        if (!gAuth.authorize(user.getTotpSecret(), code)) {
            throw new RuntimeException("Invalid 2FA code");
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

        return new MfaResult(jwt, trustToken);
    }

    public static record PreAuthResult(boolean requiresMfa, String preAuthToken, String jwt, String trustToken) {}
    public static record MfaResult(String jwt, String trustToken) {}
}
