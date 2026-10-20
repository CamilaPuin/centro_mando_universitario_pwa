package com.university.commandcenter.pomodoro.domain;

public enum CycleType {
    POMODORO_TRADITIONAL(25),
    POMODORO_SHORT(15),
    POMODORO_LONG(50),
    FREE_SESSION(0);

    private final int recommendedDurationMinutes;

    CycleType(int recommendedDurationMinutes) {
        this.recommendedDurationMinutes = recommendedDurationMinutes;
    }

    public int getRecommendedDurationMinutes() {
        return recommendedDurationMinutes;
    }
}
