package com.university.commandcenter.user.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.infrastructure.security.JwtService;
import com.university.commandcenter.shared.infrastructure.exception.ResourceConflictException;
import com.university.commandcenter.user.application.port.in.LoginUseCase;
import com.university.commandcenter.user.application.port.in.RegisterUserUseCase;
import com.university.commandcenter.user.application.port.out.UserRepositoryPort;
import com.university.commandcenter.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock private RegisterUserUseCase registerUserUseCase;
    @Mock private LoginUseCase loginUseCase;
    @Mock private CurrentUserService currentUserService;
    @Mock private UserRepositoryPort userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @InjectMocks private UserController controller;

    @BeforeEach
    void setUp() {
        when(currentUserService.getCurrentUserId()).thenReturn(7L);
    }

    @Test
    void updatesProfileAndReturnsTokenForTheNewUsername() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user("old-name", "encoded")));
        when(userRepository.findByUsername("new-name")).thenReturn(Optional.empty());
        when(jwtService.generateToken("new-name")).thenReturn("new-token");

        var response = controller.updateCurrentProfile(
                new UserController.ProfileUpdateRequest(" new-name ", " Camila ", " Puin "));

        assertEquals("new-name", response.getBody().username());
        assertEquals("Camila", response.getBody().firstName());
        assertEquals("Puin", response.getBody().lastName());
        assertEquals("new-token", response.getBody().token());
        verify(userRepository).updateProfile(7L, "new-name", "Camila", "Puin");
    }

    @Test
    void rejectsAUsernameAlreadyOwnedByAnotherAccount() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user("old-name", "encoded")));
        when(userRepository.findByUsername("taken")).thenReturn(Optional.of(userWithId(8L, "taken", "encoded")));

        assertThrows(ResourceConflictException.class, () -> controller.updateCurrentProfile(
                new UserController.ProfileUpdateRequest("taken", "Camila", "Puin")));
        verify(userRepository, never()).updateProfile(anyLong(), anyString(), anyString(), anyString());
    }

    @Test
    void requiresTheCurrentPasswordBeforeChangingIt() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user("student", "encoded")));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> controller.updateCurrentPassword(
                new UserController.PasswordUpdateRequest("wrong", "new-password")));
        verify(userRepository, never()).updatePassword(anyLong(), anyString());
    }

    @Test
    void updatesThePasswordAfterVerifyingTheCurrentOne() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user("student", "encoded")));
        when(passwordEncoder.matches("current-password", "encoded")).thenReturn(true);
        when(passwordEncoder.encode("new-password")).thenReturn("new-encoded");
        when(jwtService.generateToken("student")).thenReturn("fresh-token");

        var response = controller.updateCurrentPassword(
                new UserController.PasswordUpdateRequest("current-password", "new-password"));

        assertEquals("fresh-token", response.getBody().token());
        verify(userRepository).updatePassword(7L, "new-encoded");
    }

    private static User user(String username, String password) {
        return userWithId(7L, username, password);
    }

    private static User userWithId(Long id, String username, String password) {
        return User.builder()
                .id(id)
                .username(username)
                .password(password)
                .firstName("Camila")
                .lastName("Puin")
                .build();
    }
}
