import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, Ellipsis, Sprout, Users, Wallet } from "lucide-react";
import { cx } from "./ui";

const NAV = [
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/leads", label: "Leads", icon: Sprout },
  { href: "/mais", label: "Mais", icon: Ellipsis },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isActive = (href: string) => location === href || location.startsWith(`${href}/`);

  return (
    <div className="min-h-[100svh] md:flex">
      {/* Computador: barra lateral */}
      <aside className="sticky top-0 hidden h-[100svh] w-60 shrink-0 flex-col border-r border-border/70 bg-card/60 px-4 py-6 md:flex">
        <img src="/logo.png" alt="TSpa" className="mx-2 mb-1 w-24 dark:brightness-0 dark:invert dark:opacity-80" />
        <p className="mx-2 mb-8 text-xs uppercase tracking-[0.24em] text-muted-foreground">Painel</p>
        <nav className="flex flex-col gap-1" aria-label="Principal">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cx(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-[0.95rem] font-medium transition-colors",
                isActive(href) ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-muted",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-2 font-serif text-lg italic text-muted-foreground">Desacelere. Respire.</p>
      </aside>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>

      {/* Celular: barra inferior */}
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 backdrop-blur-xl md:hidden"
        aria-label="Principal"
      >
        <div className="mx-auto flex max-w-lg">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cx("flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[0.7rem] font-medium", active ? "text-primary" : "text-muted-foreground")}
                aria-current={active ? "page" : undefined}
              >
                <span className={cx("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-primary/12 bg-primary/10")}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
