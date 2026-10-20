package com.university.commandcenter.kanban.application.service;

import com.university.commandcenter.kanban.application.port.in.ChangeTaskStateUseCase;
import com.university.commandcenter.kanban.application.port.in.ExamWeekUseCase;
import com.university.commandcenter.kanban.application.port.in.ManageTaskUseCase;
import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.kanban.domain.state.DoneState;
import com.university.commandcenter.kanban.domain.state.InProgressState;
import com.university.commandcenter.kanban.domain.state.PendingState;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService implements ManageTaskUseCase, ChangeTaskStateUseCase, ExamWeekUseCase {

    private final TaskRepositoryPort taskRepository;
    private final SubjectRepositoryPort subjectRepository;

    @Override
    @Transactional
    public Task createTask(Long userId, Task task) {
        requireOwnedSubject(userId, task.getSubjectId());
        validateTask(task);
        return taskRepository.save(normalize(task));
    }

    @Override
    @Transactional
    public Task updateTask(Long userId, Long taskId, Task updates) {
        Task existing = getTaskById(userId, taskId);
        requireOwnedSubject(userId, updates.getSubjectId());
        validateTask(updates);
        Task updated = new Task(
                existing.getId(),
                updates.getSubjectId(),
                updates.getTitle(),
                updates.getDescription(),
                updates.getDueDate(),
                updates.getPriority().toUpperCase(java.util.Locale.ROOT),
                updates.getTaskType().toUpperCase(java.util.Locale.ROOT));
        setState(updated, existing.getCurrentStateName());
        updated.setCompletedAt(existing.getCompletedAt());
        return taskRepository.save(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Task getTaskById(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        requireOwnedSubject(userId, task.getSubjectId());
        return task;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> getTasksBySubjects(Long userId) {
        List<Long> subjectIds = subjectRepository.findByUserId(userId).stream()
                .map(Subject::getId)
                .toList();
        return taskRepository.findBySubjectIdIn(subjectIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> getTasksBySubject(Long userId, Long subjectId) {
        requireOwnedSubject(userId, subjectId);
        return taskRepository.findBySubjectId(subjectId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Task> getUpcomingExams(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return getTasksBySubjects(userId).stream()
                .filter(task -> task.getDueDate() != null && !task.getDueDate().isBefore(now)
                        && !task.getDueDate().isAfter(now.plusDays(7)))
                .filter(task -> !"DONE".equals(task.getCurrentStateName()))
                .filter(task -> isEvaluation(task.getTaskType()))
                .sorted(Comparator.comparing(Task::getDueDate)
                        .thenComparing(Task::getPriority, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Override
    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        getTaskById(userId, taskId);
        taskRepository.deleteById(taskId);
    }

    @Override
    @Transactional
    public void changeState(Long userId, Long taskId, String newState) {
        Task task = getTaskById(userId, taskId);
        setState(task, newState);
        task.setCompletedAt("DONE".equals(task.getCurrentStateName())
                ? task.getCompletedAt() == null ? LocalDateTime.now() : task.getCompletedAt()
                : null);
        taskRepository.save(task);
    }

    private void requireOwnedSubject(Long userId, Long subjectId) {
        if (subjectId == null || subjectRepository.findById(subjectId)
                .filter(subject -> userId.equals(subject.getUserId()))
                .isEmpty()) {
            throw new ResourceNotFoundException("Subject not found");
        }
    }

    private void validateTask(Task task) {
        if (task.getTitle() == null || task.getTitle().isBlank()) {
            throw new IllegalArgumentException("Task title is required");
        }
        if (task.getDueDate() == null) {
            throw new IllegalArgumentException("Task due date is required");
        }
        if (task.getPriority() == null
                || !List.of("LOW", "MEDIUM", "HIGH")
                        .contains(task.getPriority().toUpperCase(java.util.Locale.ROOT))) {
            throw new IllegalArgumentException("Task priority must be LOW, MEDIUM, or HIGH");
        }
        if (!isTaskType(task.getTaskType())) {
            throw new IllegalArgumentException("Task type must be TASK, ASSIGNMENT, PROJECT, EXAM, EVALUATION, or TEST");
        }
    }

    private boolean isTaskType(String taskType) {
        return taskType != null && List.of("TASK", "ASSIGNMENT", "PROJECT", "EXAM", "EVALUATION", "TEST")
                .contains(taskType.toUpperCase(java.util.Locale.ROOT));
    }

    private boolean isEvaluation(String taskType) {
        return taskType != null && List.of("EXAM", "EVALUATION", "TEST")
                .contains(taskType.toUpperCase(java.util.Locale.ROOT));
    }

    private void setState(Task task, String state) {
        if (state == null) {
            throw new IllegalArgumentException("Task state is required");
        }
        switch (state.toUpperCase(java.util.Locale.ROOT)) {
            case "PENDING" -> task.setCurrentState(new PendingState());
            case "IN_PROGRESS" -> task.setCurrentState(new InProgressState());
            case "DONE" -> task.setCurrentState(new DoneState());
            default -> throw new IllegalArgumentException("Task state must be PENDING, IN_PROGRESS, or DONE");
        }
    }

    private Task normalize(Task task) {
        return new Task(
                null,
                task.getSubjectId(),
                task.getTitle().trim(),
                task.getDescription(),
                task.getDueDate(),
                task.getPriority().toUpperCase(java.util.Locale.ROOT),
                task.getTaskType().toUpperCase(java.util.Locale.ROOT));
    }
}