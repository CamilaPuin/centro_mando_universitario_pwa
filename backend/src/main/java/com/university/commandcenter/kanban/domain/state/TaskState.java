package com.university.commandcenter.kanban.domain.state;

import com.university.commandcenter.kanban.domain.Task;

public interface TaskState {
    void markInProgress(Task task);
    void markDone(Task task);
    void markPending(Task task);
    String getStateName();
}
