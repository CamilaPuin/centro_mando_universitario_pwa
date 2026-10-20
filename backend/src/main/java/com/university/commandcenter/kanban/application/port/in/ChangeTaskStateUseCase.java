package com.university.commandcenter.kanban.application.port.in;

public interface ChangeTaskStateUseCase {
    void changeState(Long userId, Long taskId, String newState);
}
