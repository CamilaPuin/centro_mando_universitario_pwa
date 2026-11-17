ALTER TABLE evaluations
    DROP COLUMN grade,
    DROP COLUMN percentage;

ALTER TABLE user_goals
    DROP COLUMN target_gpa;
