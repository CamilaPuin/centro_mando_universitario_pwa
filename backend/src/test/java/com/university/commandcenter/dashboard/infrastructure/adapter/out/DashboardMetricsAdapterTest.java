package com.university.commandcenter.dashboard.infrastructure.adapter.out;

import com.university.commandcenter.calendar.infrastructure.adapter.out.persistence.ClassScheduleJpaRepository;
import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.kanban.domain.Task;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardMetricsAdapterTest {

    @Mock
    private StudySessionRepositoryPort studySessionRepository;

    @Mock
    private SubjectRepositoryPort subjectRepository;

    @Mock
    private TaskRepositoryPort taskRepository;

    @Mock
    private ClassScheduleJpaRepository classScheduleRepository;

    @Test
    void prioritizesOverdueImportantExamsBeforeFutureWork() {
        Subject subject = Subject.builder().id(15L).userId(2L).name("Biology").credits(2).build();
        Task overdueExam = task(1L, "Exam", LocalDateTime.now().minusHours(2), "HIGH", "EXAM");
        Task laterTask = task(2L, "Worksheet", LocalDateTime.now().plusDays(2), "MEDIUM", "TASK");
        when(subjectRepository.findByUserId(2L)).thenReturn(List.of(subject));
        when(taskRepository.findBySubjectIdIn(List.of(15L))).thenReturn(List.of(laterTask, overdueExam));

        DashboardMetricsAdapter adapter = new DashboardMetricsAdapter(
                studySessionRepository, subjectRepository, taskRepository, classScheduleRepository);

        assertEquals(List.of(overdueExam, laterTask), adapter.getUrgentDeliveries(2L));
    }

    private Task task(Long id, String title, LocalDateTime dueDate, String priority, String type) {
        return new Task(id, 15L, title, null, dueDate, priority, type);
    }
}
