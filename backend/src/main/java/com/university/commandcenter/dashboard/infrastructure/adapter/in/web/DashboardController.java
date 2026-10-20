package com.university.commandcenter.dashboard.infrastructure.adapter.in.web;

import com.university.commandcenter.dashboard.application.port.in.GetDaySummaryUseCase;
import com.university.commandcenter.dashboard.domain.DaySummary;
import com.university.commandcenter.infrastructure.security.CurrentUserService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Validated
public class DashboardController {

    private final GetDaySummaryUseCase getDaySummaryUseCase;
    private final CurrentUserService currentUserService;

    @GetMapping("/day")
    public DaySummary getDaySummary(@RequestParam(defaultValue = "60") @Positive int dailyGoalMinutes) {
        return getDaySummaryUseCase.getSummary(currentUserService.getCurrentUserId(), dailyGoalMinutes);
    }
}