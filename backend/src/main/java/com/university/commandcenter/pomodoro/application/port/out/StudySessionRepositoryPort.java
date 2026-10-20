package com.university.commandcenter.pomodoro.application.port.out;

import com.university.commandcenter.pomodoro.domain.StudySession;

import java.time.LocalDate;
import java.util.List;
import java.time.LocalDateTime;

public interface StudySessionRepositoryPort {
    StudySession save(StudySession session);
    
    List<LocalDate> getDaysWithGoalMet(Long userId, int dailyGoalMinutes);

    List<StudySession> findBySubjectIdIn(List<Long> subjectIds);

    List<StudySession> findBySubjectId(Long subjectId);

    List<StudySession> findByUserIdAndSessionDateBetween(
            Long userId, LocalDateTime startDate, LocalDateTime endDate);

    List<StudySession> findByUserId(Long userId);

    int getStudiedMinutesToday(Long userId);

    int getTotalStudiedMinutes(Long userId);
}
