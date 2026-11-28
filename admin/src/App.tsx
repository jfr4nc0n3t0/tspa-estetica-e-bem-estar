import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Redirect, Route, Switch } from "wouter";
import { configError, supabase } from "./lib/supabase";
import { AppDataProvider } from "./lib/appData";
import { ConfirmProvider } from "./components/Confirm";
import { ToastProvider } from "./components/Toast";
import { Layout } from "./components/Layout";
import { Spinner } from "./components/ui";
import { Login, NewPassword, NoAccess, SetupNeeded } from "./pages/Auth";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import Clientes from "./pages/Clientes";
import Leads from "./pages/Leads";
import Mais from "./pages/Mais";
import Mensagens from "./pages/Mensagens";

export default function App() {
  if (configError) return <SetupNeeded reason={configError} />;
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthGate />
      </ConfirmProvider>
    </ToastProvider>
  );
}

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovering, setRecovering] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) {
      setIsAdmin(undefined);
      return;
    }
    supabase.rpc("is_admin").then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [userId]);

  if (session === undefined) return <Spinner />;
  if (recovering && session) return <NewPassword onDone={() => setRecovering(false)} />;
  if (!session) return <Login />;
  if (isAdmin === undefined) return <Spinner />;
  if (!isAdmin) return <NoAccess email={session.user.email ?? ""} />;

  return (
    <AppDataProvider email={session.user.email ?? ""}>
      <Layout>
        <Switch>
          <Route path="/agenda" component={Agenda} />
          <Route path="/financeiro" component={Financeiro} />
          <Route path="/clientes" component={Clientes} />
          <Route path="/leads" component={Leads} />
          <Route path="/mais" component={Mais} />
          <Route path="/mais/mensagens" component={Mensagens} />
          <Route>
            <Redirect to="/agenda" />
          </Route>
        </Switch>
      </Layout>
    </AppDataProvider>
  );
}
