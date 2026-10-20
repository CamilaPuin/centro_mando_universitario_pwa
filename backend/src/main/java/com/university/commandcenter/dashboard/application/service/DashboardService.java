package com.university.commandcenter.dashboard.application.service;

import com.university.commandcenter.dashboard.application.port.in.GetDaySummaryUseCase;
import com.university.commandcenter.dashboard.application.port.out.DashboardMetricsPort;
import com.university.commandcenter.dashboard.domain.StudyProgress;
import com.university.commandcenter.dashboard.domain.DaySummary;
import com.university.commandcenter.pomodoro.application.port.in.ManagePomodoroUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardService implements GetDaySummaryUseCase {

    private final ManagePomodoroUseCase managePomodoroUseCase;
    private final DashboardMetricsPort dashboardMetricsPort;

    @Override
    public DaySummary getSummary(Long userId, int dailyGoalMinutes) {
        if (dailyGoalMinutes <= 0) {
            throw new IllegalArgumentException("Daily study target must be greater than zero");
        }
        int streak = managePomodoroUseCase.calculateCurrentStreak(userId, dailyGoalMinutes);
        int minutesToday = dashboardMetricsPort.getStudiedMinutesToday(userId);

        StudyProgress progress = StudyProgress.builder()
                .dailyGoalMinutes(dailyGoalMinutes)
                .studiedMinutesToday(minutesToday)
                .build();

        return DaySummary.builder()
                .currentStreakDays(streak)
                .studyProgress(progress)
                .dailyClasses(dashboardMetricsPort.getDailyClasses(userId))
                .urgentDeliveries(dashboardMetricsPort.getUrgentDeliveries(userId))
                .build();
    }
}
