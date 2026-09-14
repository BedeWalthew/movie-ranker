import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { getDatabase } from "@/lib/database";
import { importMoviesFromCsv } from "@/lib/importService";
import { WORKER_URL } from "@/lib/constants";
import { useRefresh } from "@/lib/refreshContext";
import { ImportOverlay } from "@/lib/components/ImportOverlay";

export type ImportPhase = "idle" | "reading" | "fetching" | "done" | "failed";

export interface ImportState {
  phase: ImportPhase;
  current: number;
  total: number;
  latestTitle: string | null;
  imported: number;
  skipped: number;
  error: string | null;
}

const IDLE: ImportState = {
  phase: "idle",
  current: 0,
  total: 0,
  latestTitle: null,
  imported: 0,
  skipped: 0,
  error: null,
};

interface ImportContextValue {
  state: ImportState;
  /** Runs an import and shows the reel-loading sheet until it finishes. */
  startImport: (csvContent: string) => Promise<void>;
  dismiss: () => void;
}

const ImportContext = createContext<ImportContextValue>({
  state: IDLE,
  startImport: async () => {},
  dismiss: () => {},
});

/** How often the lists behind the sheet refresh while films arrive. */
const REFRESH_EVERY = 10;

export function ImportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImportState>(IDLE);
  const running = useRef(false);
  const { triggerRefresh } = useRefresh();

  const startImport = useCallback(
    async (csvContent: string) => {
      if (running.current) return;
      running.current = true;
      setState({ ...IDLE, phase: "reading" });
      try {
        const db = await getDatabase();
        const result = await importMoviesFromCsv(db, csvContent, WORKER_URL, (p) => {
          setState((s) => ({
            ...s,
            phase: "fetching",
            current: p.current,
            total: p.total,
            latestTitle: p.title ?? s.latestTitle,
          }));
          if (p.current % REFRESH_EVERY === 0) triggerRefresh();
        });
        triggerRefresh();
        setState((s) => ({
          ...s,
          phase: "done",
          current: result.imported,
          total: result.imported,
          imported: result.imported,
          skipped: result.skipped,
        }));
      } catch (error) {
        triggerRefresh();
        setState((s) => ({
          ...s,
          phase: "failed",
          error: error instanceof Error ? error.message : String(error),
        }));
      } finally {
        running.current = false;
      }
    },
    [triggerRefresh],
  );

  const dismiss = useCallback(() => {
    if (running.current) return;
    setState(IDLE);
  }, []);

  const value = useMemo(() => ({ state, startImport, dismiss }), [state, startImport, dismiss]);

  return (
    <ImportContext.Provider value={value}>
      {children}
      <ImportOverlay state={state} onDismiss={dismiss} />
    </ImportContext.Provider>
  );
}

export function useImport() {
  return useContext(ImportContext);
}
