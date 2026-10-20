package com.university.commandcenter.statistics.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyGoal {
    private final Long id;
    private final Long userId;
    private final int targetWeeklyMinutes;
    private final double targetAverageGrade;
}
