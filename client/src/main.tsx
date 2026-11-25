import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root")!;

// The production build ships the home page pre-rendered (see script/build.ts):
// hydrate it there; render from scratch in dev or on any other path.
if (root.firstElementChild && window.location.pathname === "/") {
  hydrateRoot(root, <App />);
} else {
  root.innerHTML = "";
  createRoot(root).render(<App />);
}
