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

  // Only "/" exists; any other path gets a real 404 status (the client renders the not-found page).
  app.use("*", (req, res) => {
    if (req.originalUrl.split("?")[0] !== "/") res.status(404);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
