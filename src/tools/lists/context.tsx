import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { STORAGE_KEYS, usePersistedState } from "../../lib/storage";
import { z } from "zod";

const ListItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  checked: z.boolean(),
});

const ListSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(ListItemSchema),
  createdAt: z.number(),
});

export type ListItem = z.infer<typeof ListItemSchema>;
export type List = z.infer<typeof ListSchema>;

function isListArray(value: unknown): value is List[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    try {
      ListSchema.parse(item);
      return true;
    } catch {
      return false;
    }
  });
}

type ListsContextValue = {
  lists: List[];
  addList: (name: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  addItem: (listId: string, text: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  editItem: (listId: string, itemId: string, text: string) => void;
  reorderItems: (listId: string, fromIndex: number, toIndex: number) => void;
  resetListCheckmarks: (listId: string) => void;
  selectedListId: string | null;
  selectList: (id: string | null) => void;
};

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = usePersistedState<List[]>(STORAGE_KEYS.lists, [], {
    validate: isListArray,
  });
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const addList = useCallback(
    (name: string) => {
      const id = `list-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const newList: List = {
        id,
        name,
        items: [],
        createdAt: Date.now(),
      };
      setLists((prev) => [...prev, newList]);
      setSelectedListId(id);
    },
    [setLists],
  );

  const deleteList = useCallback(
    (id: string) => {
      setLists((prev) => prev.filter((list) => list.id !== id));
      if (selectedListId === id) {
        setSelectedListId(null);
      }
    },
    [setLists, selectedListId],
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      setLists((prev) =>
        prev.map((list) => (list.id === id ? { ...list, name } : list)),
      );
    },
    [setLists],
  );

  const addItem = useCallback(
    (listId: string, text: string) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return {
              ...list,
              items: [...list.items, { id: itemId, text, checked: false }],
            };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const deleteItem = useCallback(
    (listId: string, itemId: string) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const toggleItem = useCallback(
    (listId: string, itemId: string) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const editItem = useCallback(
    (listId: string, itemId: string, text: string) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, text } : item,
              ),
            };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const reorderItems = useCallback(
    (listId: string, fromIndex: number, toIndex: number) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            const newItems = [...list.items];
            const [removed] = newItems.splice(fromIndex, 1);
            newItems.splice(toIndex, 0, removed);
            return { ...list, items: newItems };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const resetListCheckmarks = useCallback(
    (listId: string) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id === listId) {
            return {
              ...list,
              items: list.items.map((item) => ({ ...item, checked: false })),
            };
          }
          return list;
        }),
      );
    },
    [setLists],
  );

  const selectList = useCallback((id: string | null) => {
    setSelectedListId(id);
  }, []);

  return (
    <ListsContext.Provider
      value={{
        lists,
        addList,
        deleteList,
        renameList,
        addItem,
        deleteItem,
        toggleItem,
        editItem,
        reorderItems,
        resetListCheckmarks,
        selectedListId,
        selectList,
      }}
    >
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error("useLists must be used within ListsProvider");
  }
  return context;
}
