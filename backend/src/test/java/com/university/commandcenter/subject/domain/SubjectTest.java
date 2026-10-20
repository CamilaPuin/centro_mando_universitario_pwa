package com.university.commandcenter.subject.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SubjectTest {

    @Test
    void calculatesWeightedAverageFromGradedEvaluations() {
        Subject subject = Subject.builder().name("Math").credits(3).build();
        subject.addEvaluation(Evaluation.builder().name("Exam").grade(4.0).percentage(40).build());
        subject.addEvaluation(Evaluation.builder().name("Project").grade(3.0).percentage(60).build());
        subject.addEvaluation(Evaluation.builder().name("Upcoming").grade(null).percentage(20).build());

        assertEquals(3.4, subject.calculateCurrentAverage(), 0.0001);
    }

    @Test
    void rejectsNullEvaluations() {
        Subject subject = Subject.builder().name("Math").credits(3).build();

        assertThrows(IllegalArgumentException.class, () -> subject.addEvaluation(null));
    }
}
