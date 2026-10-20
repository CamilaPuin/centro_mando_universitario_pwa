package com.university.commandcenter.dashboard.application.port.out;

import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.subject.domain.Subject;

public interface DashboardMetricsPort {
    int getStudiedMinutesToday(Long userId);
    java.util.List<Subject> getDailyClasses(Long userId);
    java.util.List<Task> getUrgentDeliveries(Long userId);
}
