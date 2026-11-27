import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cx } from "./ui";

type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; message: string; kind: "ok" | "error"; action?: ToastAction };
type ShowToast = (message: string, kind?: Toast["kind"], action?: ToastAction) => void;
const ToastContext = createContext<ShowToast>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const show = useCallback<ShowToast>(
    (message, kind = "ok", action) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, kind, action }]);
      // Com botão (ex.: Desfazer) fica um pouco mais na tela
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : action ? 6000 : 3000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "animate-sheet flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg",
              t.action && "pointer-events-auto",
              t.kind === "ok" ? "bg-forest text-nude dark:bg-card dark:text-foreground" : "bg-danger text-danger-foreground",
            )}
          >
            <span>{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-full px-2 py-0.5 font-semibold underline underline-offset-2 hover:bg-white/10"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
