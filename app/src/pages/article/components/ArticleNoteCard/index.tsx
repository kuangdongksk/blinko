import { observer } from "mobx-react-lite";
import { BlinkoStore } from '@/store/blinkoStore';
import { Card } from '@heroui/react';
import { RootStore } from '@/store';
import { Note } from '@shared/lib/types';
import { NoteContent } from "./noteContent";
import { Icon } from '@/components/Common/Iconify/icons';
import { Tooltip } from '@heroui/react';
import { useInView } from 'react-intersection-observer';

export type ArticleNoteItem = Note & {
  isBlog?: boolean;
  title?: string;
}

interface ArticleNoteCardProps {
  note: ArticleNoteItem;
  onEdit?: (note: ArticleNoteItem) => void;
  onDelete?: (noteId: number) => void;
  onMoveUp?: (noteId: number) => void;
  onMoveDown?: (noteId: number) => void;
  onContextMenu?: (e: React.MouseEvent, note: ArticleNoteItem) => void;
  index: number;
  total: number;
}

export const ArticleNoteCard = observer(({
  note,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onContextMenu,
  index,
  total,
}: ArticleNoteCardProps) => {
  const blinko = RootStore.Get(BlinkoStore);
  const { ref: inViewRef, inView } = useInView({
    rootMargin: '200px 0px',
    triggerOnce: true,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, note);
  };

  return (
    <div onContextMenu={handleContextMenu} className="group/note">
      <Card
        shadow='none'
        className="flex flex-col p-4 bg-background transition-all hover:translate-y-1"
      >
        <div className="w-full">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-2">
            {/* 笔记类型标签 */}
            <div className="flex items-center gap-2">
              {note.type === 1 && (
                <Tooltip content="Blinko" delay={1000}>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <Icon className="text-yellow-500" icon="basil:lightning-solid" width="16" height="16" />
                  </div>
                </Tooltip>
              )}
              {note.type === 2 && (
                <Tooltip content="Note" delay={1000}>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <Icon className="text-blue-500" icon="solar:notes-minimalistic-bold-duotone" width="16" height="16" />
                  </div>
                </Tooltip>
              )}
              {note.type === 3 && (
                <Tooltip content="Todo" delay={1000}>
                  <div className="flex items-center gap-1 cursor-pointer">
                    <Icon className="text-green-500" icon="solar:folder-check-bold" width="16" height="16" />
                  </div>
                </Tooltip>
              )}
            </div>

            {/* 右上角操作按钮 */}
            <div className="flex items-center gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
              {/* 上移按钮 */}
              {onMoveUp && index > 0 && (
                <Tooltip content="上移">
                  <button
                    className="p-1 hover:bg-default-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(note.id!);
                    }}
                  >
                    <Icon icon="mdi:arrow-up" width="16" height="16" />
                  </button>
                </Tooltip>
              )}

              {/* 下移按钮 */}
              {onMoveDown && index < total - 1 && (
                <Tooltip content="下移">
                  <button
                    className="p-1 hover:bg-default-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(note.id!);
                    }}
                  >
                    <Icon icon="mdi:arrow-down" width="16" height="16" />
                  </button>
                </Tooltip>
              )}

              {/* 编辑按钮 */}
              {onEdit && (
                <Tooltip content="编辑">
                  <button
                    className="p-1 hover:bg-default-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(note);
                    }}
                  >
                    <Icon icon="mdi:pencil" width="16" height="16" />
                  </button>
                </Tooltip>
              )}

              {/* 删除按钮 */}
              {onDelete && (
                <Tooltip content="从文章中移除">
                  <button
                    className="p-1 hover:bg-danger-100 text-danger rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(note.id!);
                    }}
                  >
                    <Icon icon="mdi:close" width="16" height="16" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* 笔记内容 — 懒渲染，仅在可视区域时挂载 MarkdownRender */}
          <div ref={inViewRef}>
            {inView ? (
              <NoteContent blinkoItem={note} blinko={blinko} isExpanded={false} isShareMode={false} readOnly={true} />
            ) : (
              <div className="min-h-[120px]" />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
