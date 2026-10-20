package com.university.commandcenter.infrastructure.security;

import com.university.commandcenter.user.application.port.out.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.authentication.BadCredentialsException;

@Component
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepositoryPort userRepository;

    public Long getCurrentUserId() {
        String username = AuthenticatedUser.getCurrentUsername();
        return userRepository.findByUsername(username)
                .map(user -> user.getId())
                .orElseThrow(() -> new BadCredentialsException("Authenticated user was not found"));
    }
}
