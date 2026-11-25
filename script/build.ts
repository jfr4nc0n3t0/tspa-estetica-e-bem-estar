import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("prerendering home page...");
  await prerender();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

// Renders the home page at build time and injects the HTML into dist/public/index.html,
// so crawlers and link previews get the full content without running JavaScript.
async function prerender() {
  const ssrOut = path.resolve("dist/ssr");
  await viteBuild({
    logLevel: "warn",
    build: { ssr: "src/entry-server.tsx", outDir: ssrOut, emptyOutDir: true },
  });
  const { render } = await import(pathToFileURL(path.join(ssrOut, "entry-server.js")).href);
  const indexPath = path.resolve("dist/public/index.html");
  const template = await readFile(indexPath, "utf-8");
  if (!template.includes("<!--app-html-->")) throw new Error("index.html is missing the <!--app-html--> placeholder");
  await writeFile(indexPath, template.replace("<!--app-html-->", render("/")));
  await rm(ssrOut, { recursive: true, force: true });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
