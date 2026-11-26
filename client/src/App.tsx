import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import Agendar from "@/pages/Agendar";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/agendar" component={Agendar} />
      <Route component={NotFound} />
    </Switch>
  );
}
