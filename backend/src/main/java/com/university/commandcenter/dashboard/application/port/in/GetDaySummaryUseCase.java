package com.university.commandcenter.dashboard.application.port.in;

import com.university.commandcenter.dashboard.domain.DaySummary;

public interface GetDaySummaryUseCase {
    DaySummary getSummary(Long userId, int dailyGoalMinutes);
}
