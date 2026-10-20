package com.university.commandcenter.user.application.port.in;

import com.university.commandcenter.user.domain.User;

public interface RegisterUserUseCase {
    User register(User user);
}
