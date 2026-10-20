package com.university.commandcenter.subject.application.port.in;

import com.university.commandcenter.subject.domain.Evaluation;
import java.util.List;

public interface ManageEvaluationUseCase {
    Evaluation addEvaluation(Long userId, Long subjectId, Evaluation evaluation);
    Evaluation updateEvaluation(Long userId, Long subjectId, Long evaluationId, Evaluation evaluation);
    List<Evaluation> getEvaluationsBySubject(Long userId, Long subjectId);
    void deleteEvaluation(Long userId, Long subjectId, Long evaluationId);
}
