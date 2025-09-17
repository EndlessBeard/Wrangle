import { createContext, useContext, useEffect, useState } from 'react';
import localforage from 'localforage';

const ListManagerContext = createContext();

export function useListManager() {
  return useContext(ListManagerContext);
}

export function ListManagerProvider({ children }) {
  const [lists, setLists] = useState([]);

  // configure a localforage instance
  const store = localforage.createInstance({ name: 'wrangle', storeName: 'lists' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // migrate legacy localStorage key if present
        const legacy = localStorage.getItem('wrangle_lists');
        if (legacy) {
          try {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed)) {
              await store.setItem('wrangle_lists', parsed);
              localStorage.removeItem('wrangle_lists');
            }
          } catch (e) {}
        }

        const stored = await store.getItem('wrangle_lists');
        if (stored && Array.isArray(stored)) {
          if (mounted) setLists(stored);
          return;
        }

        const res = await fetch('/lists.json');
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const initial = Array.isArray(data) ? data : [];
        if (mounted) setLists(initial);
        await store.setItem('wrangle_lists', initial);
      } catch (err) {
        if (mounted) setLists([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const persist = async (next) => {
    try { await store.setItem('wrangle_lists', next); } catch (e) {}
  };

  const addList = (newList) => {
    setLists((prev) => {
      const next = [...prev, newList];
      persist(next);
      return next;
    });
  };

  const updateList = (indexOrPredicate, updated) => {
    setLists((prev) => {
      const next = prev.map((item, idx) => {
        if ((typeof indexOrPredicate === 'number' && idx === indexOrPredicate) ||
            (typeof indexOrPredicate === 'function' && indexOrPredicate(item, idx))) {
          return { ...item, ...updated };
        }
        return item;
      });
      persist(next);
      return next;
    });
  };

  const removeList = (index) => {
    setLists((prev) => {
      const next = prev.filter((_, i) => i !== index);
      persist(next);
      return next;
    });
  };
  return (
    <ListManagerContext.Provider value={{ lists, addList, updateList, removeList }}>
      {children}
    </ListManagerContext.Provider>
  );
}
