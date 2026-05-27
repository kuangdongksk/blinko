import { BlinkoCard } from "@/components/BlinkoCard";
import { Icon } from "@/components/Common/Iconify/icons";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { ArticleStore } from "@/store/articleStore";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Divider, Input, Textarea } from "@heroui/react";
import { Note } from "@shared/lib/types";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ArticleCreatorProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

// Sortable section item component
interface SortableSectionProps {
  section: { noteId: number; order: number; note?: Note };
  onRemove: (noteId: number) => void;
}

const SortableSection = observer(({ section, onRemove }: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.noteId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group mb-4">
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <Icon icon="mdi:drag-horizontal" width="20" height="20" />
      </div>
      <Button
        isIconOnly
        size="sm"
        variant="light"
        color="danger"
        className="absolute left-0 top-0 -translate-x-10 opacity-0 group-hover:opacity-100 transition-opacity"
        onPress={() => onRemove(section.noteId)}
      >
        <Icon icon="mdi:close" width="16" height="16" />
      </Button>
      {section.note && <BlinkoCard blinkoItem={section.note} />}
    </div>
  );
});

export const ArticleCreator = observer(({ articleStore, articleId }: ArticleCreatorProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (articleStore.currentArticle) {
      setEditTitle(articleStore.currentArticle.title);
      setEditDescription(articleStore.currentArticle.description || "");
    }
  }, [articleStore.currentArticle]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && articleStore.currentArticle) {
      const oldIndex = articleStore.currentSections.findIndex(
        (s) => s.noteId === active.id,
      );
      const newIndex = articleStore.currentSections.findIndex(
        (s) => s.noteId === over.id,
      );

      const newSections = [...articleStore.currentSections];
      const [removed] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, removed);

      // Update order
      const updatedSectionNoteIds = newSections.map((s, i) => {
        s.order = i;
        return s.noteId;
      });

      await articleStore.reorderSections.call(
        articleId!,
        updatedSectionNoteIds,
      );
    }
  };

  const handleSaveArticle = async () => {
    if (articleId) {
      await articleStore.updateArticle.call(articleId, {
        title: editTitle,
        description: editDescription,
      });
      setIsEditing(false);
    }
  };

  const handleRemoveNote = async (noteId: number) => {
    if (articleId) {
      await articleStore.removeNoteFromArticle.call(articleId, noteId);
    }
  };

  return (
    <div className="flex-1 border-r px-6 py-4 overflow-hidden flex flex-col">
      {/* Article Header */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t("article-title")}
              variant="bordered"
              size="lg"
              className="font-bold"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder={t("article-description")}
              variant="bordered"
              minRows={2}
            />
            <div className="flex gap-2">
              <Button color="primary" size="sm" onPress={handleSaveArticle}>
                {t("save")}
              </Button>
              <Button size="sm" variant="flat" onPress={() => setIsEditing(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {articleStore.currentArticle?.title}
              </h1>
              {articleStore.currentArticle?.description && (
                <p className="text-default-500">
                  {articleStore.currentArticle.description}
                </p>
              )}
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsEditing(true)}
            >
              <Icon icon="mdi:pencil" width="20" height="20" />
            </Button>
          </div>
        )}
      </div>

      <Divider className="mb-4" />

      {/* Article Sections */}
      <ScrollArea className="flex-1">
        {articleStore.loadArticle.loading ? (
          <LoadingAndEmpty isLoading={true} isEmpty={false} />
        ) : articleStore.currentSections.length === 0 ? (
          <LoadingAndEmpty isLoading={false} isEmpty={true} />
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={articleStore.currentSections.map((s) => s.noteId)}
              strategy={verticalListSortingStrategy}
            >
              {articleStore.currentSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <SortableSection
                    key={section.noteId}
                    section={section}
                    onRemove={handleRemoveNote}
                  />
                ))}
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>
    </div>
  );
});

export default ArticleCreator;