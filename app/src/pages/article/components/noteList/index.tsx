import { BlinkoCard } from "@/components/BlinkoCard";
import { Icon } from "@/components/Common/Iconify/icons";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { ArticleStore } from "@/store/articleStore";
import { Input } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface NoteListProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

export const NoteList = observer(
  ({ articleStore, articleId }: NoteListProps) => {
    const { t } = useTranslation();

    // Filter available notes based on search
    const currentSections = articleStore.currentArticle?.sections || [];
    const searchQuery = articleStore.searchQuery.toLowerCase().trim();

    const filteredAvailableNotes = articleStore.availableNotes
      .filter((note) => !currentSections.some((s) => s.noteId === note.id))
      .filter((note) => {
        // If search query is empty, show all notes (will be limited to 20 below)
        if (!searchQuery) return true;

        // Search in content (safe null handling)
        const content = note.content || "";
        const contentMatch = content.toLowerCase().includes(searchQuery);

        // Search in tags (safe access to nested structure)
        const tagMatch =
          note.tags?.some((tagItem: any) => {
            const tagName = tagItem?.tag?.name || "";
            return tagName.toLowerCase().includes(searchQuery);
          }) || false;

        return contentMatch || tagMatch;
      })
      .slice(0, searchQuery ? undefined : 20); // Limit to 20 notes when no search query

    const handleAddNote = async (noteId: number) => {
      if (articleId) {
        await articleStore.addNoteToArticle.call(articleId, noteId);
      }
    };

    // Reload available notes - load once on mount
    useEffect(() => {
      articleStore.loadAvailableNotes.call();
    }, []);

    // Reload when search query changes
    useEffect(() => {
      if (articleStore.searchQuery) {
        articleStore.loadAvailableNotes.call(articleStore.searchQuery);
      } else {
        articleStore.loadAvailableNotes.call();
      }
    }, [articleStore.searchQuery]);

    return (
      <div className="p-4 flex flex-col bg-default-50">
        <div className="mb-4">
          <Input
            placeholder={t("search-notes")}
            value={articleStore.searchQuery}
            onChange={(e) => articleStore.setSearchQuery(e.target.value)}
            startContent={<Icon icon="mdi:magnify" width="20" height="20" />}
            variant="bordered"
          />
        </div>

        <ScrollArea className="flex-1">
          {articleStore.isLoadingNotes ? (
            <LoadingAndEmpty isLoading={true} isEmpty={false} />
          ) : filteredAvailableNotes.length === 0 ? (
            <LoadingAndEmpty isLoading={false} isEmpty={true} />
          ) : (
            <div className="space-y-3">
              {filteredAvailableNotes.map((note) => (
                <div
                  key={note.id}
                  className="cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => note.id && handleAddNote(note.id)}
                >
                  <BlinkoCard blinkoItem={note} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  },
);

export default NoteList;
