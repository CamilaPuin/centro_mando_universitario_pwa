package com.university.commandcenter.statistics.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.statistics.application.port.in.ManageGoalsUseCase;
import com.university.commandcenter.statistics.application.port.in.StatisticsUseCase;
import com.university.commandcenter.statistics.domain.StudyGoal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsUseCase statisticsUseCase;
    private final ManageGoalsUseCase manageGoalsUseCase;
    private final CurrentUserService currentUserService;

    @GetMapping
    public StatisticsUseCase.StatisticsSummary getSummary() {
        return statisticsUseCase.getSummary(currentUserService.getCurrentUserId());
    }

    @GetMapping("/history")
    public StatisticsUseCase.StudyHistory getHistory() {
        return statisticsUseCase.getHistory(currentUserService.getCurrentUserId());
    }

    @GetMapping("/weekly")
    public StatisticsUseCase.WeeklySummaryReport getWeeklySummary() {
        return statisticsUseCase.getWeeklySummary(currentUserService.getCurrentUserId());
    }

    @GetMapping("/goals")
    public StudyGoal getGoal() {
        return manageGoalsUseCase.getGoal(currentUserService.getCurrentUserId());
    }

    @PutMapping("/goals")
    public StudyGoal saveGoal(@Valid @RequestBody GoalRequest request) {
        return manageGoalsUseCase.saveGoal(
                currentUserService.getCurrentUserId(),
                request.targetWeeklyMinutes(),
                request.targetAverageGrade());
    }

    public record GoalRequest(
            @Positive int targetWeeklyMinutes,
            @DecimalMin("0.0") @DecimalMax("5.0") double targetAverageGrade) {}
}