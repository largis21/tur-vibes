import { useState, useCallback, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { PiX, PiPlus, PiTrash, PiArrowLeft } from "react-icons/pi";
import { useActiveTool } from "../../lib/ActiveToolContext";
import { useLists } from "./context";
import { DraggableListItem } from "./DraggableListItem";

// Use TouchBackend which supports both touch and mouse events
const backend =
  typeof window !== "undefined" && "ontouchstart" in window
    ? TouchBackend
    : HTML5Backend;

export function ListsOverlay() {
  const { deactivateTool } = useActiveTool();
  const {
    lists,
    selectedListId,
    selectList,
    addList,
    deleteList,
    renameList,
    addItem,
    reorderItems,
    resetListCheckmarks,
  } = useLists();

  const [newListName, setNewListName] = useState("");
  const [newItemText, setNewItemText] = useState("");
  const [editingListName, setEditingListName] = useState(false);
  const [editingListNameText, setEditingListNameText] = useState("");
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const selectedList = lists.find((l) => l.id === selectedListId);

  const handleCreateList = () => {
    if (newListName.trim()) {
      addList(newListName);
      setNewListName("");
    }
  };

  const handleAddItem = () => {
    if (selectedList && newItemText.trim()) {
      addItem(selectedList.id, newItemText);
      setNewItemText("");
      newItemInputRef.current?.focus();
    }
  };

  const handleStartEditingListName = () => {
    if (selectedList) {
      setEditingListName(true);
      setEditingListNameText(selectedList.name);
    }
  };

  const handleSaveListName = () => {
    if (editingListNameText.trim() && selectedList) {
      renameList(selectedList.id, editingListNameText);
      setEditingListName(false);
    }
  };

  const handleCancelEditingListName = () => {
    setEditingListName(false);
    setEditingListNameText("");
  };

  const handleMoveItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (selectedList) {
        reorderItems(selectedList.id, dragIndex, hoverIndex);
      }
    },
    [selectedList, reorderItems],
  );

  return (
    <DndProvider backend={backend}>
      {/* Clickable background to close tool */}
      <div
        onClick={() => {
          selectList(null);
          deactivateTool();
        }}
        className="absolute inset-0 z-10 cursor-pointer"
      />
      {/* Modal */}
      <div className="absolute left-4 right-4 top-4 max-h-[70vh] bg-dark-900/94 rounded-2xl p-4 flex flex-col gap-3 z-20 overflow-hidden">
        {selectedList ? (
          // List Details View
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => selectList(null)}
                className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center border-0 cursor-pointer"
              >
                <PiArrowLeft
                  size={20}
                  color="#fff"
                  className="block flex-shrink-0"
                />
              </button>
              <div className="flex-1 min-w-0">
                {editingListName ? (
                  <input
                    type="text"
                    value={editingListNameText}
                    onChange={(e) => setEditingListNameText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveListName();
                      if (e.key === "Escape") handleCancelEditingListName();
                    }}
                    autoFocus
                    className="w-full px-3 py-2 rounded-2 border-1 border-blue-500 bg-blue-600/10 text-white text-base font-black outline-none"
                  />
                ) : (
                  <div
                    onClick={handleStartEditingListName}
                    className="text-white text-base font-black cursor-pointer px-2 py-1 rounded transition-colors duration-200"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {selectedList.name}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  selectList(null);
                  deactivateTool();
                }}
                className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center border-0 cursor-pointer"
              >
                <PiX size={20} color="#fff" className="block flex-shrink-0" />
              </button>
            </div>

            {/* New Item Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={newItemInputRef}
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                placeholder="Add item..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={handleAddItem}
                disabled={!newItemText.trim()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgb(34, 197, 94)",
                  color: "#fff",
                  border: "none",
                  cursor: newItemText.trim() ? "pointer" : "not-allowed",
                  opacity: newItemText.trim() ? 1 : 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <PiPlus size={16} />
                Add
              </button>
            </div>

            {/* Items Info and Clear Button */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 12,
                }}
              >
                {selectedList.items.length} item
                {selectedList.items.length !== 1 ? "s" : ""}
              </div>
              {selectedList.items.length > 0 && (
                <button
                  onClick={() => resetListCheckmarks(selectedList.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "rgba(59, 130, 246, 0.2)",
                    color: "#93c5fd",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Reset List
                </button>
              )}
            </div>

            {/* Items List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
                touchAction: "pan-y",
              }}
            >
              {selectedList.items.length === 0 ? (
                <div
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  No items yet. Add one to get started!
                </div>
              ) : (
                selectedList.items.map((item, index) => (
                  <DraggableListItem
                    key={item.id}
                    listId={selectedList.id}
                    itemId={item.id}
                    text={item.text}
                    checked={item.checked}
                    index={index}
                    onMoveItem={handleMoveItem}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          // Lists View
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>
                  Lists
                </div>
              </div>
              <button
                onClick={() => {
                  selectList(null);
                  deactivateTool();
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <PiX
                  size={20}
                  color="#fff"
                  style={{ display: "block", flexShrink: 0 }}
                />
              </button>
            </div>

            {/* New List Input */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                placeholder="New list name..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgb(59, 130, 246)",
                  color: "#fff",
                  border: "none",
                  cursor: newListName.trim() ? "pointer" : "not-allowed",
                  opacity: newListName.trim() ? 1 : 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <PiPlus size={16} />
                Create
              </button>
            </div>

            {/* Lists Section */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                overflowY: "auto",
                flex: 1,
                minHeight: 0,
              }}
            >
              {lists.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  No lists yet. Create one to get started!
                </div>
              ) : (
                lists.map((list) => {
                  const listCompletedItems = list.items.filter(
                    (item) => item.checked,
                  ).length;
                  const listTotalItems = list.items.length;

                  return (
                    <div
                      key={list.id}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 10,
                        padding: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => selectList(list.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: 600,
                              marginBottom: 2,
                            }}
                          >
                            {list.name}
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.6)",
                              fontSize: 12,
                            }}
                          >
                            {listCompletedItems}/{listTotalItems} done
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteList(list.id);
                          }}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 6,
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <PiTrash size={18} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </DndProvider>
  );
}
