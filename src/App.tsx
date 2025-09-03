import { useState } from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import ConfigEditor from "./ConfigEditor";
import { Dashboard } from "./Dashboard";
import LogsStub from "./LogsStub";
import AboutStub from "./AboutStub";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* ----- TOP BAR ----- */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-screen-2xl px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex md:hidden items-center justify-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-slate-50"
            aria-label="Ouvrir/fermer le menu"
          >
            ☰
          </button>
          <h1 className="text-lg font-semibold">Realtime UI</h1>
          <span className="ml-2 text-xs rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 border border-emerald-200">
            v1
          </span>

          <div className="ml-auto flex items-center gap-2">
            {/* actions globales si besoin */}
            <span className="hidden sm:inline text-slate-500">Espace de config</span>
          </div>
        </div>
      </header>

      {/* ----- LAYOUT WRAPPER ----- */}
      <div className="mx-auto max-w-screen-2xl px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* ----- SIDEBAR ----- */}
          <aside
            className={[
              "col-span-12 md:col-span-3 lg:col-span-2",
              sidebarOpen ? "" : "hidden md:block md:col-span-1",
            ].join(" ")}
          >
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="px-3 py-2 border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                Navigation
              </div>

              <nav className="p-2 space-y-1">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    [
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm",
                      isActive
                        ? "bg-sky-50 border-sky-200 text-sky-800"
                        : "bg-white border-slate-200 hover:bg-slate-50",
                    ].join(" ")
                  }
                >
                  <span className="shrink-0">🏠</span>
                  <span className="truncate">Tableau de bord</span>
                </NavLink>
                <NavLink
                  to="/config"
                  className={({ isActive }) =>
                    [
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm",
                      isActive
                        ? "bg-sky-50 border-sky-200 text-sky-800"
                        : "bg-white border-slate-200 hover:bg-slate-50",
                    ].join(" ")
                  }
                >
                  <span className="shrink-0">🛠️</span>
                  <span className="truncate">Éditeur de configuration</span>
                </NavLink>
                <NavLink
                  to="/logs"
                  className={({ isActive }) =>
                    [
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm",
                      isActive
                        ? "bg-sky-50 border-sky-200 text-sky-800"
                        : "bg-white border-slate-200 hover:bg-slate-50",
                    ].join(" ")
                  }
                >
                  <span className="shrink-0">📜</span>
                  <span className="truncate">Journaux</span>
                </NavLink>
                <NavLink
                  to="/about"
                  className={({ isActive }) =>
                    [
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm",
                      isActive
                        ? "bg-sky-50 border-sky-200 text-sky-800"
                        : "bg-white border-slate-200 hover:bg-slate-50",
                    ].join(" ")
                  }
                >
                  <span className="shrink-0">ℹ️</span>
                  <span className="truncate">À propos</span>
                </NavLink>
              </nav>
            </div>
          </aside>

          {/* ----- MAIN CONTENT ----- */}
          <main
            className={[
              "col-span-12",
              sidebarOpen ? "md:col-span-9 lg:col-span-10" : "md:col-span-11",
            ].join(" ")}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/config" element={<ConfigEditor />} />
              <Route path="/logs" element={<LogsStub />} />
              <Route path="/about" element={<AboutStub />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
