package com.university.commandcenter.subject.infrastructure.adapter.out.persistence;

import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface SubjectJpaRepository extends JpaRepository<SubjectEntity, Long> {
    @EntityGraph(attributePaths = "evaluations")
    List<SubjectEntity> findByUserId(Long userId);

    @EntityGraph(attributePaths = "evaluations")
    Optional<SubjectEntity> findByIdAndUserId(Long id, Long userId);
}