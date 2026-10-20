package com.university.commandcenter.pomodoro.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.pomodoro.application.port.in.ManagePomodoroUseCase;
import com.university.commandcenter.pomodoro.domain.CycleType;
import com.university.commandcenter.pomodoro.domain.StudySession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/study")
@RequiredArgsConstructor
@Validated
public class PomodoroController {

    private final ManagePomodoroUseCase pomodoroUseCase;
    private final CurrentUserService currentUserService;

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public StudySession registerSession(@Valid @RequestBody StudySessionRequest request) {
        StudySession session = StudySession.builder()
                .subjectId(request.subjectId())
                .sessionDate(request.sessionDate() == null ? LocalDateTime.now() : request.sessionDate())
                .durationMinutes(request.durationMinutes())
                .cycleType(request.cycleType() == null ? CycleType.FREE_SESSION : request.cycleType())
                .build();
        return pomodoroUseCase.registerSession(currentUserService.getCurrentUserId(), session);
    }

    @GetMapping("/sessions")
    public List<StudySession> getSessions() {
        return pomodoroUseCase.getSessionsByUser(currentUserService.getCurrentUserId());
    }

    @GetMapping("/focus")
    public ManagePomodoroUseCase.FocusModeInfo getFocusMode(
            @RequestParam(required = false) Long subjectId) {
        return pomodoroUseCase.getFocusModeInfo(currentUserService.getCurrentUserId(), subjectId);
    }

    @GetMapping("/streak")
    public StreakResponse getStreak(@RequestParam(defaultValue = "60") @Positive int dailyGoalMinutes) {
        return new StreakResponse(pomodoroUseCase.calculateCurrentStreak(
                currentUserService.getCurrentUserId(), dailyGoalMinutes));
    }

    public record StudySessionRequest(
            Long subjectId,
            @NotNull @Positive Integer durationMinutes,
            CycleType cycleType,
            LocalDateTime sessionDate) {}

    public record StreakResponse(int currentStreakDays) {}
}