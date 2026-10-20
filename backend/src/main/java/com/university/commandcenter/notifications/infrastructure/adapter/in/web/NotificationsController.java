package com.university.commandcenter.notifications.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.kanban.application.port.in.ManageTaskUseCase;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.pomodoro.application.port.in.ManagePomodoroUseCase;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.statistics.application.port.in.ManageGoalsUseCase;
import com.university.commandcenter.statistics.application.port.in.StatisticsUseCase;
import com.university.commandcenter.subject.application.port.in.ManageSubjectUseCase;
import com.university.commandcenter.subject.domain.Evaluation;
import com.university.commandcenter.subject.domain.Subject;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Validated
public class NotificationsController {

    private final CurrentUserService currentUserService;
    private final ManageTaskUseCase taskUseCase;
    private final ManagePomodoroUseCase pomodoroUseCase;
    private final StudySessionRepositoryPort studySessionRepository;
    private final ManageGoalsUseCase goalsUseCase;
    private final StatisticsUseCase statisticsUseCase;
    private final ManageSubjectUseCase subjectUseCase;

    @GetMapping
    public List<Notification> getNotifications(
            @RequestParam(defaultValue = "60") @Positive int dailyGoalMinutes) {
        Long userId = currentUserService.getCurrentUserId();
        LocalDateTime now = LocalDateTime.now();
        List<Notification> notifications = new ArrayList<>();

        for (Task task : taskUseCase.getTasksBySubjects(userId)) {
            if ("DONE".equals(task.getCurrentStateName()) || task.getDueDate() == null) {
                continue;
            }
            long hoursUntilDue = ChronoUnit.HOURS.between(now, task.getDueDate());
            if (task.getDueDate().isBefore(now) || hoursUntilDue <= 72) {
                notifications.add(new Notification(
                        "TASK_" + task.getId(),
                        "DELIVERY_REMINDER",
                        task.getDueDate().isBefore(now) ? "Delivery overdue" : "Upcoming delivery",
                        task.getTitle(),
                        task.getDueDate(),
                        task.getDueDate().isBefore(now) || hoursUntilDue <= 24 ? "HIGH" : "MEDIUM"));
            }
        }

        for (Subject subject : subjectUseCase.getSubjectsByUser(userId)) {
            for (Evaluation evaluation : subject.getEvaluations()) {
                LocalDateTime evaluationDate = evaluation.getEvaluationDate();
                if (evaluationDate == null || evaluation.getGrade() != null) {
                    continue;
                }
                long hoursUntilDue = ChronoUnit.HOURS.between(now, evaluationDate);
                if (evaluationDate.isBefore(now) || hoursUntilDue <= 72) {
                    notifications.add(new Notification(
                            "EVALUATION_" + evaluation.getId(),
                            "EVALUATION_REMINDER",
                            evaluationDate.isBefore(now) ? "Evaluation overdue" : "Upcoming evaluation",
                            evaluation.getName() + " — " + subject.getName(),
                            evaluationDate,
                            evaluationDate.isBefore(now) || hoursUntilDue <= 24 ? "HIGH" : "MEDIUM"));
                }
            }
        }

        int studiedToday = studySessionRepository.getStudiedMinutesToday(userId);
        if (studiedToday == 0) {
            notifications.add(new Notification(
                    "STUDY_REMINDER",
                    "STUDY_REMINDER",
                    "Start a study session",
                    "You have not recorded any study time today.",
                    null,
                    "MEDIUM"));
        }
        int streak = pomodoroUseCase.calculateCurrentStreak(userId, dailyGoalMinutes);
        if (streak > 0 && studiedToday < dailyGoalMinutes && now.getHour() >= 18) {
            notifications.add(new Notification(
                    "STREAK_AT_RISK",
                    "STREAK_AT_RISK",
                    "Protect your study streak",
                    "Study " + (dailyGoalMinutes - studiedToday) + " more minutes today to keep your streak.",
                    null,
                    "HIGH"));
        }

        var goal = goalsUseCase.getGoal(userId);
        var summary = statisticsUseCase.getSummary(userId);
        if (summary.totalStudiedMinutesThisWeek() < goal.getTargetWeeklyMinutes()
                && now.getDayOfWeek() == java.time.DayOfWeek.SUNDAY
                && now.getHour() >= 12) {
            notifications.add(new Notification(
                    "WEEKLY_GOAL_AT_RISK",
                    "GOAL_AT_RISK",
                    "Weekly study goal at risk",
                    "Your weekly study target is not complete yet.",
                    null,
                    "HIGH"));
        }

        return notifications.stream()
                .sorted(Comparator.comparing(Notification::priority)
                        .thenComparing(Notification::dueAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    public record Notification(
            String id,
            String type,
            String title,
            String message,
            LocalDateTime dueAt,
            String priority) {}
}