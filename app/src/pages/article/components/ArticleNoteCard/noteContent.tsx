import { MarkdownRender } from '@/components/Common/MarkdownRender';
import { Note } from '@shared/lib/types';
import { BlinkoStore } from '@/store/blinkoStore';
import { observer } from 'mobx-react-lite';
import { FilesAttachmentRender } from '@/components/Common/AttachmentRender';

interface NoteContentProps {
  blinkoItem: Note;
  blinko: BlinkoStore;
  isExpanded?: boolean;
  isShareMode?: boolean;
  readOnly?: boolean;
}

export const NoteContent = observer(({ blinkoItem, blinko, isExpanded, isShareMode, readOnly }: NoteContentProps) => {
  return (
    <>
      <MarkdownRender
        content={blinkoItem.content}
        onChange={readOnly || isShareMode ? undefined : (newContent) => {
          blinkoItem.content = newContent
          blinko.upsertNote.call({ id: blinkoItem.id, content: newContent, refresh: false })
        }}
        isShareMode={isShareMode}
        largeSpacing={isShareMode || isExpanded}
      />
      <div className={blinkoItem.attachments?.length != 0 ? 'my-2' : ''}>
        <FilesAttachmentRender files={blinkoItem.attachments ?? []} preview />
      </div>
    </>
  );
});