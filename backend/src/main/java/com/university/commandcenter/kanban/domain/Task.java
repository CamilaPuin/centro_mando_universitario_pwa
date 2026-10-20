package com.university.commandcenter.kanban.domain;

import com.university.commandcenter.kanban.domain.state.PendingState;
import com.university.commandcenter.kanban.domain.state.TaskState;

import java.time.LocalDateTime;

public class Task {

    private final Long id;
    private final Long subjectId;
    private final String title;
    private final String description;
    private final LocalDateTime dueDate;
    private final String priority;
    private final String taskType;
    private TaskState currentState;
    private LocalDateTime completedAt;

    public Task(
            Long id,
            Long subjectId,
            String title,
            String description,
            LocalDateTime dueDate,
            String priority,
            String taskType) {
        this.id = id;
        this.subjectId = subjectId;
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.taskType = taskType;
        this.currentState = new PendingState();
    }

    public Long getId() {
        return id;
    }

    public Long getSubjectId() {
        return subjectId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public String getPriority() {
        return priority;
    }

    public String getTaskType() {
        return taskType;
    }

    public TaskState getCurrentState() {
        return currentState;
    }

    public void setCurrentState(TaskState currentState) {
        if (currentState == null) {
            throw new IllegalArgumentException("Task state is required");
        }
        this.currentState = currentState;
    }

    public String getCurrentStateName() {
        return currentState.getStateName();
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public void markPending() {
        currentState.markPending(this);
    }

    public void markInProgress() {
        currentState.markInProgress(this);
    }

    public void markDone() {
        currentState.markDone(this);
    }
}