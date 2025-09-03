// src/api.ts
const API_BASE = import.meta.env.VITE_API_BASE as string;
if (!API_BASE) {
  throw new Error("VITE_API_BASE is not set");
}

/** Construit wss://... à partir de https://... */
export function wsUrl(path: string) {
  const u = new URL(API_BASE);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = path.startsWith("/") ? path : `/${path}`;
  return u.toString();
}

/** fetch avec timeout (par défaut 15s) */
async function fetchJSON(url: string, init: RequestInit = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const txt = await res.text();
    const json = txt ? safeJson(txt) : null;
    if (!res.ok) {
      const msg = json?.error || json?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Request timed out");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function safeJson(txt: string) {
  try { return JSON.parse(txt); } catch { return null; }
}

/** Envoie une commande vers /api/cmd (le backend relaie vers l’agent) */
export async function sendCommand(cmd: string, args: any = {}, token: string, timeoutMs?: number) {
  const url = new URL("/api/cmd", API_BASE);
  // si tu protèges l’endpoint via query param:
  if (token) url.searchParams.set("token", token);

  return fetchJSON(
    url.toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd, args }),
    },
    timeoutMs
  );
}

/* ============================
   Helpers dédiés à tes commandes
   ============================ */

export async function cmdGetConfig(token: string) {
  return sendCommand("get_config", {}, token);
}

export async function cmdValidateConfig(content: string, token: string) {
  return sendCommand("validate_config", { content }, token);
}

export async function cmdSetConfig(content: string, token: string) {
  return sendCommand("set_config", { content }, token);
}

export async function cmdPatchConfig(patch: any, token: string) {
  return sendCommand("patch_config", { patch }, token);
}

export async function cmdScreenshot(
  token: string,
  opts: { monitor?: number; region?: [number, number, number, number]; format?: "PNG" | "JPEG" } = {}
) {
  // 1:1 → n’envoie ni max_width ni scale
  const { monitor = 1, region, format = "PNG" } = opts;
  return sendCommand("screenshot", { monitor, region, format }, token, 30000);
}

/* ============================
   utilitaire de websocket avec auto-reconnect (optionnel)
   ============================ */

export function makeUIWebSocket(
  path = "/ws/ui",
  { onOpen, onClose, onMessage, reconnectDelayMs = 1500 }: {
    onOpen?: () => void;
    onClose?: (ev: CloseEvent) => void;
    onMessage?: (data: any) => void;
    reconnectDelayMs?: number;
  } = {}
) {
  let ws: WebSocket | null = null;
  let stopped = false;

  const connect = () => {
    if (stopped) return;
    ws = new WebSocket(wsUrl(path));
    ws.onopen = () => onOpen?.();
    ws.onclose = (ev) => {
      onClose?.(ev);
      if (!stopped) setTimeout(connect, reconnectDelayMs);
    };
    ws.onmessage = (e) => {
      try { onMessage?.(JSON.parse(e.data)); }
      catch { onMessage?.(e.data); }
    };
  };

  connect();

  return {
    close() { stopped = true; ws?.close(); },
    get instance() { return ws; },
  };
}



// ITEMS

export type Item = {
  id: number;
  name_fr: string;
  slug_fr: string;
  level: number;
  img_blob: string; // base64 (sans data: prefix)
};

export async function searchItems(query: string, limit = 20): Promise<Item[]> {
  const url = new URL("/api/items", API_BASE);
  if (query) url.searchParams.set("query", query);
  url.searchParams.set("limit", String(limit));
  const data = await fetchJSON(url.toString());
  return (data?.items ?? []) as Item[];
}

export async function getItemsByIds(ids: number[], limit = 200): Promise<Item[]> {
  if (!ids.length) return [];
  const url = new URL("/api/items", API_BASE);
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("limit", String(limit));
  const data = await fetchJSON(url.toString());
  return (data?.items ?? []) as Item[];
}

export async function loadSelection(): Promise<Item[]> {
  const url = new URL("/api/selection", API_BASE);
  const data = await fetchJSON(url.toString());
  return (data?.items ?? []) as Item[];
}

export async function saveSelection(ids: number[]): Promise<{ ok: boolean; count: number }> {
  const url = new URL("/api/selection", API_BASE);
  const data = await fetchJSON(
    url.toString(),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }
  );
  return data as { ok: boolean; count: number };
}