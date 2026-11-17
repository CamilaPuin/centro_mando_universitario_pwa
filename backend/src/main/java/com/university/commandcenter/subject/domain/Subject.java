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
}
