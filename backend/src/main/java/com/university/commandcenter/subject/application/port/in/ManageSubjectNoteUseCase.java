package com.university.commandcenter.subject.application.port.in;

import com.university.commandcenter.subject.infrastructure.adapter.out.persistence.entity.SubjectNoteEntity;
import java.util.List;

public interface ManageSubjectNoteUseCase {
    SubjectNoteEntity createNote(Long userId, Long subjectId, String title, String content);
    List<SubjectNoteEntity> getNotesBySubject(Long userId, Long subjectId);
    void deleteNote(Long userId, Long noteId);
}
