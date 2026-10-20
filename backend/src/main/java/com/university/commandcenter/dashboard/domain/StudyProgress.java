package com.university.commandcenter.dashboard.domain;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudyProgress {
    private final int dailyGoalMinutes;
    private final int studiedMinutesToday;

    public double getPercentageCompleted() {
        if (dailyGoalMinutes == 0) return 100.0;
        double percentage = ((double) studiedMinutesToday / dailyGoalMinutes) * 100;
        return Math.min(percentage, 100.0);
    }

    public boolean isGoalMet() {
        return studiedMinutesToday >= dailyGoalMinutes;
    }
}
