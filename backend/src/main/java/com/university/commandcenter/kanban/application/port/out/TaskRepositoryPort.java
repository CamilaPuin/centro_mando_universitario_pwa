package com.university.commandcenter.kanban.application.port.out;

import com.university.commandcenter.kanban.domain.Task;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface TaskRepositoryPort {
    Optional<Task> findById(Long id);
    Task save(Task task);
    List<Task> findBySubjectId(Long subjectId);
    List<Task> findBySubjectIdIn(List<Long> subjectIds);
    List<Task> findBySubjectIdAndStatus(Long subjectId, String status);
    List<Task> findBySubjectIdInAndStatus(List<Long> subjectIds, String status);
    List<Task> findBySubjectIdInAndStatusAndCompletedAtAfter(
            List<Long> subjectIds, String status, LocalDateTime completedAfter);
    void deleteById(Long id);
}
