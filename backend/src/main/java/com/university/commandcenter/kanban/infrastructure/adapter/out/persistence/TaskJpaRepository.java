package com.university.commandcenter.kanban.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface TaskJpaRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findBySubjectId(Long subjectId);
    List<TaskEntity> findBySubjectIdIn(List<Long> subjectIds);
    List<TaskEntity> findBySubjectIdAndStatus(Long subjectId, String status);
    List<TaskEntity> findBySubjectIdInAndStatus(List<Long> subjectIds, String status);
    List<TaskEntity> findBySubjectIdInAndStatusAndCompletedAtAfter(
            List<Long> subjectIds, String status, LocalDateTime completedAfter);
}
