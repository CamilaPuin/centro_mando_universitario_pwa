package com.university.commandcenter.pomodoro.application.port.in;

import com.university.commandcenter.pomodoro.domain.StudySession;
import java.util.List;

public interface ManagePomodoroUseCase {
    
    StudySession registerSession(Long userId, StudySession session);
    
    int calculateCurrentStreak(Long userId, int dailyGoalMinutes);

    List<StudySession> getSessionsByUser(Long userId);

    FocusModeInfo getFocusModeInfo(Long userId, Long subjectId);

    record FocusModeInfo(
            Long subjectId,
            String subjectName,
            int minutesStudiedToday,
            int streakDays,
            String motivationalQuote,
            List<String> pendingTasks
    ) {}
}
