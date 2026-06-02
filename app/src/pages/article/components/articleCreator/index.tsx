import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { ArticleStore } from "@/store/articleStore";
import { Divider } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useNoteEditor } from "../../hooks/useNoteEditor";
import ArticleHeader from "./ArticleHeader";
import { ArticleNoteCard } from "../ArticleNoteCard";
import { NoteContextMenu, ContextMenuPosition } from "../NoteContextMenu";
import { useState, useCallback } from "react";
import { Note } from "@shared/lib/types";
import { insertNoteIdAtPosition } from "../../utils/sectionNoteIds";
import { ArticleBlinkoEditor } from "../ArticleBlinkoEditor";

interface ArticleCreatorProps {
  articleStore: ArticleStore;
  articleId: number | null;
}

export const ArticleCreator = observer(
  ({ articleStore, articleId }: ArticleCreatorProps) => {
    const { handleNoteSaved, isEditing, startEdit } = useNoteEditor({
      articleStore,
      articleId,
    });

    // 插入笔记的状态
    const [insertPosition, setInsertPosition] = useState<number | null>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
      null,
    );
    const [contextMenuNoteId, setContextMenuNoteId] = useState<number | null>(
      null,
    );

    // 从文章中移除笔记（至少保留一个块）
    const handleRemoveNote = async (noteId: number) => {
      if (!articleId) return;
      if (articleStore.currentSections.length <= 1) return;
      await articleStore.removeNoteFromArticle.call(articleId, noteId);
    };

    // 上移笔记
    const handleMoveUp = async (noteId: number) => {
      if (!articleId) return;
      const currentSections = articleStore.currentSections;
      const currentIndex = currentSections.findIndex(
        (s) => s.noteId === noteId,
      );
      if (currentIndex > 0) {
        const newNoteIds = [...currentSections.map((s) => s.noteId)];
        [newNoteIds[currentIndex - 1], newNoteIds[currentIndex]] = [
          newNoteIds[currentIndex],
          newNoteIds[currentIndex - 1],
        ];
        await articleStore.reorderSections.call(articleId, newNoteIds);
      }
    };

    // 下移笔记
    const handleMoveDown = async (noteId: number) => {
      if (!articleId) return;
      const currentSections = articleStore.currentSections;
      const currentIndex = currentSections.findIndex(
        (s) => s.noteId === noteId,
      );
      if (currentIndex < currentSections.length - 1) {
        const newNoteIds = [...currentSections.map((s) => s.noteId)];
        [newNoteIds[currentIndex], newNoteIds[currentIndex + 1]] = [
          newNoteIds[currentIndex + 1],
          newNoteIds[currentIndex],
        ];
        await articleStore.reorderSections.call(articleId, newNoteIds);
      }
    };

    // 保存插入的笔记
    const handleSaveInsert = useCallback(async (createdNote?: Note) => {
      if (createdNote?.id && articleId && insertPosition !== null) {
        const currentNoteIds = articleStore.currentSections.map((s) => s.noteId);
        const newNoteIds = insertNoteIdAtPosition(
          currentNoteIds,
          createdNote.id,
          insertPosition,
        );
        if (newNoteIds !== currentNoteIds) {
          await articleStore.reorderSections.call(articleId, newNoteIds);
        }
        await articleStore.loadAvailableNotes.call(articleStore.searchQuery || undefined);
      }
      // 关闭插入编辑器
      setInsertPosition(null);
    }, [articleStore, articleId, insertPosition]);

    // 右键菜单处理
    const handleContextMenu = useCallback((e: React.MouseEvent, note: Note) => {
      setContextMenu({ x: e.clientX, y: e.clientY });
      setContextMenuNoteId(note.id ?? null);
    }, []);

    // 在上方插入笔记
    const handleInsertAbove = useCallback(() => {
      const currentSections = articleStore.currentSections;
      const index = currentSections.findIndex(
        (s) => s.noteId === contextMenuNoteId,
      );
      if (index !== -1) {
        setInsertPosition(index);
      }
    }, [articleStore, contextMenuNoteId]);

    // 在下方插入笔记
    const handleInsertBelow = useCallback(() => {
      const currentSections = articleStore.currentSections;
      const index = currentSections.findIndex(
        (s) => s.noteId === contextMenuNoteId,
      );
      if (index !== -1) {
        setInsertPosition(index + 1);
      }
    }, [articleStore, contextMenuNoteId]);

    return (
      <div className="flex-1 border-r px-6 py-4 overflow-hidden flex flex-col">
        <ArticleHeader articleStore={articleStore} articleId={articleId} />

        <Divider className="mb-4" />

        {/* Article Sections */}
        <ScrollArea className="flex-1">
          {articleStore.loadArticle.loading.value ? (
            <LoadingAndEmpty isLoading={true} isEmpty={false} />
          ) : (
            <div className="space-y-4">
              {/* 空文章：显示默认编辑器块 */}
              {articleStore.currentSections.length === 0 && (
                <div className="p-2 bg-background rounded-lg">
                  <ArticleBlinkoEditor
                    mode="create"
                    onSended={handleNoteSaved}
                    withoutOutline={true}
                  />
                </div>
              )}

              {/* 笔记列表 */}
              {articleStore.currentSections.map((section, index) => {
                const note = section.note;
                if (!note) return null;
                const canDelete = articleStore.currentSections.length > 1;

                return (
                  <div key={section.noteId}>
                    {/* 在当前笔记之前插入 */}
                    {insertPosition === index && (
                      <div className="mb-2 p-2 bg-background rounded-lg">
                        <ArticleBlinkoEditor
                          mode="create"
                          onSended={handleSaveInsert}
                          withoutOutline={true}
                        />
                      </div>
                    )}

                    {isEditing(section.noteId) ? (
                      <div className="p-2 bg-background rounded-lg">
                        <ArticleBlinkoEditor
                          mode="edit"
                          onSended={handleNoteSaved}
                          withoutOutline={true}
                        />
                      </div>
                    ) : (
                      <ArticleNoteCard
                        note={note}
                        onDelete={canDelete ? handleRemoveNote : undefined}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onContextMenu={handleContextMenu}
                        onEdit={startEdit}
                        index={index}
                        total={articleStore.currentSections.length}
                      />
                    )}
                  </div>
                );
              })}

              {/* 在最后插入 */}
              {insertPosition === articleStore.currentSections.length && (
                <div className="mb-2 p-2 bg-background rounded-lg">
                  <ArticleBlinkoEditor
                    mode="create"
                    onSended={handleSaveInsert}
                    withoutOutline={true}
                  />
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* 右键菜单 */}
        <NoteContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onInsertAbove={handleInsertAbove}
          onInsertBelow={handleInsertBelow}
        />
      </div>
    );
  },
);

export default ArticleCreator;
