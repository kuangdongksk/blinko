import Editor from "@/components/Common/Editor";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { Note } from "@shared/lib/types";
import dayjs from "@/lib/dayjs";
import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";

interface ArticleBlinkoEditorProps {
  mode: "create" | "edit";
  onSended?: (note?: Note) => void | Promise<void>;
  withoutOutline?: boolean;
}

/**
 * BlinkoEditor 的独立副本，用于文章页面。
 * 与原版区别：create 模式下不执行导航（原版会跳转到首页或笔记列表）。
 */
export const ArticleBlinkoEditor = observer(
  ({ mode, onSended, withoutOutline }: ArticleBlinkoEditorProps) => {
    const isCreateMode = mode === "create";
    const blinko = RootStore.Get(BlinkoStore);
    const editorRef = useRef<any>(null);

    const store = RootStore.Local(() => ({
      get noteContent() {
        if (isCreateMode) {
          try {
            const local = blinko.createContentStorage.value;
            const blinkoContent = blinko.noteContent;
            return local?.content !== "" ? local?.content : blinkoContent;
          } catch {
            return "";
          }
        } else {
          try {
            if (!blinko.curSelectedNote) return "";
            const local = blinko.editContentStorage.list?.find(
              (i) => Number(i.id) === Number(blinko.curSelectedNote!.id),
            );
            const blinkoContent = blinko.curSelectedNote?.content ?? "";
            return local?.content !== ""
              ? local?.content ?? blinkoContent
              : blinkoContent;
          } catch {
            return "";
          }
        }
      },
      set noteContent(v: string) {
        if (isCreateMode) {
          try {
            blinko.noteContent = v;
            blinko.createContentStorage.save({ content: v });
          } catch (error) {
            console.error(error);
          }
        } else {
          try {
            if (!blinko.curSelectedNote) return;
            blinko.curSelectedNote.content = v;
            const hasLocal = blinko.editContentStorage.list?.find(
              (i) => Number(i.id) === Number(blinko.curSelectedNote!.id),
            );
            if (hasLocal) {
              hasLocal.content = v;
              blinko.editContentStorage.save();
            } else {
              blinko.editContentStorage.push({
                content: v,
                id: Number(blinko.curSelectedNote!.id),
              });
            }
          } catch (error) {
            console.error(error);
          }
        }
      },
      get files(): any {
        if (isCreateMode) {
          const attachments = blinko.createAttachmentsStorage.list;
          return attachments.length ? attachments : [];
        } else {
          return blinko.curSelectedNote?.attachments;
        }
      },
    }));

    useEffect(() => {
      blinko.isCreateMode = isCreateMode;
      if (isCreateMode) {
        const local = blinko.createContentStorage.value;
        if (local && local.content !== "") {
          blinko.noteContent = local.content;
        }
      } else {
        try {
          if (!blinko.curSelectedNote) return;
          const local = blinko.editContentStorage.list?.find(
            (i) => Number(i.id) === Number(blinko.curSelectedNote!.id),
          );
          if (local && local?.content !== "") {
            blinko.curSelectedNote.content = local.content;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }, [mode]);

    return (
      <div
        className={`h-full flex flex-col ${withoutOutline ? "" : ""}`}
        ref={editorRef}
        id="global-editor"
        data-tauri-drag-region
        onClick={() => {
          blinko.isCreateMode = isCreateMode;
        }}
      >
        <Editor
          mode={mode}
          originFiles={store.files}
          originReference={
            !isCreateMode
              ? blinko.curSelectedNote?.references?.map((i) => i.toNoteId)
              : []
          }
          content={store.noteContent}
          onChange={(v) => {
            store.noteContent = v;
          }}
          withoutOutline={withoutOutline}
          onHeightChange={() => {
            if (editorRef.current) {
              const editorElement = document.getElementById("global-editor");
              if (editorElement && editorElement.children[0]) {
                try {
                  (editorElement as any).__storeInstance =
                    (editorElement.children[0] as any).__storeInstance;
                } catch {}
              }
            }
          }}
          isSendLoading={blinko.upsertNote.loading.value}
          bottomSlot={
            isCreateMode ? (
              <div className="text-xs text-ignore ml-2">
                Drop to upload files
              </div>
            ) : blinko.curSelectedNote?.createdAt ? (
              <div className="text-xs text-desc">
                {dayjs(blinko.curSelectedNote.createdAt).format(
                  "YYYY-MM-DD hh:mm:ss",
                )}
              </div>
            ) : (
              <></>
            )
          }
          onSend={async ({ files, references, noteType, metadata }) => {
            if (isCreateMode) {
              await blinko.upsertNote.call({
                type: noteType,
                references,
                refresh: false,
                content: blinko.noteContent,
                //@ts-ignore
                attachments: files.map((i) => ({
                  name: i.name,
                  path: i.uploadPath,
                  size: i.size,
                  type: i.type,
                })),
                metadata,
              });
              blinko.createAttachmentsStorage.clear();
              blinko.createContentStorage.clear();
              blinko.updateTicker++;
            } else {
              if (!blinko.curSelectedNote) return;
              await blinko.upsertNote.call({
                id: blinko.curSelectedNote.id,
                type: noteType,
                //@ts-ignore
                content: blinko.curSelectedNote.content,
                //@ts-ignore
                attachments: files.map((i) => ({
                  name: i.name,
                  path: i.uploadPath,
                  size: i.size,
                  type: i.type,
                })),
                references,
                metadata,
                refresh: true,
              });
              try {
                const index = blinko.editAttachmentsStorage.list?.findIndex(
                  (i) => i.id === blinko.curSelectedNote!.id,
                );
                if (index != null && index !== -1) {
                  blinko.editAttachmentsStorage.remove(index);
                  blinko.editContentStorage.remove(index);
                }
              } catch (error) {
                console.error(error);
              }
            }
            onSended?.(blinko.upsertNote.value as Note | undefined);
          }}
        />
      </div>
    );
  },
);
