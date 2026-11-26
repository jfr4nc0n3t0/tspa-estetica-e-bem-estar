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

// `--static`: só o site (para o Cloudflare Pages); sem ele, também gera o servidor (Render)
const staticOnly = process.argv.includes("--static");

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("prerendering pages...");
  await prerender();

  if (staticOnly) {
    console.log("static build done: dist/public");
    return;
  }

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

  // /agendar: página própria (agendar.html) com título e descrição dela
  const agendar = withMeta(template, {
    title: "Agende seu momento | TSpa · Refúgio do Corpo e da Alma",
    description:
      "Deixe seu nome e WhatsApp e o TSpa chama você para encontrar o melhor horário. Head Spa, massagens e rituais em João Pessoa.",
    url: "https://tspa.com.br/agendar",
  });
  await writeFile(path.resolve("dist/public/agendar.html"), agendar.replace("<!--app-html-->", render("/agendar")));

  // 404.html: qualquer endereço que não existe recebe "Página não encontrada" com status 404
  const notFound = withMeta(template, { title: "Página não encontrada | TSpa" }).replace(
    /<meta name="robots"[^>]*>/,
    '<meta name="robots" content="noindex" />',
  );
  await writeFile(path.resolve("dist/public/404.html"), notFound.replace("<!--app-html-->", ""));

  await rm(ssrOut, { recursive: true, force: true });
}

function withMeta(html: string, meta: { title: string; description?: string; url?: string }) {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
  if (meta.description) {
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, `$1${meta.description}$2`);
  }
  if (meta.url) {
    out = out
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${meta.url}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${meta.url}$2`);
  }
  return out;
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
