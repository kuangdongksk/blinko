import { BlinkoEditor } from "@/components/BlinkoEditor";
import { Icon } from "@/components/Common/Iconify/icons";
import { LoadingAndEmpty } from "@/components/Common/LoadingAndEmpty";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { ArticleStore } from "@/store/articleStore";
import { BlinkoStore } from "@/store/blinkoStore";
import { RootStore } from "@/store";
import { Button, Divider, Input } from "@heroui/react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface NoteListProps {
  articleStore: ArticleStore;
  articleId: string | null;
}

export const NoteList = observer(({ articleStore, articleId }: NoteListProps) => {
  const { t } = useTranslation();
  const [showAddNote, setShowAddNote] = useState(false);
  const blinkoStore = RootStore.Get(BlinkoStore);

  // Filter available notes based on search
  const currentSections = articleStore.currentArticle?.sections || [];
  const filteredAvailableNotes = articleStore.availableNotes.filter(
    (note) =>
      !currentSections.some((s) => s.noteId === note.id) &&
      note.content
        ?.toLowerCase()
        .includes(articleStore.searchQuery.toLowerCase()),
  );

  const handleAddNote = async (noteId: number) => {
    if (articleId) {
      await articleStore.addNoteToArticle.call(articleId, noteId);
    }
  };

  const handleCreateNote = async () => {
    // Reload available notes to get the newly created note
    await articleStore.loadAvailableNotes.call();

    // Get the latest note (first in the list)
    if (articleStore.availableNotes.length > 0) {
      const latestNote = articleStore.availableNotes[0];
      if (latestNote?.id && articleId) {
        await articleStore.addNoteToArticle.call(articleId, latestNote.id);
        setShowAddNote(false);
      }
    }
  };

  // Reload available notes when blinkoStore updates
  useEffect(() => {
    const loadNotes = () => {
      articleStore.loadAvailableNotes.call();
    };

    // Load initially
    loadNotes();

    // Watch for blinko updates
    const interval = setInterval(() => {
      if (blinkoStore.updateTicker > 0) {
        loadNotes();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blinkoStore.updateTicker]);

  return (
    <div className="w-80 p-4 flex flex-col bg-default-50">
      <div className="mb-4">
        <Input
          placeholder={t("search-notes")}
          value={articleStore.searchQuery}
          onChange={(e) => articleStore.setSearchQuery(e.target.value)}
          startContent={<Icon icon="mdi:magnify" width="20" height="20" />}
          variant="bordered"
        />
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          size="sm"
          color="primary"
          className="flex-1"
          onPress={() => setShowAddNote(!showAddNote)}
        >
          <Icon icon="mdi:plus" width="16" height="16" className="mr-1" />
          {t("add-note")}
        </Button>
      </div>

      {showAddNote && (
        <>
          <div className="mb-2 p-2 bg-background rounded-lg">
            <BlinkoEditor
              mode="create"
              onSended={handleCreateNote}
              withoutOutline={true}
            />
          </div>
          <Divider className="mb-4" />
        </>
      )}

      <ScrollArea className="flex-1">
        {articleStore.isLoadingNotes ? (
          <LoadingAndEmpty isLoading={true} isEmpty={false} />
        ) : filteredAvailableNotes.length === 0 ? (
          <LoadingAndEmpty isLoading={false} isEmpty={true} />
        ) : (
          <div className="space-y-2">
            {filteredAvailableNotes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-background rounded-lg hover:bg-default-100 cursor-pointer transition-colors"
                onClick={() => note.id && handleAddNote(note.id)}
              >
                <div
                  className="text-sm line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: note.content || "",
                  }}
                />
                <div className="text-xs text-default-400 mt-1">
                  {new Date(note.createdAt || "").toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

export default NoteList;