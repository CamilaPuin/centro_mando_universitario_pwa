package com.university.commandcenter.subject.infrastructure.adapter.out.persistence;

import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.domain.Evaluation;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectEntity;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.EvaluationEntity;
import org.springframework.stereotype.Component;

@Component
public class SubjectMapper {

    public Subject toDomain(SubjectEntity entity) {
        if (entity == null) {
            return null;
        }

        Subject subject = Subject.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .name(entity.getName())
                .teacher(entity.getTeacher())
                .schedule(entity.getSchedule())
                .credits(entity.getCredits())
                .build();

        if (entity.getEvaluations() != null) {
            entity.getEvaluations().forEach(actEntity -> subject.addEvaluation(toDomain(actEntity)));
        }

        return subject;
    }

    public Evaluation toDomain(EvaluationEntity entity) {
        if (entity == null) {
            return null;
        }
        return Evaluation.builder()
                .id(entity.getId())
                .name(entity.getName())
                .evaluationDate(entity.getEvaluationDate())
                .build();
    }
}
