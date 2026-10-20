package com.university.commandcenter.pomodoro.application.service;

import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.pomodoro.application.port.in.ManagePomodoroUseCase;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.pomodoro.domain.StudySession;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PomodoroService implements ManagePomodoroUseCase {

    private final StudySessionRepositoryPort repositoryPort;
    private final SubjectRepositoryPort subjectRepository;
    private final TaskRepositoryPort taskRepository;

    @Override
    @Transactional
    public StudySession registerSession(Long userId, StudySession session) {
        if (!session.isValid()) {
            throw new IllegalArgumentException("Study session is invalid (future dates or zero duration).");
        }
        if (session.getSubjectId() != null) {
            subjectRepository.findById(session.getSubjectId())
                    .filter(value -> userId.equals(value.getUserId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        }
        StudySession sessionToSave = StudySession.builder()
                .userId(userId)
                .subjectId(session.getSubjectId())
                .sessionDate(session.getSessionDate())
                .durationMinutes(session.getDurationMinutes())
                .cycleType(session.getCycleType())
                .build();
        return repositoryPort.save(sessionToSave);
    }

    @Override
    public int calculateCurrentStreak(Long userId, int dailyGoalMinutes) {
        if (dailyGoalMinutes <= 0) {
            throw new IllegalArgumentException("Daily study target must be greater than zero");
        }
        List<LocalDate> daysMet = repositoryPort.getDaysWithGoalMet(userId, dailyGoalMinutes);
        
        if (daysMet.isEmpty()) {
            return 0;
        }

        Set<LocalDate> studyDays = new HashSet<>(daysMet);
        int streak = 0;
        LocalDate dayToCheck = LocalDate.now();

        if (studyDays.contains(dayToCheck)) {
            streak++;
            dayToCheck = dayToCheck.minusDays(1);
        } else if (studyDays.contains(dayToCheck.minusDays(1))) {
            dayToCheck = dayToCheck.minusDays(1);
        } else {
            return 0;
        }

        while (studyDays.contains(dayToCheck)) {
            streak++;
            dayToCheck = dayToCheck.minusDays(1);
        }

        return streak;
    }

    @Override
    public List<StudySession> getSessionsByUser(Long userId) {
        return repositoryPort.findByUserId(userId);
    }

    @Override
    public FocusModeInfo getFocusModeInfo(Long userId, Long subjectId) {
        List<Subject> subjects = subjectRepository.findByUserId(userId);
        Subject targetSubject = null;
        if (subjectId != null) {
            targetSubject = subjects.stream()
                    .filter(s -> s.getId().equals(subjectId))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        } else if (!subjects.isEmpty()) {
            targetSubject = subjects.get(0);
        }

        int studiedToday = repositoryPort.getStudiedMinutesToday(userId);
        int streak = calculateCurrentStreak(userId, 60);

        List<String> pendingTasks = List.of();
        if (targetSubject != null) {
            pendingTasks = taskRepository.findBySubjectId(targetSubject.getId()).stream()
                    .filter(t -> !"DONE".equalsIgnoreCase(t.getCurrentStateName()))
                    .map(Task::getTitle)
                    .limit(5)
                    .collect(Collectors.toList());
        }

        String quote = getMotivationalQuote(studiedToday);

        return new FocusModeInfo(
                targetSubject != null ? targetSubject.getId() : null,
                targetSubject != null ? targetSubject.getName() : "Enfoque Libre",
                studiedToday,
                streak,
                quote,
                pendingTasks
        );
    }

    private String getMotivationalQuote(int minutesToday) {
        if (minutesToday == 0) {
            return "El éxito es la suma de pequeños esfuerzos repetidos día tras día. ¡Inicia tu primera sesión!";
        } else if (minutesToday < 60) {
            return "¡Gran inicio! La constancia vence al talento cuando el talento no se esfuerza.";
        } else {
            return "¡Excelente progreso hoy! Mantén el ritmo y la concentración.";
        }
    }
}
