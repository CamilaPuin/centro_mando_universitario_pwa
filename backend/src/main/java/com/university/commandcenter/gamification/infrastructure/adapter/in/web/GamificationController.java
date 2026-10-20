package com.university.commandcenter.gamification.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.AuthenticatedUser;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.kanban.infrastructure.adapter.out.persistence.TaskJpaAdapter;
import com.university.commandcenter.pomodoro.application.port.in.ManagePomodoroUseCase;
import com.university.commandcenter.pomodoro.infrastructure.adapter.out.persistence.StudySessionEntity;
import com.university.commandcenter.pomodoro.infrastructure.adapter.out.persistence.StudySessionJpaRepository;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.SubjectJpaAdapter;
import com.university.commandcenter.user.application.port.out.UserRepositoryPort;
import com.university.commandcenter.user.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/gamification")
@RequiredArgsConstructor
@Tag(name = "Gamification", description = "Gamification system: streaks, badges, levels, and motivation")
public class GamificationController {

    private final UserRepositoryPort userRepositoryPort;
    private final SubjectJpaAdapter subjectJpaAdapter;
    private final TaskJpaAdapter taskJpaAdapter;
    private final StudySessionJpaRepository studySessionJpaRepository;
    private final ManagePomodoroUseCase managePomodoroUseCase;

    @GetMapping("/profile")
    @Operation(summary = "Get gamification profile", description = "Returns student current level, experience points, streak days, and unlocked badges dynamically calculated from activity.")
    public ResponseEntity<GamificationProfileResponse> getProfile() {
        String username = AuthenticatedUser.getCurrentUsername();
        User user = userRepositoryPort.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + username));
        Long userId = user.getId();

        List<Subject> subjects = subjectJpaAdapter.getSubjectsByUserId(userId);
        List<Long> subjectIds = subjects.stream().map(Subject::getId).collect(Collectors.toList());

        int totalMinutes = studySessionJpaRepository.getTotalStudiedMinutes(userId);
        List<StudySessionEntity> sessions = studySessionJpaRepository.findByUserIdOrderBySessionDateDesc(userId);
        int sessionCount = sessions.size();

        List<Task> doneTasks = subjectIds.isEmpty() ? List.of()
                : taskJpaAdapter.findBySubjectIdInAndStatus(subjectIds, "DONE");
        int tasksDoneCount = doneTasks.size();

        int streak = managePomodoroUseCase.calculateCurrentStreak(userId, 60);
        int longestStreak = calculateLongestStreak(sessions, 60);

        double gpa = calculateOverallGpa(subjects);
        
        int xp = (totalMinutes * 10) + (tasksDoneCount * 50);
        int level = 1 + (xp / 500);
        int xpForNextLevel = level * 500;
        int currentLevelProgressXp = xp % 500;

        List<Badge> badges = new ArrayList<>();
        badges.add(new Badge(
                "FIRST_POMODORO",
                "Primeros Pasos",
                "Completa tu primera sesión de estudio en el cronómetro",
                sessionCount >= 1 ? "UNLOCKED" : "LOCKED",
                Math.min(sessionCount, 1),
                1
        ));

        badges.add(new Badge(
                "STREAK_3_DAYS",
                "Constancia de Bronce",
                "Mantén una racha de 3 días seguidos de estudio",
                longestStreak >= 3 ? "UNLOCKED" : "LOCKED",
                Math.min(longestStreak, 3),
                3
        ));

        badges.add(new Badge(
                "STREAK_7_DAYS",
                "Hábito de Hierro",
                "Alcanza 7 días ininterrumpidos de estudio",
                longestStreak >= 7 ? "UNLOCKED" : "LOCKED",
                Math.min(longestStreak, 7),
                7
        ));

        badges.add(new Badge(
                "CENTURION",
                "Centurión del Enfoque",
                "Acumula 100 minutos o más de estudio consciente",
                totalMinutes >= 100 ? "UNLOCKED" : "LOCKED",
                Math.min(totalMinutes, 100),
                100
        ));

        badges.add(new Badge(
                "TASK_CRUSHER",
                "Dominador de Entregas",
                "Completa con éxito al menos 5 tareas en el tablero",
                tasksDoneCount >= 5 ? "UNLOCKED" : "LOCKED",
                Math.min(tasksDoneCount, 5),
                5
        ));

        badges.add(new Badge(
                "GPA_MASTER",
                "Excelencia Académica",
                "Mantén un promedio general ponderado de 4.0 o superior",
                gpa >= 4.0 ? "UNLOCKED" : "LOCKED",
                (int) Math.round(gpa * 10),
                40
        ));

        badges.add(new Badge(
                "ORGANIZED_STUDENT",
                "Semestre en Orden",
                "Registra 3 o más asignaturas en tu centro de mando",
                subjects.size() >= 3 ? "UNLOCKED" : "LOCKED",
                Math.min(subjects.size(), 3),
                3
        ));

        GamificationProfileResponse profile = new GamificationProfileResponse(
                userId,
                level,
                xp,
                currentLevelProgressXp,
                xpForNextLevel,
                streak,
                totalMinutes,
                tasksDoneCount,
                badges
        );

        return ResponseEntity.ok(profile);
    }

    private double calculateOverallGpa(List<Subject> subjects) {
        if (subjects.isEmpty()) return 0.0;
        double totalWeightedGrade = 0.0;
        int totalCredits = 0;

        for (Subject s : subjects) {
            double avg = s.calculateCurrentAverage();
            if (avg > 0) {
                totalWeightedGrade += (avg * s.getCredits());
                totalCredits += s.getCredits();
            }
        }

        return totalCredits > 0 ? (totalWeightedGrade / totalCredits) : 0.0;
    }

    private int calculateLongestStreak(List<StudySessionEntity> sessions, int dailyGoalMinutes) {
        Map<LocalDate, Integer> minutesByDay = new HashMap<>();
        for (StudySessionEntity session : sessions) {
            minutesByDay.merge(
                    session.getSessionDate().toLocalDate(),
                    session.getDurationMinutes(),
                    Integer::sum);
        }
        List<LocalDate> qualifyingDays = minutesByDay.entrySet().stream()
                .filter(entry -> entry.getValue() >= dailyGoalMinutes)
                .map(Map.Entry::getKey)
                .sorted()
                .toList();
        int longest = 0;
        int current = 0;
        LocalDate previousDay = null;
        for (LocalDate day : qualifyingDays) {
            current = previousDay != null && day.equals(previousDay.plusDays(1)) ? current + 1 : 1;
            longest = Math.max(longest, current);
            previousDay = day;
        }
        return longest;
    }

    public record GamificationProfileResponse(
            Long userId,
            int level,
            int totalXp,
            int currentLevelXp,
            int xpForNextLevel,
            int currentStreakDays,
            int totalStudiedMinutes,
            int tasksCompleted,
            List<Badge> badges
    ) {}

    public record Badge(
            String code,
            String name,
            String description,
            String status,
            int currentProgress,
            int targetProgress
    ) {}
}
