import { useEffect, useState, useMemo } from "react";
import { makeUIWebSocket, sendCommand } from "./api";
import RessourcesPicker from "./components/RessourcesPicker";
import type { Item } from "./api"; // <- assure-toi que Item est exporté depuis api.ts

const TOKEN = "change-me";


export function Dashboard() {
  const [agentConnected, setAgentConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

   // Sélection hoistée au parent
  const [selected, setSelected] = useState<Item[]>([]);
  const selectedIds = useMemo(() => selected.map((it) => it.id), [selected]);


  // WebSocket pour suivre le statut de l’agent
  useEffect(() => {
    const ws = makeUIWebSocket("/ws/ui", {
      onMessage: (m: any) => {
        if (m.type === "agent_status") {
          setAgentConnected(!!m.connected);
        }
        setLog((l) => [JSON.stringify(m), ...l].slice(0, 100));
      },
    });
    return () => ws.close();
  }, []);

  
  function buildStartArgs(items: Item[]) {
    return {
      // Si l’ordre de la sélection est important, on l’encode explicitement
      item_ids: items.map((it) => it.id),
      items: items.map((it, idx) => ({
        id: it.id,
        name_fr: it.name_fr,
        slug_fr: it.slug_fr,
        level: it.level,
        order: idx, // pour préserver l’ordre côté agent
        img_blob: it.img_blob,
      })),
    };
  }

  async function onStartScript() {
    setBusy(true);
    try {
      const args = buildStartArgs(selected);
      console.log(args)
      await sendCommand("start_script", args, TOKEN);
      alert("🚀 Script démarré !");
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Carte statut agent */}
      <section className="bg-white border rounded-xl shadow-sm p-4">
        <h2 className="text-base font-semibold mb-2">Statut de l'agent</h2>
        <p className="text-sm text-slate-600 flex items-center gap-2">
          Connexion :{" "}
          {agentConnected ? (
            <span className="text-emerald-700">✅ Connecté</span>
          ) : (
            <span className="text-red-600">❌ Déconnecté</span>
          )}
        </p>
      </section>

      {/* Carte actions */}
      <section className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Ressources</h2>
          <div className="text-sm text-slate-600">
            Sélection: <span className="font-medium">{selected.length}</span>
          </div>
        </div>

        <RessourcesPicker
          limit={24}
          // Le composant appelle onChangeSelected:
          // - à chaque (dé)sélection
          // - à l’auto-reload au montage (depuis la DB)
          onChangeSelected={setSelected}
        />

        <div className="pt-2">
          <button
            onClick={onStartScript}
            disabled={busy || !agentConnected || selected.length === 0}
            className="px-4 py-2 rounded-md border border-blue-600 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
            title={
              selected.length === 0
                ? "Sélection vide"
                : agentConnected
                ? "Prêt à démarrer"
                : "Agent déconnecté"
            }
          >
            ▶ Démarrer le script
          </button>
        </div>
      </section>

      {/* Carte logs */}
      <section className="bg-white border rounded-xl shadow-sm p-4">
        <h2 className="text-base font-semibold mb-2">Logs WebSocket</h2>
        <ul className="max-h-60 overflow-auto text-xs font-mono text-slate-700 space-y-1">
          {log.map((l, i) => (
            <li key={i} className="border-b border-slate-100 pb-1">
              {l}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
