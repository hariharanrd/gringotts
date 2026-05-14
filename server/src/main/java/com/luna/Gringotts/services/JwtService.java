package com.luna.Gringotts.services;

import com.luna.Gringotts.records.UserSession;
import com.luna.Gringotts.repository.UserSessionRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    private final UserSessionRepository userSessionRepository;

    public JwtService(UserSessionRepository userSessionRepository) {
        this.userSessionRepository = userSessionRepository;
    }

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generatePreAuthToken(String username) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("type", "pre-auth");
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 5)) // 5 minutes
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractPreAuthUsername(String token) {
        final Claims claims = extractAllClaims(token);
        if (!"pre-auth".equals(claims.get("type"))) {
            throw new RuntimeException("Invalid token type");
        }
        return claims.getSubject();
    }

    public boolean isPreAuthTokenValid(String token) {
        try {
            final Claims claims = extractAllClaims(token);
            return "pre-auth".equals(claims.get("type")) && !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails, null);
    }

    public String generateToken(UserDetails userDetails, String tokenId) {
        return generateToken(new HashMap<>(), userDetails, tokenId);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails, String tokenId) {
        if (tokenId != null) {
            extraClaims.put("jti", tokenId);
        }
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token)) {
            return false;
        }
        
        String jti = extractClaim(token, claims -> claims.get("jti", String.class));
        if (jti != null) {
            UserSession session = userSessionRepository.findByTokenId(jti).orElse(null);
            if (session == null || session.isRevoked()) {
                return false;
            }
            // Optional: update last_active_at could happen here, but it would require saving.
            // Skipping update on every request for performance.
        }
        return true;
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
