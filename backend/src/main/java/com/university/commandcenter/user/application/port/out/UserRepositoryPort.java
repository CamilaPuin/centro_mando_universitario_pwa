package com.university.commandcenter.user.application.port.out;

import com.university.commandcenter.user.domain.User;
import java.util.Optional;

public interface UserRepositoryPort {
    User save(User user);
    Optional<User> findByUsername(String username);
    Optional<User> findById(Long id);
    void updateProfilePhoto(Long userId, byte[] photo);
    void updateProfile(Long userId, String username, String firstName, String lastName);
    void updatePassword(Long userId, String encodedPassword);
}
