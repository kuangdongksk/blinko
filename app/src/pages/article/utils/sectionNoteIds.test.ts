import { describe, expect, test } from 'vitest';
import { insertNoteIdAtPosition } from './sectionNoteIds';

describe('insertNoteIdAtPosition', () => {
  test('inserts the created note id at the requested position', () => {
    expect(insertNoteIdAtPosition([10, 20, 30], 99, 1)).toEqual([10, 99, 20, 30]);
  });

  test('does not duplicate a note that is already in the article', () => {
    expect(insertNoteIdAtPosition([10, 20, 30], 20, 1)).toEqual([10, 20, 30]);
  });
});
