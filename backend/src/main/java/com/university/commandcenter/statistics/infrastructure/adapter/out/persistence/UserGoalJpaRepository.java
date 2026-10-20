package com.university.commandcenter.statistics.infrastructure.adapter.out.persistence;

import com.university.commandcenter.statistics.infrastructure.adapter.out.persistence.entity.UserGoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface UserGoalJpaRepository extends JpaRepository<UserGoalEntity, Long> {
    Optional<UserGoalEntity> findByUserId(Long userId);
}
