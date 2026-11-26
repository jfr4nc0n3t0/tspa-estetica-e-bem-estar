import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui";

export type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" para excluir/apagar; "default" para ações comuns */
  tone?: "danger" | "default";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

/** Janela de confirmação do próprio painel (no lugar do aviso cinza do navegador). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    // Foco no "Cancelar": evita excluir sem querer apertando Enter
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [pending, close]);

  const danger = (pending?.tone ?? "danger") === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
          <button type="button" aria-label="Cancelar" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => close(false)} />
          <div className="animate-sheet relative w-full max-w-sm rounded-[1.5rem] bg-background p-5 shadow-2xl">
            <div className="flex gap-3">
              {danger && (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <h2 id="confirm-title" className="font-serif text-2xl font-medium leading-tight">
                  {pending.title}
                </h2>
                {pending.message && <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{pending.message}</div>}
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button ref={cancelRef} variant="outline" onClick={() => close(false)}>
                {pending.cancelLabel ?? "Cancelar"}
              </Button>
              <Button variant={danger ? "destructive" : "primary"} onClick={() => close(true)}>
                {pending.confirmLabel ?? (danger ? "Excluir" : "Confirmar")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
