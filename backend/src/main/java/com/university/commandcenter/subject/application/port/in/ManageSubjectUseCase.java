package com.university.commandcenter.subject.application.port.in;

import com.university.commandcenter.subject.domain.Subject;
import java.util.List;

public interface ManageSubjectUseCase {
    Subject createSubject(Long userId, Subject subject);
    Subject updateSubject(Long userId, Long subjectId, Subject subject);
    List<Subject> getSubjectsByUser(Long userId);
    Subject getSubjectById(Long userId, Long subjectId);
    void deleteSubject(Long userId, Long subjectId);
}
