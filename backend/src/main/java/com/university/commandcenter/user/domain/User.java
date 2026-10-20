package com.university.commandcenter.user.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class User {
    private final Long id;
    private final String username;
    private String password;
    private final String firstName;
    private final String lastName;

    public void changePassword(String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        this.password = newPassword;
    }
}
