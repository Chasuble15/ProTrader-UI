import { useEffect, useState } from "react";
import {
  listHdvResources,
  getHdvTimeseries,
  type HdvResource,
  type TimeseriesSeries,
} from "../api";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];

const parseTimestamp = (t: string): number => {
  const n = Number(t);
  if (!Number.isNaN(n)) {
    return n < 1e12 ? n * 1000 : n;
  }
  return Date.parse(t.endsWith("Z") ? t : `${t}Z`);
};

export default function Prices() {
  const [resources, setResources] = useState<HdvResource[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [series, setSeries] = useState<TimeseriesSeries[]>([]);
  const [qty, setQty] = useState("x1");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await listHdvResources();
        setResources(res);
      } catch (e) {
        console.error("Failed to load resources", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (selected.length === 0) {
      setSeries([]);
      return;
    }
    (async () => {
      try {
        const ts = await getHdvTimeseries(selected, qty, "day", "avg", start || undefined, end || undefined);
        setSeries(ts);
      } catch (e) {
        console.error("Failed to load timeseries", e);
        setSeries([]);
      }
    })();
  }, [selected, qty, start, end]);

  const chartData = {
    datasets: series.map((s, idx) => ({
      label: s.slug,
      data: s.points.map((p) => ({
        x: parseTimestamp(p.t),
        y: p.price ?? p.value ?? 0,
      })),
      borderColor: COLORS[idx % COLORS.length],
      backgroundColor: COLORS[idx % COLORS.length],
      tension: 0.1,
    })),
  };

  const startMs = start ? new Date(start).getTime() : undefined;
  const endMs = end ? new Date(end).getTime() : undefined;

  const chartOptions = {
    parsing: false,
    responsive: true,
    scales: {
      x: {
        type: "linear" as const,
        min: startMs,
        max: endMs,
        ticks: {
          callback: (value: number) =>
            new Date(value).toLocaleString(undefined, { timeZone: "UTC" }),
        },
      },
      y: {
        type: "linear" as const,
        min: 0,
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { position: "bottom" as const },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<"line">[]) =>
            new Date(items[0].parsed.x as number).toLocaleString(undefined, {
              timeZone: "UTC",
            }),
        },
      },
    },
  };

  const toggle = (slug: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return [...prev, slug];
      return prev.filter((s) => s !== slug);
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Historique des prix</h2>
      <div className="flex flex-wrap gap-4">
        {resources.map((r) => (
          <label key={r.slug} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(r.slug)}
              onChange={(e) => toggle(r.slug, e.target.checked)}
            />
            <span>{r.slug}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          Quantité
          <select
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="border rounded p-1"
          >
            <option value="x1">x1</option>
            <option value="x10">x10</option>
            <option value="x100">x100</option>
            <option value="x1000">x1000</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          De
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="border rounded p-1"
          />
        </label>
        <label className="flex items-center gap-2">
          À
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="border rounded p-1"
          />
        </label>
      </div>
      <div className="border rounded-xl p-4 bg-white">
        {series.length === 0 ? (
          <div className="text-sm text-slate-500">Aucune donnée à afficher.</div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

