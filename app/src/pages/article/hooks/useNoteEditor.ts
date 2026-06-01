import { useState, useCallback } from 'react';
import { ArticleStore } from '@/store/articleStore';
import { BlinkoStore } from '@/store/blinkoStore';
import { RootStore } from '@/store';
import { Note } from '@shared/lib/types';

interface UseNoteEditorProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

export const useNoteEditor = ({ articleStore, articleId }: UseNoteEditorProps) => {
  const blinkoStore = RootStore.Get(BlinkoStore);

  // null 表示展示模式（或新增编辑器），数字表示正在编辑的笔记ID
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // 切换到编辑模式
  const startEdit = useCallback((note: Note) => {
    blinkoStore.curSelectedNote = note;
    setEditingNoteId(note.id ?? null);
  }, [blinkoStore]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    blinkoStore.curSelectedNote = null;
    setEditingNoteId(null);
  }, [blinkoStore]);

  // 保存后的处理
  const handleNoteSaved = useCallback(async (savedNote?: Note) => {
    // 如果是编辑模式，退出编辑状态
    if (editingNoteId !== null) {
      setEditingNoteId(null);
      blinkoStore.curSelectedNote = null;
      // 重新加载文章以显示更新后的内容
      if (articleId) {
        await articleStore.loadArticle.call(articleId);
      }
    } else {
      // 如果是新增模式
      if (savedNote?.id && articleId) {
        await articleStore.addNoteToArticle.call(articleId, savedNote.id);
      }
    }
  }, [articleStore, articleId, editingNoteId, blinkoStore]);

  // 判断笔记是否处于编辑状态
  const isEditing = useCallback((noteId: number) => {
    return editingNoteId === noteId;
  }, [editingNoteId]);

  // 判断是否处于新增编辑模式
  const isCreatingEditor = editingNoteId === null;

  return {
    editingNoteId,
    isCreatingEditor,
    startEdit,
    cancelEdit,
    handleNoteSaved,
    isEditing,
  };
};
