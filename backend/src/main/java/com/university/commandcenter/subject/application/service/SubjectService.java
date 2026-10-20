package com.university.commandcenter.subject.application.service;

import com.university.commandcenter.subject.application.port.in.CalculateAverageUseCase;
import com.university.commandcenter.subject.application.port.in.ManageEvaluationUseCase;
import com.university.commandcenter.subject.application.port.in.ManageSubjectNoteUseCase;
import com.university.commandcenter.subject.application.port.in.ManageSubjectUseCase;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Evaluation;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.EvaluationJpaRepository;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.SubjectJpaRepository;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.SubjectMapper;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.SubjectNoteJpaRepository;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.EvaluationEntity;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectEntity;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectNoteEntity;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService implements ManageSubjectUseCase, ManageEvaluationUseCase,
        ManageSubjectNoteUseCase, CalculateAverageUseCase {

    private final SubjectRepositoryPort subjectRepository;
    private final SubjectJpaRepository subjectJpaRepository;
    private final EvaluationJpaRepository evaluationJpaRepository;
    private final SubjectNoteJpaRepository subjectNoteJpaRepository;
    private final SubjectMapper subjectMapper;

    @Override
    @Transactional
    public Subject createSubject(Long userId, Subject subject) {
        validateSubject(subject);
        Subject candidate = Subject.builder()
                .userId(userId)
                .name(subject.getName().trim())
                .teacher(subject.getTeacher())
                .schedule(subject.getSchedule())
                .credits(subject.getCredits())
                .build();
        return subjectRepository.save(candidate);
    }

    @Override
    @Transactional
    public Subject updateSubject(Long userId, Long subjectId, Subject subject) {
        requireOwnedSubject(userId, subjectId);
        validateSubject(subject);
        Subject updated = Subject.builder()
                .id(subjectId)
                .userId(userId)
                .name(subject.getName().trim())
                .teacher(subject.getTeacher())
                .schedule(subject.getSchedule())
                .credits(subject.getCredits())
                .build();
        return subjectRepository.save(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Subject> getSubjectsByUser(Long userId) {
        return subjectRepository.findByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Subject getSubjectById(Long userId, Long subjectId) {
        return requireOwnedSubject(userId, subjectId);
    }

    @Override
    @Transactional
    public void deleteSubject(Long userId, Long subjectId) {
        requireOwnedSubject(userId, subjectId);
        subjectRepository.deleteById(subjectId);
    }

    @Override
    @Transactional
    public Evaluation addEvaluation(Long userId, Long subjectId, Evaluation evaluation) {
        SubjectEntity subject = requireOwnedSubjectEntity(userId, subjectId);
        validateEvaluation(evaluation);
        EvaluationEntity entity = EvaluationEntity.builder()
                .subject(subject)
                .name(evaluation.getName().trim())
                .grade(toDecimal(evaluation.getGrade()))
                .percentage(BigDecimal.valueOf(evaluation.getPercentage()))
                .evaluationDate(evaluation.getEvaluationDate())
                .build();
        return subjectMapper.toDomain(evaluationJpaRepository.save(entity));
    }

    @Override
    @Transactional
    public Evaluation updateEvaluation(Long userId, Long subjectId, Long evaluationId, Evaluation evaluation) {
        SubjectEntity subject = requireOwnedSubjectEntity(userId, subjectId);
        validateEvaluation(evaluation);
        EvaluationEntity entity = evaluationJpaRepository.findById(evaluationId)
                .filter(existing -> subjectId.equals(existing.getSubject().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        entity.setSubject(subject);
        entity.setName(evaluation.getName().trim());
        entity.setGrade(toDecimal(evaluation.getGrade()));
        entity.setPercentage(BigDecimal.valueOf(evaluation.getPercentage()));
        entity.setEvaluationDate(evaluation.getEvaluationDate());
        return subjectMapper.toDomain(evaluationJpaRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Evaluation> getEvaluationsBySubject(Long userId, Long subjectId) {
        requireOwnedSubjectEntity(userId, subjectId);
        return evaluationJpaRepository.findBySubjectId(subjectId).stream()
                .map(subjectMapper::toDomain)
                .toList();
    }

    @Override
    @Transactional
    public void deleteEvaluation(Long userId, Long subjectId, Long evaluationId) {
        requireOwnedSubjectEntity(userId, subjectId);
        EvaluationEntity evaluation = evaluationJpaRepository.findById(evaluationId)
                .filter(existing -> subjectId.equals(existing.getSubject().getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation not found"));
        evaluationJpaRepository.delete(evaluation);
    }

    @Override
    @Transactional(readOnly = true)
    public double calculateAverage(Long userId, Long subjectId) {
        return requireOwnedSubject(userId, subjectId).calculateCurrentAverage();
    }

    @Override
    @Transactional
    public SubjectNoteEntity createNote(Long userId, Long subjectId, String title, String content) {
        requireOwnedSubjectEntity(userId, subjectId);
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Note content is required");
        }
        return subjectNoteJpaRepository.save(SubjectNoteEntity.builder()
                .subjectId(subjectId)
                .title(title)
                .content(content.trim())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectNoteEntity> getNotesBySubject(Long userId, Long subjectId) {
        requireOwnedSubjectEntity(userId, subjectId);
        return subjectNoteJpaRepository.findBySubjectIdOrderByCreatedAtDesc(subjectId);
    }

    @Override
    @Transactional
    public void deleteNote(Long userId, Long noteId) {
        SubjectNoteEntity note = subjectNoteJpaRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        requireOwnedSubject(userId, note.getSubjectId());
        subjectNoteJpaRepository.delete(note);
    }

    private Subject requireOwnedSubject(Long userId, Long subjectId) {
        return subjectRepository.findById(subjectId)
                .filter(subject -> userId.equals(subject.getUserId()))
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
    }

    private SubjectEntity requireSubjectEntity(Long subjectId) {
        return subjectJpaRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
    }

    private SubjectEntity requireOwnedSubjectEntity(Long userId, Long subjectId) {
        requireOwnedSubject(userId, subjectId);
        return requireSubjectEntity(subjectId);
    }

    private void validateSubject(Subject subject) {
        if (subject.getName() == null || subject.getName().isBlank()) {
            throw new IllegalArgumentException("Subject name is required");
        }
        if (subject.getCredits() <= 0) {
            throw new IllegalArgumentException("Subject credits must be greater than zero");
        }
    }

    private void validateEvaluation(Evaluation evaluation) {
        if (evaluation.getName() == null || evaluation.getName().isBlank()) {
            throw new IllegalArgumentException("Evaluation name is required");
        }
        if (evaluation.getPercentage() <= 0 || evaluation.getPercentage() > 100) {
            throw new IllegalArgumentException("Evaluation percentage must be between 0 and 100");
        }
        if (evaluation.getGrade() != null && (evaluation.getGrade() < 0 || evaluation.getGrade() > 5)) {
            throw new IllegalArgumentException("Evaluation grade must be between 0 and 5");
        }
    }

    private BigDecimal toDecimal(Double value) {
        return value == null ? null : BigDecimal.valueOf(value);
    }
}