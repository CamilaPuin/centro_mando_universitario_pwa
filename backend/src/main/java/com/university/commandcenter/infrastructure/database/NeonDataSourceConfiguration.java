package com.university.commandcenter.infrastructure.database;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import javax.sql.DataSource;

import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
class NeonDataSourceConfiguration {
    @Bean
    DataSource dataSource(DataSourceProperties properties) {
        PostgresConnection connection = parseConnectionString(properties.getUrl());
        DataSourceBuilder<?> builder = properties.initializeDataSourceBuilder()
                .url(connection.jdbcUrl());

        if (connection.username() != null) {
            builder.username(connection.username()).password(connection.password());
        }

        return builder.build();
    }

    @Bean
    FlywayConfigurationCustomizer neonFlywayConfigurationCustomizer(Environment environment) {
        return configuration -> configureFlywayDataSource(configuration, environment);
    }

    private static void configureFlywayDataSource(
            FluentConfiguration configuration, Environment environment) {
        String unpooledUrl = environment.getProperty("DATABASE_URL_UNPOOLED");
        if (StringUtils.hasText(unpooledUrl)) {
            PostgresConnection connection = parseConnectionString(unpooledUrl);
            configuration.dataSource(
                    connection.jdbcUrl(), connection.username(), connection.password());
        }
    }

    static PostgresConnection parseConnectionString(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("PostgreSQL connection URL must not be blank");
        }
        if (value.startsWith("jdbc:postgresql:")) {
            return new PostgresConnection(value, null, null);
        }

        final URI uri;
        try {
            uri = new URI(value);
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid PostgreSQL connection URL");
        }

        String scheme = uri.getScheme();
        if (!"postgres".equalsIgnoreCase(scheme) && !"postgresql".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Unsupported PostgreSQL connection URL scheme");
        }

        String authority = uri.getRawAuthority();
        String userInfo = uri.getRawUserInfo();
        if (!StringUtils.hasText(authority)) {
            throw new IllegalArgumentException("PostgreSQL connection URL must include a host");
        }

        String username = null;
        String password = null;
        if (userInfo != null) {
            int separator = userInfo.indexOf(':');
            if (separator < 0) {
                throw new IllegalArgumentException("PostgreSQL connection URL credentials are invalid");
            }
            username = decodeUserInfo(userInfo.substring(0, separator));
            password = decodeUserInfo(userInfo.substring(separator + 1));
            authority = authority.substring(authority.lastIndexOf('@') + 1);
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(authority)
                .append(uri.getRawPath() == null ? "" : uri.getRawPath());
        if (uri.getRawQuery() != null) {
            jdbcUrl.append('?').append(uri.getRawQuery());
        }

        return new PostgresConnection(jdbcUrl.toString(), username, password);
    }

    private static String decodeUserInfo(String value) {
        try {
            return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("PostgreSQL connection URL credentials are invalid");
        }
    }

    record PostgresConnection(String jdbcUrl, String username, String password) {
    }
}
