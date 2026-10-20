package com.university.commandcenter.dashboard.infrastructure.adapter.out;

import com.university.commandcenter.dashboard.application.port.out.DashboardMetricsPort;
import com.university.commandcenter.calendar.infrastructure.adapter.out.persistence.ClassScheduleEntity;
import com.university.commandcenter.calendar.infrastructure.adapter.out.persistence.ClassScheduleJpaRepository;
import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class DashboardMetricsAdapter implements DashboardMetricsPort {

    private final StudySessionRepositoryPort studySessionRepository;
    private final SubjectRepositoryPort subjectRepository;
    private final TaskRepositoryPort taskRepository;
    private final ClassScheduleJpaRepository classScheduleRepository;

    @Override
    public int getStudiedMinutesToday(Long userId) {
        return studySessionRepository.getStudiedMinutesToday(userId);
    }

    @Override
    public List<Subject> getDailyClasses(Long userId) {
        DayOfWeek today = java.time.LocalDate.now().getDayOfWeek();
        List<Subject> subjects = subjectRepository.findByUserId(userId);
        List<Long> subjectIds = subjects.stream().map(Subject::getId).toList();
        List<Long> subjectsWithStructuredSchedule = (subjectIds.isEmpty()
                ? List.<ClassScheduleEntity>of()
                : classScheduleRepository.findBySubjectIdIn(subjectIds)).stream()
                .filter(schedule -> today.name().equals(schedule.getDayOfWeek()))
                .map(ClassScheduleEntity::getSubjectId)
                .toList();
        return subjects.stream()
                .filter(subject -> subjectsWithStructuredSchedule.contains(subject.getId())
                        || scheduleIncludesDay(subject.getSchedule(), today))
                .toList();
    }

    @Override
    public List<Task> getUrgentDeliveries(Long userId) {
        List<Long> subjectIds = subjectRepository.findByUserId(userId).stream()
                .map(Subject::getId)
                .toList();
        LocalDateTime now = LocalDateTime.now();
        return taskRepository.findBySubjectIdIn(subjectIds).stream()
                .filter(task -> !"DONE".equals(task.getCurrentStateName()))
                .filter(task -> task.getDueDate() != null
                        && !task.getDueDate().isAfter(now.plusDays(7)))
                .sorted(Comparator
                        .comparing((Task task) -> urgencyScore(task, now)).reversed()
                        .thenComparing(Task::getDueDate))
                .toList();
    }

    private int urgencyScore(Task task, LocalDateTime now) {
        long hoursUntilDue = ChronoUnit.HOURS.between(now, task.getDueDate());
        int urgency = task.getDueDate().isBefore(now) ? 100 : Math.max(0, 72 - (int) hoursUntilDue);
        urgency += switch (task.getPriority() == null ? "" : task.getPriority().toUpperCase(Locale.ROOT)) {
            case "HIGH" -> 30;
            case "MEDIUM" -> 15;
            default -> 0;
        };
        if (task.getTaskType() != null
                && List.of("EXAM", "EVALUATION", "TEST").contains(task.getTaskType().toUpperCase(Locale.ROOT))) {
            urgency += 20;
        }
        return urgency;
    }

    private boolean scheduleIncludesDay(String schedule, DayOfWeek day) {
        if (schedule == null || schedule.isBlank()) {
            return false;
        }
        List<String> aliases = switch (day) {
            case MONDAY -> List.of("monday", "mon", "lunes", "lun");
            case TUESDAY -> List.of("tuesday", "tue", "martes", "mar");
            case WEDNESDAY -> List.of("wednesday", "wed", "miercoles", "miércoles", "mie");
            case THURSDAY -> List.of("thursday", "thu", "jueves", "jue");
            case FRIDAY -> List.of("friday", "fri", "viernes", "vie");
            case SATURDAY -> List.of("saturday", "sat", "sabado", "sábado", "sab");
            case SUNDAY -> List.of("sunday", "sun", "domingo", "dom");
        };
        return java.util.Arrays.stream(schedule.toLowerCase(Locale.ROOT).split("[^\\p{L}]+"))
                .anyMatch(aliases::contains);
    }
}
