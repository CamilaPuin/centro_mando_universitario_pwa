package com.university.commandcenter.subject.infrastructure.adapter.out.persistence;

import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.EvaluationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface EvaluationJpaRepository extends JpaRepository<EvaluationEntity, Long> {
    @Query("SELECT e FROM EvaluationEntity e WHERE e.subject.id = :subjectId")
    List<EvaluationEntity> findBySubjectId(Long subjectId);
    
    @Query("SELECT e FROM EvaluationEntity e WHERE e.subject.id IN :subjectIds")
    List<EvaluationEntity> findBySubjectIdIn(@Param("subjectIds") List<Long> subjectIds);

    @Query("SELECT e FROM EvaluationEntity e WHERE e.subject.id IN :subjectIds AND e.evaluationDate BETWEEN :start AND :end ORDER BY e.evaluationDate ASC")
    List<EvaluationEntity> findBySubjectIdInAndEvaluationDateBetween(
            @Param("subjectIds") List<Long> subjectIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}
