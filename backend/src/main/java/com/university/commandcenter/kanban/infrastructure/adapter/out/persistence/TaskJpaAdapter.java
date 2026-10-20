package com.university.commandcenter.kanban.infrastructure.adapter.out.persistence;

import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.kanban.domain.state.DoneState;
import com.university.commandcenter.kanban.domain.state.InProgressState;
import com.university.commandcenter.kanban.domain.state.PendingState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class TaskJpaAdapter implements TaskRepositoryPort {

    private final TaskJpaRepository jpaRepository;

    @Override
    public Optional<Task> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<Task> findBySubjectId(Long subjectId) {
        return jpaRepository.findBySubjectId(subjectId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Task> findBySubjectIdIn(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findBySubjectIdIn(subjectIds).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Task> findBySubjectIdAndStatus(Long subjectId, String status) {
        return jpaRepository.findBySubjectIdAndStatus(subjectId, status).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Task> findBySubjectIdInAndStatus(List<Long> subjectIds, String status) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findBySubjectIdInAndStatus(subjectIds, status).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Task> findBySubjectIdInAndStatusAndCompletedAtAfter(
            List<Long> subjectIds, String status, LocalDateTime completedAfter) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findBySubjectIdInAndStatusAndCompletedAtAfter(subjectIds, status, completedAfter)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Task save(Task task) {
        TaskEntity entity = TaskEntity.builder()
                .id(task.getId())
                .subjectId(task.getSubjectId())
                .title(task.getTitle())
                .description(task.getDescription())
                .dueDate(task.getDueDate())
                .priority(task.getPriority())
                .status(task.getCurrentStateName())
                .taskType(task.getTaskType())
                .completedAt(task.getCompletedAt())
                .build();

        TaskEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private Task toDomain(TaskEntity entity) {
        Task task = new Task(
                entity.getId(),
                entity.getSubjectId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getDueDate(),
                entity.getPriority(),
                entity.getTaskType()
        );

        if (entity.getStatus() == null) {
            throw new IllegalStateException("Task status is missing for task " + entity.getId());
        }
        String status = entity.getStatus().toUpperCase(java.util.Locale.ROOT);
        switch (status) {
            case "IN_PROGRESS":
                task.setCurrentState(new InProgressState());
                break;
            case "DONE":
                task.setCurrentState(new DoneState());
                break;
            case "PENDING":
                task.setCurrentState(new PendingState());
                break;
            default:
                throw new IllegalStateException("Unsupported task status: " + status);
        }
        task.setCompletedAt(entity.getCompletedAt());

        return task;
    }
}
