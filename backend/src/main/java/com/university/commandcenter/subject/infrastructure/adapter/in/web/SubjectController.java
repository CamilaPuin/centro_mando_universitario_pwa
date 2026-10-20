package com.university.commandcenter.subject.infrastructure.adapter.in.web;

import com.university.commandcenter.infrastructure.security.CurrentUserService;
import com.university.commandcenter.subject.application.port.in.CalculateAverageUseCase;
import com.university.commandcenter.subject.application.port.in.ManageEvaluationUseCase;
import com.university.commandcenter.subject.application.port.in.ManageSubjectNoteUseCase;
import com.university.commandcenter.subject.application.port.in.ManageSubjectUseCase;
import com.university.commandcenter.subject.domain.Evaluation;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectNoteEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final ManageSubjectUseCase subjectUseCase;
    private final ManageEvaluationUseCase evaluationUseCase;
    private final ManageSubjectNoteUseCase noteUseCase;
    private final CalculateAverageUseCase averageUseCase;
    private final CurrentUserService currentUserService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Subject createSubject(@Valid @RequestBody SubjectRequest request) {
        return subjectUseCase.createSubject(currentUserService.getCurrentUserId(), request.toDomain());
    }

    @GetMapping
    public List<Subject> getSubjects() {
        return subjectUseCase.getSubjectsByUser(currentUserService.getCurrentUserId());
    }

    @GetMapping("/{subjectId}")
    public Subject getSubject(@PathVariable Long subjectId) {
        return subjectUseCase.getSubjectById(currentUserService.getCurrentUserId(), subjectId);
    }

    @PutMapping("/{subjectId}")
    public Subject updateSubject(@PathVariable Long subjectId, @Valid @RequestBody SubjectRequest request) {
        return subjectUseCase.updateSubject(
                currentUserService.getCurrentUserId(), subjectId, request.toDomain());
    }

    @DeleteMapping("/{subjectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubject(@PathVariable Long subjectId) {
        subjectUseCase.deleteSubject(currentUserService.getCurrentUserId(), subjectId);
    }

    @GetMapping("/{subjectId}/average")
    public AverageResponse getAverage(@PathVariable Long subjectId) {
        return new AverageResponse(averageUseCase.calculateAverage(
                currentUserService.getCurrentUserId(), subjectId));
    }

    @GetMapping("/{subjectId}/evaluations")
    public List<Evaluation> getEvaluations(@PathVariable Long subjectId) {
        return evaluationUseCase.getEvaluationsBySubject(
                currentUserService.getCurrentUserId(), subjectId);
    }

    @PostMapping("/{subjectId}/evaluations")
    @ResponseStatus(HttpStatus.CREATED)
    public Evaluation addEvaluation(
            @PathVariable Long subjectId,
            @Valid @RequestBody EvaluationRequest request) {
        return evaluationUseCase.addEvaluation(
                currentUserService.getCurrentUserId(), subjectId, request.toDomain());
    }

    @PutMapping("/{subjectId}/evaluations/{evaluationId}")
    public Evaluation updateEvaluation(
            @PathVariable Long subjectId,
            @PathVariable Long evaluationId,
            @Valid @RequestBody EvaluationRequest request) {
        return evaluationUseCase.updateEvaluation(
                currentUserService.getCurrentUserId(), subjectId, evaluationId, request.toDomain());
    }

    @DeleteMapping("/{subjectId}/evaluations/{evaluationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvaluation(@PathVariable Long subjectId, @PathVariable Long evaluationId) {
        evaluationUseCase.deleteEvaluation(
                currentUserService.getCurrentUserId(), subjectId, evaluationId);
    }

    @GetMapping("/{subjectId}/notes")
    public List<SubjectNoteEntity> getNotes(@PathVariable Long subjectId) {
        return noteUseCase.getNotesBySubject(currentUserService.getCurrentUserId(), subjectId);
    }

    @PostMapping("/{subjectId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public SubjectNoteEntity createNote(
            @PathVariable Long subjectId,
            @Valid @RequestBody NoteRequest request) {
        return noteUseCase.createNote(
                currentUserService.getCurrentUserId(), subjectId, request.title(), request.content());
    }

    @DeleteMapping("/notes/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@PathVariable Long noteId) {
        noteUseCase.deleteNote(currentUserService.getCurrentUserId(), noteId);
    }

    public record SubjectRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 100) String teacher,
            @Size(max = 100) String schedule,
            @Positive int credits) {
        private Subject toDomain() {
            return Subject.builder()
                    .name(name)
                    .teacher(teacher)
                    .schedule(schedule)
                    .credits(credits)
                    .build();
        }
    }

    public record EvaluationRequest(
            @NotBlank @Size(max = 100) String name,
            @DecimalMin("0.0") @DecimalMax("5.0") Double grade,
            @DecimalMin("0.01") @DecimalMax("100.0") double percentage,
            LocalDateTime evaluationDate) {
        private Evaluation toDomain() {
            return Evaluation.builder()
                    .name(name)
                    .grade(grade)
                    .percentage(percentage)
                    .evaluationDate(evaluationDate)
                    .build();
        }
    }

    public record NoteRequest(@Size(max = 150) String title, @NotBlank String content) {}

    public record AverageResponse(double value) {}
}