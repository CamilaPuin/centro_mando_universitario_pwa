package com.university.commandcenter.kanban.infrastructure.adapter.in.web;

import com.university.commandcenter.kanban.application.port.in.ChangeTaskStateUseCase;
import com.university.commandcenter.kanban.application.port.in.ExamWeekUseCase;
import com.university.commandcenter.kanban.application.port.in.ManageTaskUseCase;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final ManageTaskUseCase taskUseCase;
    private final ChangeTaskStateUseCase changeTaskStateUseCase;
    private final ExamWeekUseCase examWeekUseCase;
    private final CurrentUserService currentUserService;
    private final SubjectRepositoryPort subjectRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task createTask(@Valid @RequestBody TaskRequest request) {
        return taskUseCase.createTask(currentUserService.getCurrentUserId(), request.toDomain());
    }

    @GetMapping
    public List<Task> getTasks(@RequestParam(required = false) Long subjectId) {
        Long userId = currentUserService.getCurrentUserId();
        return subjectId == null
                ? taskUseCase.getTasksBySubjects(userId)
                : taskUseCase.getTasksBySubject(userId, subjectId);
    }

    @GetMapping("/{taskId}")
    public Task getTask(@PathVariable Long taskId) {
        return taskUseCase.getTaskById(currentUserService.getCurrentUserId(), taskId);
    }

    @PutMapping("/{taskId}")
    public Task updateTask(@PathVariable Long taskId, @Valid @RequestBody TaskRequest request) {
        return taskUseCase.updateTask(
                currentUserService.getCurrentUserId(), taskId, request.toDomain());
    }

    @PatchMapping("/{taskId}/state")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeTaskState(@PathVariable Long taskId, @Valid @RequestBody StateRequest request) {
        changeTaskStateUseCase.changeState(
                currentUserService.getCurrentUserId(), taskId, request.state());
    }

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long taskId) {
        taskUseCase.deleteTask(currentUserService.getCurrentUserId(), taskId);
    }

    @GetMapping("/exam-week")
    public List<ExamWeekItem> getExamWeek() {
        Long userId = currentUserService.getCurrentUserId();
        var subjectsById = subjectRepository.findByUserId(userId).stream()
                .collect(java.util.stream.Collectors.toMap(Subject::getId, Subject::getName));
        List<Task> upcomingExams = examWeekUseCase.getUpcomingExams(userId);
        return java.util.stream.IntStream.range(0, upcomingExams.size())
                .mapToObj(index -> {
                    Task exam = upcomingExams.get(index);
                    return new ExamWeekItem(
                            index + 1,
                            exam,
                            subjectsById.get(exam.getSubjectId()),
                            index == 0
                                    ? "Review this subject first; it is the highest-priority upcoming evaluation."
                                    : "Review after the higher-ranked upcoming evaluations.");
                })
                .toList();
    }

    public record TaskRequest(
            @NotNull Long subjectId,
            @NotBlank @Size(max = 150) String title,
            String description,
            @NotNull LocalDateTime dueDate,
            @NotBlank String priority,
            @NotBlank String taskType) {
        private Task toDomain() {
            return new Task(null, subjectId, title, description, dueDate, priority, taskType);
        }
    }

    public record StateRequest(@NotBlank String state) {}
    public record ExamWeekItem(int reviewOrder, Task evaluation, String subjectName, String recommendation) {}
}