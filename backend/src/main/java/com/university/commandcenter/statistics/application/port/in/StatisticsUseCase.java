package com.university.commandcenter.statistics.application.port.in;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface StatisticsUseCase {

    StatisticsSummary getSummary(Long userId);

    StudyHistory getHistory(Long userId);

    WeeklySummaryReport getWeeklySummary(Long userId);

    record StatisticsSummary(
            Long userId,
            int totalStudiedMinutesThisWeek,
            int targetWeeklyMinutes,
            double goalCompletionPercentage,
            int totalStudySessionsCompleted
    ) {}

    record StudyHistory(
            List<DailyStudyTime> last7Days,
            Map<String, Integer> minutesBySubject,
            int currentWeekMinutes,
            int previousWeekMinutes,
            double weekOverWeekChangePercent
    ) {}

    record DailyStudyTime(
            LocalDate date,
            String dayOfWeek,
            int minutes
    ) {}

    record WeeklySummaryReport(
            Long userId,
            String weekRange,
            int totalMinutesStudied,
            int targetMinutes,
            double goalCompletionRate,
            int tasksCompletedThisWeek,
            String mostStudiedSubject,
            String leastStudiedSubject,
            String selfEvaluationFeedback,
            String recommendation
    ) {}
}
