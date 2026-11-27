// Gera as chaves das notificações (VAPID) e um segredo para o agendador.
// Uso:  npm --prefix admin run push:keys
// Guarde a saída num lugar seguro. A chave PRIVADA e o CRON_SECRET nunca vão para o repositório nem para chats.
import { generateKeyPairSync, randomBytes } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pub = publicKey.export({ format: "jwk" });
const priv = privateKey.export({ format: "jwk" });
const b64 = (s) => Buffer.from(s, "base64url");
const publicRaw = Buffer.concat([Buffer.from([4]), b64(pub.x), b64(pub.y)]).toString("base64url");

console.log(`
Cloudflare Pages → projeto do painel (tspa-admin) → Variables and Secrets:
  VITE_VAPID_PUBLIC_KEY = ${publicRaw}

Supabase → Edge Functions → Secrets:
  VAPID_PUBLIC_KEY  = ${publicRaw}
  VAPID_PRIVATE_KEY = ${priv.d}
  VAPID_SUBJECT     = mailto:SEU-EMAIL
  CRON_SECRET       = ${randomBytes(24).toString("base64url")}

O mesmo CRON_SECRET vai no agendador (passo 5 de admin/NOTIFICACOES.md), colado direto no SQL Editor.
`);
