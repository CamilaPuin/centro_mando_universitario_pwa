package com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private SubjectEntity subject;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "DECIMAL(4,2)")
    private BigDecimal grade;

    @Column(nullable = false, columnDefinition = "DECIMAL(5,2)")
    private BigDecimal percentage;

    @Column(name = "evaluation_date")
    private LocalDateTime evaluationDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
