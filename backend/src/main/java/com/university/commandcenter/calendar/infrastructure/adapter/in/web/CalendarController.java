package com.university.commandcenter.calendar.infrastructure.adapter.in.web;

import com.university.commandcenter.calendar.infrastructure.adapter.out.persistence.ClassScheduleEntity;
import com.university.commandcenter.calendar.infrastructure.adapter.out.persistence.ClassScheduleJpaRepository;
import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.kanban.application.port.in.ManageTaskUseCase;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.subject.application.port.in.ManageSubjectUseCase;
import com.university.commandcenter.subject.domain.Evaluation;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final ClassScheduleJpaRepository scheduleRepository;
    private final ManageSubjectUseCase subjectUseCase;
    private final ManageTaskUseCase taskUseCase;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<CalendarEvent> getCalendar(
            @RequestParam(defaultValue = "week") String view,
            @RequestParam(required = false) LocalDate date) {
        String normalizedView = view.toLowerCase(Locale.ROOT);
        if (!List.of("week", "month").contains(normalizedView)) {
            throw new IllegalArgumentException("Calendar view must be week or month");
        }
        LocalDate selectedDate = date == null ? LocalDate.now() : date;
        LocalDate start = normalizedView.equals("week")
                ? selectedDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                : selectedDate.withDayOfMonth(1);
        LocalDate end = normalizedView.equals("week")
                ? start.plusDays(6)
                : start.plusMonths(1).minusDays(1);
        Long userId = currentUserService.getCurrentUserId();
        List<Subject> subjects = subjectUseCase.getSubjectsByUser(userId);
        List<Long> subjectIds = subjects.stream().map(Subject::getId).toList();
        Map<Long, Subject> subjectsById = subjects.stream()
                .collect(Collectors.toMap(Subject::getId, Function.identity()));
        List<CalendarEvent> events = new ArrayList<>();
        List<ClassScheduleEntity> schedules = subjectIds.isEmpty()
                ? List.of()
                : scheduleRepository.findBySubjectIdIn(subjectIds);

        for (ClassScheduleEntity schedule : schedules) {
            Subject subject = subjectsById.get(schedule.getSubjectId());
            if (subject != null) {
                addRecurringClasses(events, schedule, subject, start, end);
            }
        }
        addLegacyScheduleEvents(events, subjects, schedules, start, end);

        for (Task task : taskUseCase.getTasksBySubjects(userId)) {
            if (task.getDueDate() != null
                    && !task.getDueDate().toLocalDate().isBefore(start)
                    && !task.getDueDate().toLocalDate().isAfter(end)) {
                Subject subject = subjectsById.get(task.getSubjectId());
                events.add(new CalendarEvent(
                        task.getId(),
                        "DELIVERY",
                        task.getTitle(),
                        task.getSubjectId(),
                        subject == null ? null : subject.getName(),
                        task.getDueDate(),
                        task.getDueDate(),
                        task.getCurrentStateName()));
            }
        }

        for (Subject subject : subjects) {
            for (Evaluation evaluation : subject.getEvaluations()) {
                if (evaluation.getEvaluationDate() != null
                        && !evaluation.getEvaluationDate().toLocalDate().isBefore(start)
                        && !evaluation.getEvaluationDate().toLocalDate().isAfter(end)) {
                    events.add(new CalendarEvent(
                            evaluation.getId(),
                            "EVALUATION",
                            evaluation.getName(),
                            subject.getId(),
                            subject.getName(),
                            evaluation.getEvaluationDate(),
                            evaluation.getEvaluationDate(),
                            evaluation.getGrade() == null ? "Not graded" : "GRADE " + evaluation.getGrade()));
                }
            }
        }

        return events.stream()
                .sorted(java.util.Comparator.comparing(CalendarEvent::start))
                .toList();
    }

    @GetMapping("/class-schedules")
    public List<ClassScheduleResponse> getClassSchedules() {
        Long userId = currentUserService.getCurrentUserId();
        List<Long> subjectIds = subjectUseCase.getSubjectsByUser(userId).stream()
                .map(Subject::getId)
                .toList();
        if (subjectIds.isEmpty()) {
            return List.of();
        }
        return scheduleRepository.findBySubjectIdIn(subjectIds).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/class-schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassScheduleResponse createClassSchedule(@Valid @RequestBody ClassScheduleRequest request) {
        Long userId = currentUserService.getCurrentUserId();
        subjectUseCase.getSubjectById(userId, request.subjectId());
        DayOfWeek day = parseDay(request.dayOfWeek());
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Class end time must be after start time");
        }
        ensureNoOverlap(userId, day, request.startTime(), request.endTime(), null);
        return toResponse(scheduleRepository.save(ClassScheduleEntity.builder()
                .subjectId(request.subjectId())
                .dayOfWeek(day.name())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .location(request.location())
                .build()));
    }

    @PutMapping("/class-schedules/{scheduleId}")
    public ClassScheduleResponse updateClassSchedule(
            @PathVariable Long scheduleId,
            @Valid @RequestBody ClassScheduleRequest request) {
        ClassScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Class schedule not found"));
        Long userId = currentUserService.getCurrentUserId();
        subjectUseCase.getSubjectById(userId, schedule.getSubjectId());
        subjectUseCase.getSubjectById(userId, request.subjectId());
        DayOfWeek day = parseDay(request.dayOfWeek());
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Class end time must be after start time");
        }
        ensureNoOverlap(userId, day, request.startTime(), request.endTime(), scheduleId);
        schedule.setSubjectId(request.subjectId());
        schedule.setDayOfWeek(day.name());
        schedule.setStartTime(request.startTime());
        schedule.setEndTime(request.endTime());
        schedule.setLocation(request.location());
        return toResponse(scheduleRepository.save(schedule));
    }

    @DeleteMapping("/class-schedules/{scheduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClassSchedule(@PathVariable Long scheduleId) {
        ClassScheduleEntity schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Class schedule not found"));
        subjectUseCase.getSubjectById(currentUserService.getCurrentUserId(), schedule.getSubjectId());
        scheduleRepository.delete(schedule);
    }

    private void addRecurringClasses(
            List<CalendarEvent> events,
            ClassScheduleEntity schedule,
            Subject subject,
            LocalDate start,
            LocalDate end) {
        DayOfWeek scheduledDay = DayOfWeek.valueOf(schedule.getDayOfWeek());
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (date.getDayOfWeek() == scheduledDay) {
                events.add(new CalendarEvent(
                        schedule.getId(),
                        "CLASS",
                        subject.getName(),
                        subject.getId(),
                        subject.getName(),
                        LocalDateTime.of(date, schedule.getStartTime()),
                        LocalDateTime.of(date, schedule.getEndTime()),
                        schedule.getLocation()));
            }
        }
    }

    private void addLegacyScheduleEvents(
            List<CalendarEvent> events,
            List<Subject> subjects,
            List<ClassScheduleEntity> schedules,
            LocalDate start,
            LocalDate end) {
        List<Long> structuredSubjectIds = schedules.stream()
                .map(ClassScheduleEntity::getSubjectId)
                .distinct()
                .toList();
        for (Subject subject : subjects) {
            if (structuredSubjectIds.contains(subject.getId())
                    || subject.getSchedule() == null || subject.getSchedule().isBlank()) {
                continue;
            }
            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                if (legacyScheduleIncludesDay(subject.getSchedule(), date.getDayOfWeek())) {
                    events.add(new CalendarEvent(
                            subject.getId(),
                            "CLASS",
                            subject.getName(),
                            subject.getId(),
                            subject.getName(),
                            date.atStartOfDay(),
                            date.atTime(23, 59),
                            subject.getSchedule()));
                }
            }
        }
    }

    private boolean legacyScheduleIncludesDay(String schedule, DayOfWeek day) {
        String[] tokens = schedule.toLowerCase(Locale.ROOT).split("[^\\p{L}]+");
        List<String> aliases = switch (day) {
            case MONDAY -> List.of("monday", "mon", "lunes", "lun");
            case TUESDAY -> List.of("tuesday", "tue", "martes", "mar");
            case WEDNESDAY -> List.of("wednesday", "wed", "miercoles", "miércoles", "mie");
            case THURSDAY -> List.of("thursday", "thu", "jueves", "jue");
            case FRIDAY -> List.of("friday", "fri", "viernes", "vie");
            case SATURDAY -> List.of("saturday", "sat", "sabado", "sábado", "sab");
            case SUNDAY -> List.of("sunday", "sun", "domingo", "dom");
        };
        return java.util.Arrays.stream(tokens).anyMatch(aliases::contains);
    }

    private void ensureNoOverlap(
            Long userId,
            DayOfWeek day,
            java.time.LocalTime start,
            java.time.LocalTime end,
            Long excludedId) {
        List<Long> subjectIds = subjectUseCase.getSubjectsByUser(userId).stream()
                .map(Subject::getId)
                .toList();
        boolean overlaps = subjectIds.isEmpty() ? false
                : scheduleRepository.findBySubjectIdInAndDayOfWeek(subjectIds, day.name()).stream()
                .filter(existing -> !existing.getId().equals(excludedId))
                .anyMatch(existing -> start.isBefore(existing.getEndTime())
                        && end.isAfter(existing.getStartTime()));
        if (overlaps) {
            throw new IllegalArgumentException("Class schedule overlaps an existing class");
        }
    }

    private DayOfWeek parseDay(String dayOfWeek) {
        try {
            return DayOfWeek.valueOf(dayOfWeek.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Day of week must be a valid English day name");
        }
    }

    private ClassScheduleResponse toResponse(ClassScheduleEntity schedule) {
        return new ClassScheduleResponse(
                schedule.getId(),
                schedule.getSubjectId(),
                schedule.getDayOfWeek(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getLocation());
    }

    public record ClassScheduleRequest(
            @NotNull Long subjectId,
            @NotBlank String dayOfWeek,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            String location) {}

    public record ClassScheduleResponse(
            Long id,
            Long subjectId,
            String dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            String location) {}

    public record CalendarEvent(
            Long id,
            String type,
            String title,
            Long subjectId,
            String subjectName,
            LocalDateTime start,
            LocalDateTime end,
            String details) {}
}