package com.university.commandcenter.user.application.service;

import com.university.commandcenter.user.application.port.in.RegisterUserUseCase;
import com.university.commandcenter.user.application.port.out.UserRepositoryPort;
import com.university.commandcenter.user.domain.User;
import com.university.commandcenter.shared.infrastructure.exception.ResourceConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService implements RegisterUserUseCase {

    private final UserRepositoryPort userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User register(User user) {
        if (user.getUsername() == null || user.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (user.getPassword() == null || user.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters");
        }
        if (user.getFirstName() == null || user.getFirstName().isBlank()
                || user.getLastName() == null || user.getLastName().isBlank()) {
            throw new IllegalArgumentException("First and last names are required");
        }
        if (userRepository.findByUsername(user.getUsername().trim()).isPresent()) {
            throw new ResourceConflictException("Username is already registered");
        }
        User savedUser = User.builder()
                .username(user.getUsername().trim())
                .password(passwordEncoder.encode(user.getPassword()))
                .firstName(user.getFirstName().trim())
                .lastName(user.getLastName().trim())
                .build();
        return userRepository.save(savedUser);
    }
}