// Gera as chaves locais (anon e service_role) assinadas com o segredo do docker-compose.yml.
import crypto from "node:crypto";

const SECRET = "tspa-local-jwt-secret-somente-para-testes-0001";
const role = process.argv[2] ?? "anon";
const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const header = b64({ alg: "HS256", typ: "JWT" });
const payload = b64({ iss: "tspa-local", role, iat: 1764115200, exp: 2079475200 });
const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
console.log(`${header}.${payload}.${signature}`);
