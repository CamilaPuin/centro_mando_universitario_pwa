package com.university.commandcenter.subject.domain;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class Evaluation {
    private final Long id;
    private final String name;
    private final LocalDateTime evaluationDate;
}
