package com.university.commandcenter.dashboard.domain;

import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.subject.domain.Subject;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DaySummary {
    private final int currentStreakDays;
    private final StudyProgress studyProgress;
    private final List<Subject> dailyClasses; 
    private final List<Task> urgentDeliveries;
}
