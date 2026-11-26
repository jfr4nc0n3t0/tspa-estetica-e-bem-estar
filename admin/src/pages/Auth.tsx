import { useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/errors";
import { Button, Field, Input } from "../components/ui";

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <img src="/logo.png" alt="TSpa — Refúgio do Corpo e da Alma" className="mx-auto mb-8 w-32 dark:brightness-0 dark:invert dark:opacity-80" />
        <h1 className="text-center font-serif text-4xl font-medium">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(friendlyError(error));
    setLoading(false);
  }

  async function onForgot() {
    if (!email.trim()) {
      setError("Digite o seu e-mail acima e toque de novo em “Esqueci a senha”.");
      return;
    }
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
    if (error) setError(friendlyError(error));
    else setInfo("Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.");
  }

  return (
    <AuthShell title="Um tempo para você." subtitle="Entre para cuidar da agenda do TSpa.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="E-mail">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-primary">{info}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
        <button type="button" onClick={onForgot} className="w-full text-center text-sm text-muted-foreground underline-offset-2 hover:underline">
          Esqueci a senha
        </button>
      </form>
    </AuthShell>
  );
}

export function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) setError(friendlyError(error));
    else onDone();
  }

  return (
    <AuthShell title="Nova senha" subtitle="Escolha uma senha forte, com pelo menos 8 caracteres.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Nova senha">
          <Input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Salvar senha
        </Button>
      </form>
    </AuthShell>
  );
}

export function NoAccess({ email }: { email: string }) {
  return (
    <AuthShell
      title="Acesso não liberado"
      subtitle={
        <>
          O e-mail <strong>{email}</strong> entrou, mas não está cadastrado como dona do painel. No Supabase, rode a última
          parte do script SQL com este e-mail (veja o passo a passo no README).
        </>
      }
    >
      <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
        Sair
      </Button>
    </AuthShell>
  );
}

export function SetupNeeded({ reason }: { reason: string }) {
  return (
    <AuthShell
      title={reason === "secret" ? "Chave errada" : "Falta configurar"}
      subtitle={
        reason === "secret" ? (
          <>
            A chave colocada é a <strong>secreta</strong> (secret/service_role). Ela nunca pode ficar no painel. Troque por
            a chave <strong>pública</strong> (publishable/anon) e, por segurança, gere uma nova chave secreta no Supabase.
          </>
        ) : (
          <>
            Preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLIC_KEY</code> (no arquivo
            <code> admin/.env.local</code> ou nas variáveis de ambiente do Render) e publique de novo.
          </>
        )
      }
    >
      <span />
    </AuthShell>
  );
}
