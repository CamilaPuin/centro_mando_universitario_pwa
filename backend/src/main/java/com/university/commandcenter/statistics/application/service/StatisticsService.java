package com.university.commandcenter.statistics.application.service;

import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.pomodoro.domain.StudySession;
import com.university.commandcenter.statistics.application.port.in.ManageGoalsUseCase;
import com.university.commandcenter.statistics.application.port.in.StatisticsUseCase;
import com.university.commandcenter.statistics.domain.StudyGoal;
import com.university.commandcenter.statistics.infrastructure.adapter.out.persistence.UserGoalJpaRepository;
import com.university.commandcenter.statistics.infrastructure.adapter.out.persistence.entity.UserGoalEntity;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StatisticsService implements ManageGoalsUseCase, StatisticsUseCase {

    private static final int DEFAULT_WEEKLY_MINUTES = 300;
    private static final double DEFAULT_TARGET_GRADE = 3.0;

    private final UserGoalJpaRepository goalRepository;
    private final StudySessionRepositoryPort studySessionRepository;
    private final SubjectRepositoryPort subjectRepository;
    private final TaskRepositoryPort taskRepository;

    @Override
    @Transactional(readOnly = true)
    public StudyGoal getGoal(Long userId) {
        return goalRepository.findByUserId(userId)
                .map(this::toDomain)
                .orElseGet(() -> StudyGoal.builder()
                        .userId(userId)
                        .targetWeeklyMinutes(DEFAULT_WEEKLY_MINUTES)
                        .targetAverageGrade(DEFAULT_TARGET_GRADE)
                        .build());
    }

    @Override
    @Transactional
    public StudyGoal saveGoal(Long userId, int targetWeeklyMinutes, double targetAverageGrade) {
        if (targetWeeklyMinutes <= 0) {
            throw new IllegalArgumentException("Weekly study target must be greater than zero");
        }
        if (targetAverageGrade < 0 || targetAverageGrade > 5) {
            throw new IllegalArgumentException("Target average grade must be between 0 and 5");
        }
        UserGoalEntity entity = goalRepository.findByUserId(userId)
                .orElseGet(() -> UserGoalEntity.builder().userId(userId).build());
        entity.setTargetWeeklyMinutes(targetWeeklyMinutes);
        entity.setTargetGpa(BigDecimal.valueOf(targetAverageGrade));
        return toDomain(goalRepository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public StatisticsSummary getSummary(Long userId) {
        LocalDate startOfWeek = startOfWeek(LocalDate.now());
        List<StudySession> sessions = studySessionRepository.findByUserIdAndSessionDateBetween(
                userId, startOfWeek.atStartOfDay(), LocalDateTime.now());
        int minutes = sessions.stream().mapToInt(StudySession::getDurationMinutes).sum();
        StudyGoal goal = getGoal(userId);
        double completion = Math.min(100.0, percentage(minutes, goal.getTargetWeeklyMinutes()));
        double gpa = calculateOverallGpa(subjectRepository.findByUserId(userId));
        return new StatisticsSummary(
                userId,
                minutes,
                goal.getTargetWeeklyMinutes(),
                completion,
                gpa,
                goal.getTargetAverageGrade(),
                goal.getTargetAverageGrade() == 0
                        ? 100.0
                        : Math.min(100.0, gpa * 100.0 / goal.getTargetAverageGrade()),
                sessions.size());
    }

    @Override
    @Transactional(readOnly = true)
    public StudyHistory getHistory(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate start = startOfWeek(today).minusDays(7);
        LocalDateTime now = LocalDateTime.now();
        List<StudySession> sessions = studySessionRepository.findByUserIdAndSessionDateBetween(
                userId, start.atStartOfDay(), now);
        Map<LocalDate, Integer> minutesByDay = new LinkedHashMap<>();
        for (StudySession session : sessions) {
            LocalDate date = session.getSessionDate().toLocalDate();
            minutesByDay.merge(date, session.getDurationMinutes(), Integer::sum);
        }

        List<DailyStudyTime> last7Days = java.util.stream.IntStream.rangeClosed(0, 6)
                .mapToObj(daysAgo -> today.minusDays(6L - daysAgo))
                .map(date -> new DailyStudyTime(
                        date,
                        date.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH),
                        minutesByDay.getOrDefault(date, 0)))
                .toList();
        LocalDate startOfWeek = startOfWeek(today);
        int currentWeekMinutes = minutesBetween(sessions, startOfWeek, today.plusDays(1));
        int previousWeekMinutes = minutesBetween(sessions, startOfWeek.minusDays(7), startOfWeek);

        Map<Long, String> subjectNames = subjectRepository.findByUserId(userId).stream()
                .collect(java.util.stream.Collectors.toMap(Subject::getId, Subject::getName));
        Map<String, Integer> minutesBySubject = new LinkedHashMap<>();
        for (StudySession session : sessions) {
            if (session.getSubjectId() != null) {
                String name = subjectNames.get(session.getSubjectId());
                if (name != null) {
                    minutesBySubject.merge(name, session.getDurationMinutes(), Integer::sum);
                }
            }
        }

        return new StudyHistory(
                last7Days,
                minutesBySubject,
                currentWeekMinutes,
                previousWeekMinutes,
                previousWeekMinutes == 0
                        ? (currentWeekMinutes == 0 ? 0.0 : 100.0)
                        : ((currentWeekMinutes - previousWeekMinutes) * 100.0 / previousWeekMinutes));
    }

    @Override
    @Transactional(readOnly = true)
    public WeeklySummaryReport getWeeklySummary(Long userId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = startOfWeek(today);
        LocalDateTime now = LocalDateTime.now();
        List<Subject> subjects = subjectRepository.findByUserId(userId);
        List<Long> subjectIds = subjects.stream().map(Subject::getId).toList();
        List<StudySession> sessions = studySessionRepository.findByUserIdAndSessionDateBetween(
                userId, startOfWeek.atStartOfDay(), now);
        int totalMinutes = sessions.stream().mapToInt(StudySession::getDurationMinutes).sum();
        List<Task> completedTasks = taskRepository.findBySubjectIdInAndStatusAndCompletedAtAfter(
                        subjectIds, "DONE", startOfWeek.atStartOfDay())
                .stream()
                .filter(task -> task.getCompletedAt() != null && !task.getCompletedAt().isAfter(now))
                .toList();
        Map<Long, String> subjectNames = subjects.stream()
                .collect(java.util.stream.Collectors.toMap(Subject::getId, Subject::getName));
        Map<String, Integer> minutesBySubject = new LinkedHashMap<>();
        subjects.forEach(subject -> minutesBySubject.putIfAbsent(subject.getName(), 0));
        for (StudySession session : sessions) {
            if (session.getSubjectId() != null && subjectNames.containsKey(session.getSubjectId())) {
                minutesBySubject.merge(
                        subjectNames.get(session.getSubjectId()), session.getDurationMinutes(), Integer::sum);
            }
        }
        String mostStudied = minutesBySubject.entrySet().stream()
                .max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        String leastStudied = minutesBySubject.entrySet().stream()
                .min(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        StudyGoal goal = getGoal(userId);
        double completionRate = percentage(totalMinutes, goal.getTargetWeeklyMinutes());
        String feedback = completionRate >= 100
                ? "You met your weekly study target."
                : "You studied " + Math.round(completionRate) + "% of your weekly target.";
        String recommendation = completionRate >= 100
                ? "Keep your current pace and review upcoming evaluations."
                : "Schedule shorter, consistent study sessions to reach your weekly target.";

        return new WeeklySummaryReport(
                userId,
                startOfWeek + " to " + today,
                totalMinutes,
                goal.getTargetWeeklyMinutes(),
                completionRate,
                completedTasks.size(),
                calculateOverallGpa(subjects),
                mostStudied,
                leastStudied,
                feedback,
                recommendation);
    }

    private StudyGoal toDomain(UserGoalEntity entity) {
        return StudyGoal.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .targetWeeklyMinutes(entity.getTargetWeeklyMinutes())
                .targetAverageGrade(entity.getTargetGpa().doubleValue())
                .build();
    }

    private LocalDate startOfWeek(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private int minutesBetween(List<StudySession> sessions, LocalDate start, LocalDate endExclusive) {
        return sessions.stream()
                .filter(session -> !session.getSessionDate().toLocalDate().isBefore(start)
                        && session.getSessionDate().toLocalDate().isBefore(endExclusive))
                .mapToInt(StudySession::getDurationMinutes)
                .sum();
    }

    private double percentage(int actual, int target) {
        return target == 0 ? 0.0 : actual * 100.0 / target;
    }

    private double calculateOverallGpa(List<Subject> subjects) {
        double weightedTotal = 0.0;
        int totalCredits = 0;
        for (Subject subject : subjects) {
            double average = subject.calculateCurrentAverage();
            if (average > 0 && subject.getCredits() > 0) {
                weightedTotal += average * subject.getCredits();
                totalCredits += subject.getCredits();
            }
        }
        return totalCredits == 0 ? 0.0 : weightedTotal / totalCredits;
    }
}