import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * The native navigation-bar search field lives in each tab's Stack header;
 * the screen underneath reads its text from here.
 */
interface ScreenSearchValue {
  query: string;
  setQuery: (q: string) => void;
  /** True while the search field is open, which also reveals the star filter. */
  filtering: boolean;
  setFiltering: (open: boolean) => void;
}

const ScreenSearchContext = createContext<ScreenSearchValue>({
  query: "",
  setQuery: () => {},
  filtering: false,
  setFiltering: () => {},
});

export function ScreenSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [filtering, setFiltering] = useState(false);
  const value = useMemo(
    () => ({ query, setQuery, filtering, setFiltering }),
    [query, filtering],
  );
  return <ScreenSearchContext.Provider value={value}>{children}</ScreenSearchContext.Provider>;
}

export function useScreenSearch() {
  return useContext(ScreenSearchContext);
}
