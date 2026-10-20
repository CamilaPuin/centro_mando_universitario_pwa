package com.university.commandcenter.kanban.application.service;

import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepositoryPort taskRepository;

    @Mock
    private SubjectRepositoryPort subjectRepository;

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, subjectRepository);
    }

    @Test
    void createTaskNormalizesCategoriesAndPersistsForOwnedSubject() {
        when(subjectRepository.findById(12L)).thenReturn(Optional.of(subject(4L)));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Task created = taskService.createTask(4L, task(12L, "quiz", "high", "exam"));

        assertEquals("HIGH", created.getPriority());
        assertEquals("EXAM", created.getTaskType());
        assertEquals("PENDING", created.getCurrentStateName());
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createTaskRejectsSubjectsOwnedByAnotherUser() {
        when(subjectRepository.findById(12L)).thenReturn(Optional.of(subject(8L)));

        assertThrows(ResourceNotFoundException.class,
                () -> taskService.createTask(4L, task(12L, "quiz", "HIGH", "EXAM")));
    }

    @Test
    void changingStateRecordsCompletionTime() {
        Task task = task(12L, "quiz", "HIGH", "EXAM");
        when(taskRepository.findById(3L)).thenReturn(Optional.of(task));
        when(subjectRepository.findById(12L)).thenReturn(Optional.of(subject(4L)));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        taskService.changeState(4L, 3L, "DONE");

        assertEquals("DONE", task.getCurrentStateName());
        assertNotNull(task.getCompletedAt());
    }

    @Test
    void changeStateRejectsUnknownTransitions() {
        Task task = task(12L, "quiz", "HIGH", "EXAM");
        when(taskRepository.findById(3L)).thenReturn(Optional.of(task));
        when(subjectRepository.findById(12L)).thenReturn(Optional.of(subject(4L)));

        assertThrows(IllegalArgumentException.class,
                () -> taskService.changeState(4L, 3L, "ARCHIVED"));
    }

    private Subject subject(Long userId) {
        return Subject.builder().id(12L).userId(userId).name("Math").credits(3).build();
    }

    private Task task(Long subjectId, String title, String priority, String type) {
        return new Task(
                null,
                subjectId,
                title,
                null,
                LocalDateTime.now().plusDays(1),
                priority,
                type);
    }
}
