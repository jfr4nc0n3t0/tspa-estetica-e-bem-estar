import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? "";

export type PushState =
  | "unsupported" // navegador sem notificações
  | "ios-install" // iPhone/iPad fora do app instalado
  | "not-configured" // falta a chave pública no build
  | "denied" // bloqueadas nas configurações
  | "off" // pode ativar
  | "on"; // ativadas neste aparelho

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* sem service worker, só as notificações ficam indisponíveis */
      });
    });
  }
}

/** Registro do service worker (registra se ainda não houver). Lança erro se o navegador recusar. */
async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
}

async function currentSubscription() {
  return (await registration()).pushManager.getSubscription();
}

export async function getPushState(): Promise<PushState> {
  const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!supported) return isIos() && !isStandalone() ? "ios-install" : "unsupported";
  if (!VAPID_PUBLIC_KEY) return "not-configured";
  if (Notification.permission === "denied") return "denied";
  try {
    return (await currentSubscription()) ? "on" : "off";
  } catch {
    return "unsupported";
  }
}

function deviceName() {
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) return "iPhone";
  if (/ipad/i.test(ua)) return "iPad";
  if (/android/i.test(ua)) return "Android";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows";
  return "Navegador";
}

function keyToBytes(base64url: string) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/** Pede permissão, inscreve este aparelho e salva no banco. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "Notificações bloqueadas. Libere nas configurações do celular." : "Permissão não concedida.");
  await registration();
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY) }));
  const json = sub.toJSON();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, device: deviceName() }, { onConflict: "endpoint" });
  if (error) {
    await sub.unsubscribe().catch(() => {});
    throw error;
  }
}

/** Para de receber neste aparelho. */
export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/** Pede para a função mandar uma notificação de teste para os aparelhos ativados. */
export async function sendTestPush() {
  const { error } = await supabase.functions.invoke("push-agenda", { body: { action: "test" } });
  if (!error) return;
  // Mostra o motivo que a função devolveu (ex.: segredo faltando, login não reconhecido)
  const response = (error as { context?: Response }).context;
  let reason = "";
  if (response && typeof response.json === "function") {
    reason = await response.json().then((b: { error?: string }) => b?.error ?? "", () => "");
    if (!reason) reason = `a função respondeu ${response.status}`;
  } else {
    reason = "a função push-agenda não respondeu. Confira se ela foi publicada no Supabase";
  }
  throw new Error(`Não consegui enviar o teste: ${reason}`);
}
