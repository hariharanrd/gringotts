package com.luna.Gringotts.services;

import com.luna.Gringotts.records.User;
import com.luna.Gringotts.repository.UserRepository;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleAuthenticator gAuth;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.gAuth = new GoogleAuthenticator();
    }

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

        Map<String, String> response = new HashMap<>();
        response.put("secret", key.getKey());
        response.put("otpAuthTotpURL", "otpauth://totp/Gringotts:" + username + "?secret=" + key.getKey() + "&issuer=Gringotts");
        
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
}
