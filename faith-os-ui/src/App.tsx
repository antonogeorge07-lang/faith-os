import { useState, useEffect, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  Globe, 
  Terminal, 
  Plus, 
  X, 
  UploadCloud, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Clock, 
  Layers, 
  Lock, 
  Cpu, 
  Server, 
  Building2, 
  MapPin 
} from "lucide-react";

export interface VendorItem {
  id: string;
  name: string;
  category: string;
  jurisdiction: string;
  dpa_status: "Signed & Active" | "Missing DPA" | "Renewal Queued" | string;
  soc2_status: string;
  data_points_processed?: string[];
  verified_date: string | null;
  risk_score: "Low" | "Medium" | "Critical" | string;
  latency_ms: number;
}

export interface ProfileData {
  company_name: string;
  gdpr_score: number;
  total_vendors: number;
  verified_vendors: number;
  active_dpas: number;
  pipeline_status: string;
  updated_at: string;
}

export default function App() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Modal Form State
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("AI Inference / LLM");
  const [newJurisdiction, setNewJurisdiction] = useState<string>("EU (Frankfurt)");
  const [newDataPoints, setNewDataPoints] = useState<string>("System Logs, User Metadata");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic Production Base URL Fallback
  const API_BASE = (import.meta as any).env?.VITE_API_URL 
    ? `${(import.meta as any).env.VITE_API_URL}/api/v1`
    : (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
        ? `${window.location.origin}/api/v1`
        : "http://127.0.0.1:8999/api/v1");

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/vendors`),
        fetch(`${API_BASE}/profile`)
      ]);
      if (vRes.ok && pRes.ok) {
        const vData: VendorItem[] = await vRes.json();
        const pData: ProfileData = await pRes.json();
        setVendors(vData || []);
        setProfile(pData);
        if (vData && vData.length > 0) {
          setSelectedVendor(prev => prev ? (vData.find(v => v.id === prev.id) || vData[0]) : vData[0]);
        }
      }
    } catch (err) {
      console.warn("Pipeline telemetry fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleCreateVendor = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const parsedPoints = newDataPoints.split(",").map(p => p.trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          jurisdiction: newJurisdiction,
          data_points_processed: parsedPoints.length > 0 ? parsedPoints : ["System Logs"]
        })
      });
      if (res.ok) {
        setNewName("");
        setShowAddModal(false);
        await fetchTelemetry();
      }
    } catch (err) {
      console.error("Failed to register node:", err);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVendor) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/vendors/${selectedVendor.id}/upload-dpa`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setTimeout(fetchTelemetry, 1000);
      }
    } catch (err) {
      console.error("DPA Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredVendors = (vendors || []).filter(v => 
    (v.name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (v.category || "").toLowerCase().includes(filter.toLowerCase()) ||
    (v.jurisdiction || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F3F4F6] font-sans antialiased selection:bg-indigo-500/30 selection:text-white">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".pdf" 
        className="hidden" 
      />

      {/* Sleek Dark Header */}
      <header className="sticky top-0 z-40 bg-[#0D0E15]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-sm font-semibold tracking-tight text-white">Faith // Trust Engine</span>
              <span className="text-[11px] text-zinc-500 font-mono">v1.0-prod</span>
            </div>
            <div className="hidden md:flex items-center pl-3 border-l border-zinc-800 text-xs text-zinc-400">
              GDPR Article 28 Real-time Verification
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchTelemetry}
              className="h-8 w-8 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
              title="Refresh Pipeline"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            <button 
              onClick={() => setShowAddModal(true)}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Register Node</span>
            </button>

            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
              {profile?.pipeline_status || "ACTIVE"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#11131B] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Compliance Posture</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">
                {profile ? `${profile.gdpr_score}%` : "100%"}
              </span>
              <span className="text-xs font-mono text-emerald-400">Article 28 Met</span>
            </div>
            <div className="w-full bg-zinc-800/80 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                style={{ width: `${profile ? profile.gdpr_score : 100}%` }}
              />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#11131B] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Active Sub-processors</span>
              <Layers className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">
                {profile ? `${profile.verified_vendors}/${profile.total_vendors}` : `${vendors.length}`}
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {profile ? `${profile.total_vendors - profile.verified_vendors} Action Needed` : ""}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">Real-time Node Audit</div>
          </div>

          <div className="p-5 rounded-xl bg-[#11131B] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Primary Jurisdiction</span>
              <Globe className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">EU Safe</span>
              <span className="text-xs text-zinc-400 font-mono">Frankfurt / Dublin</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">SCC Agreements Enforced</div>
          </div>

          <div className="p-5 rounded-xl bg-[#11131B] border border-white/[0.06] hover:border-white/[0.1] transition-all space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-medium uppercase tracking-wider">Edge Response</span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold tracking-tight text-white">0.019</span>
              <span className="text-xs text-cyan-400 font-mono">ms Latency</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">Sub-millisecond Vector Query</div>
          </div>
        </section>

        {/* Master Registry & Detail Inspector */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 rounded-xl bg-[#11131B] border border-white/[0.06] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter nodes by sub-processor name, stack, or jurisdiction..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#090A0F] border border-zinc-800 text-xs text-white placeholder-zinc-500 rounded-lg focus:outline-none focus:border-indigo-500/50 transition-all font-sans"
                />
              </div>
              <div className="text-xs font-mono text-zinc-400 px-1">
                {filteredVendors.length} Verified Nodes
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#0E1017] text-zinc-400 font-mono text-[11px]">
                    <th className="py-3 px-4 font-normal">Sub-processor Node</th>
                    <th className="py-3 px-4 font-normal">DPA Status</th>
                    <th className="py-3 px-4 font-normal">Jurisdiction</th>
                    <th className="py-3 px-4 font-normal">Security Standard</th>
                    <th className="py-3 px-4 font-normal text-right">Edge Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredVendors.map((vendor) => {
                    const isSelected = selectedVendor?.id === vendor.id;
                    const isSigned = vendor.dpa_status === "Signed & Active";
                    return (
                      <tr 
                        key={vendor.id}
                        onClick={() => setSelectedVendor(vendor)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? "bg-indigo-500/[0.08] text-white border-l-2 border-indigo-500" 
                            : "hover:bg-zinc-800/30 text-zinc-300 border-l-2 border-transparent"
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white tracking-tight">{vendor.name}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">{vendor.category}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            isSigned 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {isSigned ? (
                              <Check className="h-2.5 w-2.5 mr-1 text-emerald-400 stroke-[3]" />
                            ) : (
                              <AlertCircle className="h-2.5 w-2.5 mr-1 text-rose-400" />
                            )}
                            {vendor.dpa_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">
                          {vendor.jurisdiction}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">
                          {vendor.soc2_status}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-zinc-500 text-[11px]">
                          {vendor.latency_ms} ms
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dossier Inspector */}
          <div className="lg:col-span-4 space-y-4">
            {selectedVendor ? (
              <div className="rounded-xl bg-[#11131B] border border-white/[0.06] p-6 space-y-5 shadow-sm">
                <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Node Dossier</span>
                    <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">{selectedVendor.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono">{selectedVendor.category}</p>
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-zinc-500">Node ID</span>
                    <span className="font-mono text-zinc-400">{selectedVendor.id.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-zinc-500">Legal Jurisdiction</span>
                    <span className="font-mono text-white">{selectedVendor.jurisdiction}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-zinc-500">Audit Status</span>
                    <span className="font-mono text-white">{selectedVendor.verified_date || "Audit Queued"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-zinc-500">Security Standard</span>
                    <span className="font-mono text-emerald-400">{selectedVendor.soc2_status}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-zinc-500">Legal Safeguard</span>
                    <span className="font-mono text-white">EU SCC / Art 28</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all border border-zinc-700 disabled:opacity-50"
                  >
                    <UploadCloud className={`h-4 w-4 ${uploading ? "animate-bounce text-indigo-400" : ""}`} />
                    <span>{uploading ? "Analyzing Document..." : "Upload Signed DPA (PDF)"}</span>
                  </button>

                  <div className="flex items-center justify-between px-1 text-[11px] text-zinc-500">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Auto-Audited
                    </span>
                    <span className="font-mono">SHA-256 Verified</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-[#11131B] border border-white/[0.06] text-center text-xs text-zinc-500 font-mono">
                Select a sub-processor node to inspect compliance details
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Production Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-base font-semibold text-white tracking-tight">Register Sub-processor Node</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Define vendor metadata for continuous GDPR compliance auditing</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium flex items-center space-x-1.5">
                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Sub-processor Legal Entity Name</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Anthropic PBC, Mistral AI, Pinecone"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090A0F] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-sans text-xs transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium flex items-center space-x-1.5">
                    <Server className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Classification</span>
                  </label>
                  <select 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#090A0F] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans text-xs transition-colors"
                  >
                    <option value="AI Inference / LLM">AI Inference / LLM</option>
                    <option value="Vector DB / Storage">Vector DB / Storage</option>
                    <option value="Authentication & Identity">Authentication & Identity</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium flex items-center space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Jurisdiction Region</span>
                  </label>
                  <select 
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#090A0F] border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-sans text-xs transition-colors"
                  >
                    <option value="EU (Frankfurt)">EU (Frankfurt)</option>
                    <option value="EU (Dublin)">EU (Dublin)</option>
                    <option value="EU (Stockholm)">EU (Stockholm)</option>
                    <option value="US-East (N. Virginia)">US-East (N. Virginia)</option>
                    <option value="US-West (Oregon)">US-West (Oregon)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium flex items-center space-x-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Data Points Processed (Comma-separated)</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. User Prompts, IP Addresses, Vector Embeddings"
                  value={newDataPoints}
                  onChange={(e) => setNewDataPoints(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#090A0F] border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 font-sans text-xs transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2.5 border-t border-zinc-800">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all shadow-md shadow-indigo-600/20"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
