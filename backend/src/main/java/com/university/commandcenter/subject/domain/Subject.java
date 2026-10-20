package com.university.commandcenter.subject.domain;

import lombok.Builder;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

@Getter
@Builder
public class Subject {
    private final Long id;
    private final Long userId;
    private final String name;
    private final String teacher;
    private final String schedule;
    private final int credits;

    @Builder.Default
    private final List<Evaluation> evaluations = new ArrayList<>();

    public void addEvaluation(Evaluation evaluation) {
        if (evaluation == null) {
            throw new IllegalArgumentException("Evaluation cannot be null");
        }
        this.evaluations.add(evaluation);
    }

    public List<Evaluation> getEvaluations() {
        return Collections.unmodifiableList(evaluations);
    }

    public double calculateCurrentAverage() {
        if (evaluations.isEmpty()) {
            return 0.0;
        }

        double accumulatedGrade = 0.0;
        double totalPercentage = 0.0;

        for (Evaluation evaluation : evaluations) {
            if (evaluation.getGrade() != null) {
                accumulatedGrade += (evaluation.getGrade() * (evaluation.getPercentage() / 100.0));
                totalPercentage += evaluation.getPercentage();
            }
        }

        if (totalPercentage == 0.0) {
            return 0.0;
        }

        return (accumulatedGrade / (totalPercentage / 100.0));
    }
}
