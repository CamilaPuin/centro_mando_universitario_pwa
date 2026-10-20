package com.university.commandcenter.infrastructure.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            Base64.getEncoder().encodeToString(new byte[32]),
            60_000);

    @Test
    void generatesAndValidatesSignedUserTokens() {
        String token = jwtService.generateToken("student");

        assertEquals("student", jwtService.extractUsername(token));
    }

    @Test
    void rejectsTamperedTokens() {
        String token = jwtService.generateToken("student");
        String tamperedToken = token.substring(0, token.length() - 1) + "x";

        assertThrows(JwtException.class, () -> jwtService.extractUsername(tamperedToken));
    }

    @Test
    void generatesAnEphemeralKeyWhenNoSecretIsConfigured() {
        JwtService firstInstance = new JwtService("", 60_000);
        JwtService secondInstance = new JwtService("", 60_000);
        String token = firstInstance.generateToken("student");

        assertEquals("student", firstInstance.extractUsername(token));
        assertThrows(JwtException.class, () -> secondInstance.extractUsername(token));
    }
}
