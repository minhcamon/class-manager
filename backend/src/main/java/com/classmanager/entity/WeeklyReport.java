package com.classmanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "weekly_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "week_end_date", nullable = false)
    private LocalDate weekEndDate;

    @Column(name = "snapshot_point", nullable = false)
    private Integer snapshotPoint;

    @Column(name = "snapshot_base_point", nullable = false)
    private Integer snapshotBasePoint;

    @Column(name = "total_bonus", nullable = false)
    private Integer totalBonus;

    @Column(name = "total_penalty", nullable = false)
    private Integer totalPenalty;

    @Column(name = "rank_in_class")
    private Integer rankInClass;

    @Column(name = "rank_in_group")
    private Integer rankInGroup;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @Column(name = "locked_by", length = 20)
    private String lockedBy; // CRON, TEACHER

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (isLocked == null) isLocked = false;
        if (totalBonus == null) totalBonus = 0;
        if (totalPenalty == null) totalPenalty = 0;
    }
}
