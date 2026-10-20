ALTER TABLE evaluations
    ADD COLUMN evaluation_date DATETIME NULL;

ALTER TABLE tasks
    ADD COLUMN task_type VARCHAR(30) NULL,
    ADD COLUMN completed_at DATETIME NULL;

ALTER TABLE study_sessions
    ADD COLUMN user_id BIGINT NULL;

UPDATE study_sessions ss
JOIN subjects s ON s.id = ss.subject_id
SET ss.user_id = s.user_id
WHERE ss.user_id IS NULL;

ALTER TABLE study_sessions
    ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_session_user_date ON study_sessions(user_id, session_date);
CREATE INDEX idx_task_due_date ON tasks(due_date);
CREATE INDEX idx_task_completed_at ON tasks(status, completed_at);

CREATE TABLE subject_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    title VARCHAR(150),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_subject_created ON subject_notes(subject_id, created_at);

CREATE TABLE user_goals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    target_weekly_minutes INT NOT NULL,
    target_gpa DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE class_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(100),
    CONSTRAINT fk_class_schedule_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE INDEX idx_class_schedule_subject_day ON class_schedules(subject_id, day_of_week);
