package com.university.commandcenter.user.infrastructure.adapter.in.web;

import com.university.commandcenter.user.application.port.in.LoginUseCase;
import com.university.commandcenter.user.application.port.in.RegisterUserUseCase;
import com.university.commandcenter.user.application.port.out.UserRepositoryPort;
import com.university.commandcenter.user.domain.User;
import com.university.commandcenter.infrastructure.security.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Base64;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management API")
public class UserController {

    private final RegisterUserUseCase registerUserUseCase;
    private final LoginUseCase loginUseCase;
    private final CurrentUserService currentUserService;
    private final UserRepositoryPort userRepository;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user in the system")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = User.builder()
                .username(request.username())
                .password(request.password())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .build();
        
        User savedUser = registerUserUseCase.register(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserResponse(savedUser.getId(), savedUser.getUsername(), savedUser.getFirstName()));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates a user and returns a JWT token")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = loginUseCase.login(request.username(), request.password());
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileResponse> getCurrentProfile() {
        User user = userRepository.findById(currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile was not found"));
        String photo = user.getProfilePhoto() == null
                ? null
                : Base64.getEncoder().encodeToString(user.getProfilePhoto());
        return ResponseEntity.ok(new UserProfileResponse(
                user.getUsername(), user.getFirstName(), user.getLastName(), photo));
    }

    @PutMapping("/me/photo")
    @Operation(summary = "Update current user profile photo")
    public ResponseEntity<Void> updateProfilePhoto(@Valid @RequestBody PhotoRequest request) {
        byte[] photo = null;
        if (request.photo() != null && !request.photo().isBlank()) {
            try {
                photo = Base64.getDecoder().decode(request.photo());
            } catch (IllegalArgumentException exception) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile photo must be valid Base64", exception);
            }
            if (photo.length > 1024 * 1024) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile photo must not exceed 1 MB");
            }
        }
        userRepository.updateProfilePhoto(currentUserService.getCurrentUserId(), photo);
        return ResponseEntity.noContent().build();
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 50) String username,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(max = 100) String firstName,
            @NotBlank @Size(max = 100) String lastName) {}
    public record UserResponse(Long id, String username, String firstName) {}
    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}
    public record LoginResponse(String token) {}
    public record UserProfileResponse(String username, String firstName, String lastName, String photo) {}
    public record PhotoRequest(@Size(max = 1_398_104) String photo) {}
}
