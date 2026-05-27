import { BlinkoCard } from "@/components/BlinkoCard";
import Icon from "@/components/Common/Iconify/icons";
import { useSortable } from "@dnd-kit/sortable";
import { Button } from "@heroui/react";
import { Note } from "@shared/lib/types";
import { observer } from "mobx-react-lite";

interface SortableSectionProps {
  section: { noteId: number; order: number; note?: Note };
  onRemove: (noteId: number) => void;
}

const SortableSection = observer(
  ({ section, onRemove }: SortableSectionProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: section.noteId });

    return (
      <div ref={setNodeRef} className="relative group mb-4">
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
  },
);

export default SortableSection;
