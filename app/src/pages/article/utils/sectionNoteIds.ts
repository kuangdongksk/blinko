export const insertNoteIdAtPosition = (
  currentNoteIds: number[],
  noteId: number,
  position: number,
) => {
  if (currentNoteIds.includes(noteId)) {
    return currentNoteIds;
  }

  const insertAt = Math.max(0, Math.min(position, currentNoteIds.length));
  const nextNoteIds = [...currentNoteIds];
  nextNoteIds.splice(insertAt, 0, noteId);
  return nextNoteIds;
};
