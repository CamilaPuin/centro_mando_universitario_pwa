package com.university.commandcenter.statistics.application.port.in;

import com.university.commandcenter.statistics.domain.StudyGoal;

public interface ManageGoalsUseCase {
    StudyGoal getGoal(Long userId);
    StudyGoal saveGoal(Long userId, int targetWeeklyMinutes, double targetAverageGrade);
}
