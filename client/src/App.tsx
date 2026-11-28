import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import Agendar from "@/pages/Agendar";
import NotFound from "@/pages/not-found";
import { useSiteMessages } from "@/lib/messages";

export default function App() {
  // Textos dos botões de WhatsApp editados no painel (Mais → Mensagens)
  useSiteMessages();
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agendar" component={Agendar} />
      <Route component={NotFound} />
    </Switch>
  );
}
