package com.university.commandcenter.kanban.domain.state;

import com.university.commandcenter.kanban.domain.Task;

public class InProgressState implements TaskState {

    @Override
    public void markInProgress(Task task) {
        task.setCurrentState(this);
    }

    @Override
    public void markDone(Task task) {
        task.setCurrentState(new DoneState());
    }

    @Override
    public void markPending(Task task) {
        task.setCurrentState(new PendingState());
    }

    @Override
    public String getStateName() {
        return "IN_PROGRESS";
    }
}