package com.university.commandcenter.pomodoro.infrastructure.adapter.out.persistence;

import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.pomodoro.domain.StudySession;
import com.university.commandcenter.pomodoro.domain.CycleType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class StudySessionJpaAdapter implements StudySessionRepositoryPort {

    private final StudySessionJpaRepository jpaRepository;

    @Override
    public StudySession save(StudySession session) {
        StudySessionEntity entity = StudySessionEntity.builder()
                .userId(session.getUserId())
                .subjectId(session.getSubjectId())
                .sessionDate(session.getSessionDate())
                .durationMinutes(session.getDurationMinutes())
                .cycleType(session.getCycleType() != null ? session.getCycleType().name() : null)
                .build();

        StudySessionEntity saved = jpaRepository.save(entity);

        return StudySession.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .subjectId(saved.getSubjectId())
                .sessionDate(saved.getSessionDate())
                .durationMinutes(saved.getDurationMinutes())
                .cycleType(saved.getCycleType() != null ? CycleType.valueOf(saved.getCycleType()) : null)
                .build();
    }

    @Override
    public List<LocalDate> getDaysWithGoalMet(Long userId, int dailyGoalMinutes) {
        return jpaRepository.findDaysWithGoalMet(userId, dailyGoalMinutes)
                .stream()
                .map(java.sql.Date::toLocalDate)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudySession> findBySubjectIdIn(List<Long> subjectIds) {
        if (subjectIds == null || subjectIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findBySubjectIdInOrderBySessionDateDesc(subjectIds).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudySession> findBySubjectId(Long subjectId) {
        return jpaRepository.findBySubjectIdOrderBySessionDateDesc(subjectId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudySession> findByUserIdAndSessionDateBetween(
            Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return jpaRepository.findByUserIdAndSessionDateBetweenOrderBySessionDateAsc(userId, startDate, endDate)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudySession> findByUserId(Long userId) {
        return jpaRepository.findByUserIdOrderBySessionDateDesc(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public int getStudiedMinutesToday(Long userId) {
        LocalDate today = LocalDate.now();
        return jpaRepository.getStudiedMinutesBetween(
                userId, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
    }

    @Override
    public int getTotalStudiedMinutes(Long userId) {
        return jpaRepository.getTotalStudiedMinutes(userId);
    }

    private StudySession toDomain(StudySessionEntity saved) {
        CycleType cycleType = null;
        if (saved.getCycleType() != null) {
            try {
                cycleType = CycleType.valueOf(saved.getCycleType());
            } catch (IllegalArgumentException exception) {
                throw new IllegalStateException("Unsupported study cycle type: " + saved.getCycleType(), exception);
            }
        }
        return StudySession.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .subjectId(saved.getSubjectId())
                .sessionDate(saved.getSessionDate())
                .durationMinutes(saved.getDurationMinutes())
                .cycleType(cycleType)
                .build();
    }
}
