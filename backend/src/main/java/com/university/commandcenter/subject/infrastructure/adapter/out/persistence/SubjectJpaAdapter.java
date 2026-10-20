package com.university.commandcenter.subject.infrastructure.adapter.out.persistence;

import com.university.commandcenter.subject.application.port.out.SubjectRepositoryPort;
import com.university.commandcenter.subject.domain.Subject;
import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectEntity;
import com.university.commandcenter.shared.infrastructure.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class SubjectJpaAdapter implements SubjectRepositoryPort {

    private final SubjectJpaRepository subjectJpaRepository;
    private final SubjectMapper subjectMapper;

    @Override
    public Optional<Subject> findById(Long id) {
        return subjectJpaRepository.findById(id).map(subjectMapper::toDomain);
    }

    @Override
    public List<Subject> findByUserId(Long userId) {
        return subjectJpaRepository.findByUserId(userId)
                .stream()
                .map(subjectMapper::toDomain)
                .collect(Collectors.toList());
    }

    public List<Subject> getSubjectsByUserId(Long userId) {
        return findByUserId(userId);
    }

    @Override
    public void deleteById(Long id) {
        subjectJpaRepository.deleteById(id);
    }

    @Override
    public Subject save(Subject subject) {
        SubjectEntity entity = subject.getId() == null
                ? new SubjectEntity()
                : subjectJpaRepository.findById(subject.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));
        entity.setUserId(subject.getUserId());
        entity.setName(subject.getName());
        entity.setTeacher(subject.getTeacher());
        entity.setSchedule(subject.getSchedule());
        entity.setCredits(subject.getCredits());

        SubjectEntity saved = subjectJpaRepository.save(entity);
        return subjectMapper.toDomain(saved);
    }
}