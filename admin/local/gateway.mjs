// Junta login e API num endereço só (http://localhost:54321) e cuida do CORS, como o Supabase faz.
import http from "node:http";

const routes = [
  { prefix: "/auth/v1", host: "auth", port: 9999 },
  { prefix: "/rest/v1", host: "rest", port: 3000 },
];

function corsHeaders(req) {
  return {
    "access-control-allow-origin": req.headers.origin ?? "*",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*",
    "access-control-expose-headers": "*",
    "access-control-max-age": "3600",
    vary: "Origin",
  };
}

http
  .createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders(req));
      return res.end();
    }
    const route = routes.find((r) => req.url.startsWith(r.prefix));
    if (!route) {
      res.writeHead(404, corsHeaders(req));
      return res.end("not found");
    }
    const upstream = http.request(
      { host: route.host, port: route.port, path: req.url.slice(route.prefix.length) || "/", method: req.method, headers: req.headers },
      (r) => {
        const headers = Object.fromEntries(
          Object.entries(r.headers).filter(([key]) => !key.startsWith("access-control-") && key !== "vary"),
        );
        res.writeHead(r.statusCode ?? 502, { ...headers, ...corsHeaders(req) });
        r.pipe(res);
      },
    );
    upstream.on("error", (err) => {
      res.writeHead(502, corsHeaders(req));
      res.end(String(err));
    });
    req.pipe(upstream);
  })
  .listen(8000, () => console.log("gateway em http://localhost:54321"));
