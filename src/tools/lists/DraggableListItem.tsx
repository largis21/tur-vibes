import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { PiTrash, PiDotsSixVertical, PiPencil } from "react-icons/pi";
import { useLists } from "./context";

interface DraggableListItemProps {
  listId: string;
  itemId: string;
  text: string;
  checked: boolean;
  index: number;
  onMoveItem: (dragIndex: number, hoverIndex: number) => void;
}

export function DraggableListItem({
  listId,
  itemId,
  text,
  checked,
  index,
  onMoveItem,
}: DraggableListItemProps) {
  const { toggleItem, deleteItem, editItem } = useLists();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const [{ isDragging }, drag] = useDrag({
    type: "list-item",
    item: { id: itemId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: "list-item",
    hover: (item: { id: string; index: number }) => {
      if (item.index !== index) {
        onMoveItem(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleSaveEdit = () => {
    if (editedText.trim()) {
      editItem(listId, itemId, editedText);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedText(text);
    setIsEditing(false);
  };

  return (
    <div
      ref={drop}
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-lg border transition-all duration-150 select-none touch-pan-y ${
        isOver
          ? "bg-blue-600/20 border-blue-500"
          : "bg-white/5 border-transparent"
      }`}
      style={{
        opacity: isDragging ? 0.6 : 1,
        WebkitUserSelect: "none",
      }}
    >
      <div
        ref={drag}
        className="flex items-center justify-center cursor-grab flex-shrink-0 select-none"
        style={{
          padding: "8px 0px",
          touchAction: "none",
          WebkitUserSelect: "none",
        }}
      >
        <PiDotsSixVertical size={20} color="rgba(255,255,255,0.5)" />
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleItem(listId, itemId)}
        className="w-4.5 h-4.5 cursor-pointer"
        style={{
          accentColor: "rgb(34, 197, 94)",
          touchAction: "auto",
        }}
      />
      {isEditing ? (
        <input
          type="text"
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveEdit();
            if (e.key === "Escape") handleCancelEdit();
          }}
          autoFocus
          className="flex-1 px-2 py-1 rounded border border-blue-500 bg-blue-600/10 text-white text-sm outline-none"
        />
      ) : (
        <span
          className={`flex-1 text-sm ${
            checked ? "text-white/40 line-through" : "text-white"
          }`}
        >
          {text}
        </span>
      )}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="w-9 h-9 rounded bg-blue-600/10 border-0 flex items-center justify-center cursor-pointer p-0 flex-shrink-0"
          style={{ touchAction: "auto" }}
        >
          <PiPencil size={16} color="#93c5fd" />
        </button>
      )}
      <button
        onClick={() => deleteItem(listId, itemId)}
        className="w-9 h-9 rounded bg-red-600/10 border-0 flex items-center justify-center cursor-pointer p-0 flex-shrink-0"
        style={{ touchAction: "auto" }}
      >
        <PiTrash size={16} color="#ef4444" />
      </button>
    </div>
  );
}
