package com.university.commandcenter.pomodoro.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class StudySession {
    private final Long id;
    private final Long userId;
    private final Long subjectId;
    private final LocalDateTime sessionDate;
    private final int durationMinutes;
    private final CycleType cycleType;

    public boolean isValid() {
        return durationMinutes > 0 && sessionDate != null && !sessionDate.isAfter(LocalDateTime.now());
    }
}
