package com.university.commandcenter.pomodoro.application.service;

import com.university.commandcenter.kanban.application.port.out.TaskRepositoryPort;
import com.university.commandcenter.pomodoro.application.port.out.StudySessionRepositoryPort;
import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PomodoroServiceTest {

    @Mock
    private StudySessionRepositoryPort studySessionRepository;

    @Mock
    private SubjectRepositoryPort subjectRepository;

    @Mock
    private TaskRepositoryPort taskRepository;

    private PomodoroService pomodoroService;

    @BeforeEach
    void setUp() {
        pomodoroService = new PomodoroService(studySessionRepository, subjectRepository, taskRepository);
    }

    @Test
    void countsAStreakEndingYesterday() {
        when(studySessionRepository.getDaysWithGoalMet(9L, 60))
                .thenReturn(List.of(LocalDate.now().minusDays(1), LocalDate.now().minusDays(2)));

        assertEquals(2, pomodoroService.calculateCurrentStreak(9L, 60));
    }

    @Test
    void breaksAStreakWhenYesterdayDidNotMeetTheGoal() {
        when(studySessionRepository.getDaysWithGoalMet(9L, 60))
                .thenReturn(List.of(LocalDate.now(), LocalDate.now().minusDays(2)));

        assertEquals(1, pomodoroService.calculateCurrentStreak(9L, 60));
    }
}
