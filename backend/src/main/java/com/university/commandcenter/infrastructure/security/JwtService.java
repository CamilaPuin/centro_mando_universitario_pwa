package com.university.commandcenter.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.util.Date;
import java.util.Base64;

@Service
public class JwtService {

    private static final Logger LOGGER = LoggerFactory.getLogger(JwtService.class);
    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
            @Value("${app.security.jwt.secret-key:}") String secretKey,
            @Value("${app.security.jwt.expiration-ms:86400000}") long expirationMillis) {
        if (expirationMillis <= 0) {
            throw new IllegalArgumentException("JWT expiration must be greater than zero");
        }
        if (secretKey == null || secretKey.isBlank()) {
            byte[] randomKey = new byte[32];
            new SecureRandom().nextBytes(randomKey);
            this.signingKey = Keys.hmacShaKeyFor(randomKey);
            LOGGER.warn("JWT_SECRET_KEY is not configured. A temporary key was generated; tokens will expire after restart.");
        } else {
            try {
                byte[] decodedKey = Base64.getDecoder().decode(secretKey);
                this.signingKey = Keys.hmacShaKeyFor(decodedKey);
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException(
                        "JWT_SECRET_KEY must be Base64-encoded and contain at least 32 random bytes", exception);
            }
        }
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(String username) {
        Date issuedAt = new Date();
        return Jwts.builder()
                .subject(username)
                .issuedAt(issuedAt)
                .expiration(new Date(issuedAt.getTime() + expirationMillis))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}