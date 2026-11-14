package com.university.commandcenter.infrastructure.database;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class NeonDataSourceConfigurationTest {
    @Test
    void convertsNeonUriToJdbcUrlAndDecodesCredentials() {
        NeonDataSourceConfiguration.PostgresConnection parsed =
                NeonDataSourceConfiguration.parseConnectionString(
                        "postgresql://db_user:p%40ss+word@db.example.test/app?sslmode=require");

        assertEquals("jdbc:postgresql://db.example.test/app?sslmode=require", parsed.jdbcUrl());
        assertEquals("db_user", parsed.username());
        assertEquals("p@ss+word", parsed.password());
    }

    @Test
    void preservesJdbcUrlsForExistingConfigurations() {
        NeonDataSourceConfiguration.PostgresConnection parsed =
                NeonDataSourceConfiguration.parseConnectionString(
                        "jdbc:postgresql://localhost:5432/centro_mando");

        assertEquals("jdbc:postgresql://localhost:5432/centro_mando", parsed.jdbcUrl());
        assertNull(parsed.username());
    }
}
