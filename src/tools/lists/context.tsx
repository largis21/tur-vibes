import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { safeGetItem, safeSetItem } from "../../lib/storage";

const STORAGE_KEY = "tur-vibes:lists";

export type ListItem = {
  id: string;
  text: string;
  checked: boolean;
};

export type List = {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: number;
};

function loadLists(): List[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as List[]) : [];
  } catch {
    return [];
  }
}

function saveLists(lists: List[]) {
  safeSetItem(STORAGE_KEY, JSON.stringify(lists));
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
  const [lists, setLists] = useState<List[]>(loadLists);
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
      const updated = [...lists, newList];
      setLists(updated);
      saveLists(updated);
      setSelectedListId(id);
    },
    [lists],
  );

  const deleteList = useCallback(
    (id: string) => {
      const updated = lists.filter((list) => list.id !== id);
      setLists(updated);
      saveLists(updated);
      if (selectedListId === id) {
        setSelectedListId(null);
      }
    },
    [lists, selectedListId],
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      const updated = lists.map((list) =>
        list.id === id ? { ...list, name } : list,
      );
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const addItem = useCallback(
    (listId: string, text: string) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          return {
            ...list,
            items: [...list.items, { id: itemId, text, checked: false }],
          };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const deleteItem = useCallback(
    (listId: string, itemId: string) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.filter((item) => item.id !== itemId),
          };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const toggleItem = useCallback(
    (listId: string, itemId: string) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, checked: !item.checked } : item,
            ),
          };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const editItem = useCallback(
    (listId: string, itemId: string, text: string) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, text } : item,
            ),
          };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const reorderItems = useCallback(
    (listId: string, fromIndex: number, toIndex: number) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          const newItems = [...list.items];
          const [removed] = newItems.splice(fromIndex, 1);
          newItems.splice(toIndex, 0, removed);
          return { ...list, items: newItems };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
  );

  const resetListCheckmarks = useCallback(
    (listId: string) => {
      const updated = lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            items: list.items.map((item) => ({ ...item, checked: false })),
          };
        }
        return list;
      });
      setLists(updated);
      saveLists(updated);
    },
    [lists],
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
