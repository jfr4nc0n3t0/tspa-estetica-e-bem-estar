// Build-time prerender: renders the home page to static HTML so search engines
// and link previews see the full content without running JavaScript.
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "./App";

export function render(path = "/") {
  return renderToString(
    <Router ssrPath={path}>
      <App />
    </Router>,
  );
}
