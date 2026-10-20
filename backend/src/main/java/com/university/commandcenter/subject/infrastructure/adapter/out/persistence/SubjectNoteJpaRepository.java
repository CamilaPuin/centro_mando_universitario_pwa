package com.university.commandcenter.subject.infrastructure.adapter.out.persistence;

import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectNoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectNoteJpaRepository extends JpaRepository<SubjectNoteEntity, Long> {
    List<SubjectNoteEntity> findBySubjectIdOrderByCreatedAtDesc(Long subjectId);
    void deleteBySubjectId(Long subjectId);
}
