package com.university.commandcenter.kanban.application.port.in;

import com.university.commandcenter.kanban.domain.Task;
import java.util.List;

public interface ManageTaskUseCase {
    Task createTask(Long userId, Task task);
    Task updateTask(Long userId, Long taskId, Task task);
    Task getTaskById(Long userId, Long taskId);
    List<Task> getTasksBySubjects(Long userId);
    List<Task> getTasksBySubject(Long userId, Long subjectId);
    List<Task> getUpcomingExams(Long userId);
    void deleteTask(Long userId, Long taskId);
}
