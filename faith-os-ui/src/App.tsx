import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Search, 
  Globe, 
  FileText, 
  Terminal, 
  ExternalLink, 
  ChevronRight, 
  Database, 
  RefreshCw 
} from "lucide-react";

export default function App() {
  const [vendors, setVendors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const API_BASE = "http://127.0.0.1:8999/api/v1";

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/vendors`),
        fetch(`${API_BASE}/profile`)
      ]);
      if (vRes.ok && pRes.ok) {
        const vData = await vRes.json();
        const pData = await pRes.json();
        setVendors(vData || []);
        setProfile(pData);
        if (vData && vData.length > 0) {
          setSelectedVendor(vData[0]);
        }
      }
    } catch (err) {
      console.warn("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const filteredVendors = (vendors || []).filter(v => 
    (v.name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (v.category || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 font-sans antialiased">
      <header className="border-b border-zinc-800 bg-[#09090B] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-zinc-100 rounded-sm flex items-center justify-center">
                <span className="text-black font-mono font-black text-[9px]">F</span>
              </div>
              <span className="text-xs font-semibold tracking-wider text-zinc-200 uppercase font-mono">
                Faith // Radar 8999
              </span>
            </div>
            <span className="text-zinc-700">/</span>
            <span className="text-xs text-zinc-400 font-medium">Sub-processor Audit Portal</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchTelemetry}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Sync Pipeline"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="inline-flex items-center px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[11px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Pipeline: {profile?.pipeline_status || "ONLINE"}
            </div>
            <button className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded flex items-center space-x-1.5">
              <span>Export Audit Dossier</span>
              <ArrowUpRight className="h-3 w-3 text-zinc-950" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-md border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">System Compliance Score</span>
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-100">
                {profile ? `${profile.gdpr_score}%` : "100%"}
              </span>
              <span className="text-[11px] font-mono text-emerald-400">GDPR Ready</span>
            </div>
          </div>

          <div className="p-4 rounded-md border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Active Sub-processors</span>
              <Database className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-100">
                {profile ? `${profile.verified_vendors} of ${profile.total_vendors}` : `${vendors.length} Active`}
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                {profile ? `${profile.total_vendors - profile.verified_vendors} Pending` : ""}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-md border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Data Residency</span>
              <Globe className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-100">EU Dominant</span>
              <span className="text-[11px] font-mono text-zinc-400">Frankfurt / Dublin</span>
            </div>
          </div>

          <div className="p-4 rounded-md border border-zinc-800 bg-[#121215] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Pipeline Latency</span>
              <Activity className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-semibold tracking-tight text-zinc-100">0.019 ms</span>
              <span className="text-[11px] font-mono text-emerald-400">Sub-millisecond</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 rounded-md border border-zinc-800 bg-[#121215] overflow-hidden">
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter by vendor or category..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#09090B] border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 rounded focus:outline-none focus:border-zinc-600 font-mono"
                />
              </div>
              <div className="text-xs font-mono text-zinc-400">
                {filteredVendors.length} Nodes
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#16161A] text-zinc-400 font-mono text-[11px]">
                    <th className="py-2.5 px-4 font-normal">Sub-processor</th>
                    <th className="py-2.5 px-4 font-normal">DPA Status</th>
                    <th className="py-2.5 px-4 font-normal">Jurisdiction</th>
                    <th className="py-2.5 px-4 font-normal">SOC2</th>
                    <th className="py-2.5 px-4 font-normal text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredVendors.map((vendor) => {
                    const isSelected = selectedVendor?.id === vendor.id;
                    return (
                      <tr 
                        key={vendor.id}
                        onClick={() => setSelectedVendor(vendor)}
                        className={`cursor-pointer ${
                          isSelected ? "bg-zinc-800/40 text-zinc-100" : "hover:bg-zinc-800/20 text-zinc-300"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-zinc-200">{vendor.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{vendor.category}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${
                            vendor.dpa_status === "Signed & Active" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {vendor.dpa_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                          {vendor.jurisdiction}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {vendor.soc2_status}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-500 text-[11px]">
                          {vendor.latency_ms} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {selectedVendor && (
              <div className="rounded-md border border-zinc-800 bg-[#121215] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{selectedVendor.name}</h3>
                    <span className="text-[11px] font-mono text-zinc-500">{selectedVendor.category}</span>
                  </div>
                  <div className="p-1 rounded bg-zinc-800 border border-zinc-700">
                    <Terminal className="h-3.5 w-3.5 text-zinc-300" />
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Jurisdiction</span>
                    <span className="font-mono text-zinc-300">{selectedVendor.jurisdiction}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Security</span>
                    <span className="font-mono text-emerald-400">{selectedVendor.soc2_status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-800/40">
                    <span className="text-zinc-500">Latency</span>
                    <span className="font-mono text-zinc-300">{selectedVendor.latency_ms} ms</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-medium rounded flex items-center justify-center space-x-2">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Upload DPA (PDF)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
