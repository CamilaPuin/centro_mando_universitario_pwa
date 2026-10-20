package com.university.commandcenter.kanban.application.port.in;

import com.university.commandcenter.kanban.domain.Task;

import java.util.List;

public interface ExamWeekUseCase {
    List<Task> getUpcomingExams(Long userId);
}