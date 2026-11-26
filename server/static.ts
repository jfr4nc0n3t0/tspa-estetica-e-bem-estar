import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Only these pages exist; any other path gets a real 404 status (the client renders the not-found page).
  const pages = new Set(["/", "/agendar"]);
  app.use("*", (req, res) => {
    const pathname = req.originalUrl.split("?")[0].replace(/(.)\/$/, "$1");
    if (!pages.has(pathname)) res.status(404);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
