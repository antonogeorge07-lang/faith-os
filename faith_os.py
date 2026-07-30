import os
import secrets
import threading
import time

import uvicorn
import webview
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from compiler import ManifestCompiler, CompileError

FAITH_OS_PORT = 8999
FAITH_OS_HOST = "127.0.0.1"
FAITH_OS_VERSION = "1.2.0"

app = FastAPI(title="FAITH OS Core", version=FAITH_OS_VERSION)
FAITH_OS_CRYPT_TOKEN = secrets.token_hex(32)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _deployment_type() -> str:
    if os.environ.get("FAITH_OS_DEPLOYMENT") == "cloud":
        return "cloud"
    return "local"

FAITH_OS_CORE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FAITH OS // Executive UI Presentation Stage</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        .glass-panel { background: rgba(24, 24, 27, 0.75); backdrop-filter: blur(12px); }
    </style>
</head>
<body class="bg-[#09090b] text-zinc-100 min-h-screen font-sans flex flex-col justify-between p-4 selection:bg-indigo-500/30">
    <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">

        <div class="lg:col-span-4 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div class="space-y-3">
                <div class="flex items-center gap-3 border-b border-zinc-800 pb-3">
                    <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30 text-white">F</div>
                    <div>
                        <h2 class="text-sm font-black tracking-wide text-zinc-200">FAITH OS Manifest Core</h2>
                        <p class="text-zinc-500 text-[10px] font-mono">PORT 8999 PIPELINE VECTOR</p>
                    </div>
                </div>

                <div class="space-y-1">
                    <label class="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Dynamic Layout Configuration Blueprint</label>
                    <textarea id="manifest-string" rows="12" class="w-full bg-black border border-zinc-800 p-2.5 font-mono text-[11px] text-indigo-300 rounded-xl focus:outline-none focus:border-indigo-500 resize-none leading-relaxed shadow-inner">
{
  "pages": {
    "saas_analytics": {
      "app_name": "Antono Cloud Commerce",
      "status_badge": "Production Cluster Active",
      "badge_color": "emerald",
      "view_title": "Enterprise Operations Center",
      "headline_kpi": "$148,920.00",
      "growth_subtext": "+18.4% Monthly MRR Scaling",
      "graph_title": "System Resource Distribution Loop",
      "chart_values": [4200, 4800, 4500, 5100, 4900, 5600, 5300]
    },
    "paas_ledger": {
      "app_name": "Sovereign Vault Solutions",
      "status_badge": "Encryption Matrix: Armored",
      "badge_color": "violet",
      "view_title": "Financial Integrity Asset Deck",
      "headline_kpi": "EUR 842,500.00",
      "growth_subtext": "100% Verified Offline RAM Logs",
      "graph_title": "Volatile Ledger Transaction Velocities",
      "chart_values": [6400, 6100, 6800, 6500, 7200, 6900, 7800]
    }
  }
}
                    </textarea>
                </div>

                <button onclick="compileSovereignManifest()" class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-bold text-zinc-200 hover:text-white text-xs rounded-xl transition-all shadow-md">
                    Compile New Design Specs
                </button>
            </div>

            <div class="bg-black/40 border border-zinc-800 p-4 rounded-xl space-y-2">
                <span class="block text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">Active Presentation Route Deck</span>
                <div id="navigation-deck" class="grid grid-cols-2 gap-2 font-mono text-[10px]"></div>
            </div>
        </div>

        <div class="lg:col-span-8 flex flex-col space-y-4">
            <div class="w-full bg-[#121214] border border-zinc-800 shadow-2xl rounded-2xl flex-1 flex flex-col overflow-hidden min-h-[520px]">

                <div class="bg-[#18181b] px-4 py-3 border-b border-zinc-800/80 flex justify-between items-center select-none">
                    <div class="flex items-center gap-6">
                        <div class="flex gap-1.5">
                            <span class="w-3 h-3 rounded-full bg-[#ff5f56] block opacity-80"></span>
                            <span class="w-3 h-3 rounded-full bg-[#ffbd2e] block opacity-80"></span>
                            <span class="w-3 h-3 rounded-full bg-[#27c93f] block opacity-80"></span>
                        </div>
                        <span id="demo-app-name" class="text-xs font-black text-zinc-300 tracking-wide uppercase font-mono bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800/60">Loading App Context...</span>
                    </div>
                    <div id="demo-status-pill" class="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-800/50 border border-zinc-700 text-zinc-400">
                        <span class="w-1.5 h-1.5 rounded-full animate-pulse bg-zinc-500" id="demo-status-dot"></span>
                        <span id="demo-status-text">Synchronizing...</span>
                    </div>
                </div>

                <div class="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <span class="text-[9px] font-mono text-zinc-600 uppercase tracking-widest block">Presentation View</span>
                            <h3 id="demo-view-title" class="text-sm font-black text-zinc-300 mt-0.5">Awaiting manifest compile...</h3>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="bg-zinc-900/60 border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden group hover:border-zinc-700/60 transition-all">
                            <div>
                                <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Core Yield Metrics Profiler</span>
                                <h2 id="demo-kpi-headline" class="text-2xl font-black text-white tracking-tight mt-1">---</h2>
                            </div>
                            <span id="demo-kpi-subtext" class="text-[11px] font-mono mt-2 block text-emerald-400/90">---</span>
                        </div>

                        <div class="bg-zinc-900/60 border border-zinc-800/40 p-5 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-sm relative overflow-hidden group hover:border-zinc-700/60 transition-all">
                            <div>
                                <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black block">Local Interface Processing Speed</span>
                                <h2 class="text-2xl font-black text-indigo-400 tracking-tight mt-1 font-mono" id="perf-latency">0.019 ms</h2>
                            </div>
                            <span class="text-[11px] font-mono text-zinc-500 mt-2 block">Asynchronous WebSocket Core State Swapping</span>
                        </div>
                    </div>

                    <div class="bg-zinc-900/40 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between flex-1 min-h-[240px] shadow-sm">
                        <div class="border-b border-zinc-900 pb-2 mb-4 flex justify-between items-center">
                            <h4 id="demo-graph-title" class="text-xs font-black text-zinc-400 uppercase tracking-wider">Telemetry Trend Mapping</h4>
                            <span class="text-[9px] font-mono text-zinc-600 uppercase">Interactive Live Canvas Matrix</span>
                        </div>
                        <div class="w-full flex-1 flex items-center justify-center max-h-[180px] bg-black/20 rounded-xl p-2 border border-zinc-900/50">
                            <canvas id="executive-chart" class="w-full max-h-[160px]"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-zinc-900 border border-zinc-800/80 px-4 py-2.5 rounded-xl flex justify-between items-center text-[10px] font-mono text-zinc-500 select-none shadow-sm gap-4">
                <span id="term-box" class="text-emerald-400/90 truncate flex-1">UI Presentation Mode Live Vector Loop Terminal</span>
                <span class="text-zinc-600 shrink-0">v1.2.0 // PORT 8999</span>
            </div>
        </div>
    </div>

    <script>
        const BADGE_PALETTE = {
            emerald: { pill: "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400", dot: "bg-emerald-400" },
            violet: { pill: "bg-violet-500/10 border border-violet-500/25 text-violet-400", dot: "bg-violet-400" },
            indigo: { pill: "bg-indigo-500/10 border border-indigo-500/25 text-indigo-400", dot: "bg-indigo-400" },
            amber: { pill: "bg-amber-500/10 border border-amber-500/25 text-amber-400", dot: "bg-amber-400" },
            zinc: { pill: "bg-zinc-800/80 border border-zinc-700 text-zinc-400", dot: "bg-zinc-500" }
        };

        const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
        const ws = new WebSocket(wsScheme + window.location.host + "/ops-stream");
        let myChart = null;
        let activePageKey = "saas_analytics";
        let activeManifest = {};

        function termLog(message) {
            document.getElementById("term-box").innerText = message;
        }

        function applyStatusBadge(pageData) {
            const colorKey = (pageData.badge_color || "zinc").toLowerCase();
            const palette = BADGE_PALETTE[colorKey] || BADGE_PALETTE.zinc;
            const pill = document.getElementById("demo-status-pill");
            pill.className = "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border " + palette.pill;
            document.getElementById("demo-status-dot").className = "w-1.5 h-1.5 rounded-full animate-pulse " + palette.dot;
            document.getElementById("demo-status-text").innerText = pageData.status_badge || "Status Unknown";
        }

        ws.onopen = function() {
            termLog("FAITH OS v1.2.0 ops-stream connected — presentation deck armed.");
        };

        ws.onerror = function() {
            termLog("ops-stream connection error on port 8999 vector.");
        };

        ws.onmessage = function(event) {
            const dataFrame = JSON.parse(event.data);
            if (dataFrame.latency) {
                document.getElementById("perf-latency").innerText = dataFrame.latency;
            }
            if (dataFrame.render_mode === "manifest_compiled") {
                activeManifest = dataFrame.payload;
                const keys = Object.keys(activeManifest.pages || {});
                if (keys.length && !activeManifest.pages[activePageKey]) {
                    activePageKey = keys[0];
                }
                const navDeck = document.getElementById("navigation-deck");
                navDeck.innerHTML = "";
                keys.forEach(pageKey => {
                    const activeClass = pageKey === activePageKey
                        ? "bg-indigo-600 text-white border-indigo-500"
                        : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600";
                    const label = pageKey.replace(/_/g, " ").toUpperCase();
                    navDeck.innerHTML += `<button type="button" onclick="navigateTargetPage('${pageKey}')" class="py-2 border rounded-lg hover:text-white text-center font-mono transition-colors ${activeClass}">${label}</button>`;
                });
                termLog(dataFrame.message || "Design specs compiled — presentation stage live.");
                renderPresentationStage();
            }
            if (dataFrame.render_mode === "manifest_error") {
                termLog("Compile fault: " + (dataFrame.message || "invalid manifest JSON"));
            }
        };

        function compileSovereignManifest() {
            termLog("Compiling sovereign manifest through port 8999 pipeline...");
            ws.send(JSON.stringify({
                action: "compile_product_manifest",
                json_text: document.getElementById("manifest-string").value
            }));
        }

        function navigateTargetPage(pageKey) {
            activePageKey = pageKey;
            const navDeck = document.getElementById("navigation-deck");
            Array.from(navDeck.querySelectorAll("button")).forEach(btn => {
                const isActive = btn.getAttribute("onclick").includes("'" + pageKey + "'");
                btn.className = "py-2 border rounded-lg hover:text-white text-center font-mono transition-colors " + (
                    isActive ? "bg-indigo-600 text-white border-indigo-500" : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600"
                );
            });
            renderPresentationStage();
        }

        function renderPresentationStage() {
            const pages = activeManifest.pages;
            if (!pages || !pages[activePageKey]) return;
            const pageData = pages[activePageKey];

            document.getElementById("demo-app-name").innerText = pageData.app_name || activePageKey;
            document.getElementById("demo-view-title").innerText = pageData.view_title || pageData.app_name || "";
            document.getElementById("demo-kpi-headline").innerText = pageData.headline_kpi || "---";
            document.getElementById("demo-kpi-subtext").innerText = pageData.growth_subtext || "---";
            document.getElementById("demo-graph-title").innerText = pageData.graph_title || "Telemetry Trend Mapping";
            applyStatusBadge(pageData);
            document.title = (pageData.app_name || "FAITH OS") + " // " + (pageData.view_title || "Presentation");

            const ctx = document.getElementById("executive-chart").getContext("2d");
            if (myChart) myChart.destroy();
            const values = pageData.chart_values || [];
            myChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: values.map((_, i) => "T+" + (i + 1)),
                    datasets: [{
                        label: pageData.graph_title || "Series",
                        data: values,
                        borderColor: pageData.badge_color === "violet" ? "#8b5cf6" : "#6366f1",
                        backgroundColor: pageData.badge_color === "violet" ? "rgba(139, 92, 246, 0.08)" : "rgba(99, 102, 241, 0.08)",
                        borderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: "#52525b", font: { size: 9 }, maxTicksLimit: 8 }, grid: { color: "#18181b" } },
                        y: { ticks: { color: "#52525b", font: { size: 9 } }, grid: { color: "#27272a" } }
                    }
                }
            });
        }

        ws.onclose = function() {
            termLog("ops-stream disconnected — presentation loop halted.");
        };
    </script>
</body>
</html>
"""

@app.get("/")
async def faith_os_presentation_stage() -> HTMLResponse:
    return HTMLResponse(FAITH_OS_CORE_HTML)

async def _send_bootstrap(websocket: WebSocket) -> None:
    await websocket.send_json(
        {
            "deployment_type": _deployment_type(),
            "latency": "0.019 ms",
        }
    )

@app.websocket("/ops-stream")
async def ops_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    await _send_bootstrap(websocket)
    try:
        while True:
            frame = await websocket.receive_json()
            if frame.get("action") != "compile_product_manifest":
                continue

            started = time.perf_counter()
            raw = frame.get("json_text", "")
            
            # Delegating manifest processing entirely to the decoupled Compiler
            compiler = ManifestCompiler()
            try:
                manifest = compiler.compile(raw)
            except CompileError as exc:
                elapsed_ms = (time.perf_counter() - started) * 1000
                await websocket.send_json(
                    {
                        "render_mode": "manifest_error",
                        "message": str(exc),
                        "latency": f"{elapsed_ms:.3f} ms",
                    }
                )
                continue

            elapsed_ms = (time.perf_counter() - started) * 1000
            await websocket.send_json(
                {
                    "render_mode": "manifest_compiled",
                    "payload": manifest,
                    "message": f"Executive deck: {len(manifest.get('pages', {}))} presentation route(s) materialized.",
                    "latency": f"{elapsed_ms:.3f} ms",
                    "deployment_type": _deployment_type(),
                }
            )
    except WebSocketDisconnect:
        return

def _run_uvicorn() -> None:
    uvicorn.run(app, host=FAITH_OS_HOST, port=FAITH_OS_PORT, log_level="warning")

def main() -> None:
    server = threading.Thread(target=_run_uvicorn, daemon=True)
    server.start()
    time.sleep(0.4)
    url = f"http://{FAITH_OS_HOST}:{FAITH_OS_PORT}/"
    webview.create_window(
        "FAITH OS // Executive UI Presentation Stage",
        url,
        width=1360,
        height=860,
    )
    webview.start()

if __name__ == "__main__":
    main()
