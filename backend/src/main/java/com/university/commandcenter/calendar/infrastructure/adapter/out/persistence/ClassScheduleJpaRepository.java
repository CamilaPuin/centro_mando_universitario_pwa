package com.university.commandcenter.calendar.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassScheduleJpaRepository extends JpaRepository<ClassScheduleEntity, Long> {
    List<ClassScheduleEntity> findBySubjectIdIn(List<Long> subjectIds);
    List<ClassScheduleEntity> findBySubjectIdInAndDayOfWeek(List<Long> subjectIds, String dayOfWeek);
}
