package com.university.commandcenter.pomodoro.infrastructure.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.time.LocalDateTime;

public interface StudySessionJpaRepository extends JpaRepository<StudySessionEntity, Long> {

    @Query(value = "SELECT DATE(ss.session_date) as study_day " +
            "FROM study_sessions ss " +
            "WHERE ss.user_id = :userId " +
            "GROUP BY DATE(ss.session_date) " +
            "HAVING SUM(ss.duration_minutes) >= :dailyGoalMinutes " +
            "ORDER BY study_day DESC", nativeQuery = true)
    List<java.sql.Date> findDaysWithGoalMet(@Param("userId") Long userId,
            @Param("dailyGoalMinutes") int dailyGoalMinutes);

    @Query("SELECT COALESCE(SUM(ss.durationMinutes), 0) FROM StudySessionEntity ss "
            + "WHERE ss.userId = :userId AND ss.sessionDate >= :startDate AND ss.sessionDate < :endDate")
    int getStudiedMinutesBetween(
            @Param("userId") Long userId,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);

    @Query(value = "SELECT COALESCE(SUM(ss.duration_minutes), 0) " +
            "FROM study_sessions ss " +
            "WHERE ss.user_id = :userId AND ss.session_date >= :sinceDate", nativeQuery = true)
    int getStudiedMinutesSince(@Param("userId") Long userId, @Param("sinceDate") java.time.LocalDateTime sinceDate);

    @Query(value = "SELECT COALESCE(SUM(ss.duration_minutes), 0) " +
            "FROM study_sessions ss " +
            "WHERE ss.user_id = :userId", nativeQuery = true)
    int getTotalStudiedMinutes(@Param("userId") Long userId);

    @Query("SELECT ss FROM StudySessionEntity ss WHERE ss.subjectId IN :subjectIds ORDER BY ss.sessionDate DESC")
    List<StudySessionEntity> findBySubjectIdInOrderBySessionDateDesc(@Param("subjectIds") List<Long> subjectIds);

    List<StudySessionEntity> findBySubjectIdOrderBySessionDateDesc(Long subjectId);

    List<StudySessionEntity> findByUserIdOrderBySessionDateDesc(Long userId);

    List<StudySessionEntity> findByUserIdAndSessionDateBetweenOrderBySessionDateAsc(
            Long userId, LocalDateTime startDate, LocalDateTime endDate);

}
