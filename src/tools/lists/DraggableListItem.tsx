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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 6px",
        background: isOver
          ? "rgba(59, 130, 246, 0.2)"
          : "rgba(255,255,255,0.05)",
        borderRadius: 8,
        border: isOver
          ? "1px solid rgb(59, 130, 246)"
          : "1px solid transparent",
        opacity: isDragging ? 0.6 : 1,
        transition: "all 0.15s ease-in-out",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "pan-y",
      }}
    >
      <div
        ref={drag}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          padding: "8px 0px",
          flexShrink: 0,
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        <PiDotsSixVertical size={20} color="rgba(255,255,255,0.5)" />
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggleItem(listId, itemId)}
        style={{
          width: 18,
          height: 18,
          cursor: "pointer",
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
          style={{
            flex: 1,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid rgb(59, 130, 246)",
            background: "rgba(59, 130, 246, 0.1)",
            color: "#fff",
            fontSize: 14,
            outline: "none",
          }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            color: checked ? "rgba(255,255,255,0.4)" : "#fff",
            textDecoration: checked ? "line-through" : "none",
            fontSize: 14,
          }}
        >
          {text}
        </span>
      )}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            background: "rgba(59, 130, 246, 0.1)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            touchAction: "auto",
          }}
        >
          <PiPencil size={16} color="#93c5fd" />
        </button>
      )}
      <button
        onClick={() => deleteItem(listId, itemId)}
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          background: "rgba(239, 68, 68, 0.1)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          touchAction: "auto",
        }}
      >
        <PiTrash size={16} color="#ef4444" />
      </button>
    </div>
  );
}
