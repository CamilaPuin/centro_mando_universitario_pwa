package com.university.commandcenter.subject.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SubjectTest {

    @Test
    void storesEvaluationsForSchedulingWithoutGrades() {
        LocalDateTime evaluationDate = LocalDateTime.of(2026, 11, 17, 8, 0);
        Subject subject = Subject.builder().name("Math").credits(3).build();
        subject.addEvaluation(Evaluation.builder()
                .name("Exam")
                .evaluationDate(evaluationDate)
                .build());

        assertEquals("Exam", subject.getEvaluations().get(0).getName());
        assertEquals(evaluationDate, subject.getEvaluations().get(0).getEvaluationDate());
    }

    @Test
    void rejectsNullEvaluations() {
        Subject subject = Subject.builder().name("Math").credits(3).build();

        assertThrows(IllegalArgumentException.class, () -> subject.addEvaluation(null));
    }
}
