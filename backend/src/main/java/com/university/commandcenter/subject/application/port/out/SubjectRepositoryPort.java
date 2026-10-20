package com.university.commandcenter.subject.application.port.out;

import com.university.commandcenter.subject.domain.Subject;
import java.util.List;
import java.util.Optional;

public interface SubjectRepositoryPort {
    Optional<Subject> findById(Long id);
    Subject save(Subject subject);
    List<Subject> findByUserId(Long userId);
    void deleteById(Long id);
}
