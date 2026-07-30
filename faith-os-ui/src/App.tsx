import { Check, ChevronDown } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1a1a1a] p-8 font-sans selection:bg-[#005f56] selection:text-white">
      <header className="max-w-[1200px] mx-auto mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-[11px] font-bold tracking-[0.2em] text-[#005f56] uppercase mb-2">
            FAITH OS WORKBENCH
          </h2>
          <h1 className="text-5xl font-serif font-bold tracking-tight text-gray-900">
            The Sovereign Application Runtime
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#005f56]/20 bg-transparent text-[#005f56] text-sm font-semibold transition-colors hover:bg-[#005f56]/5">
            Type Metric <ChevronDown size={14} />
          </button>
          <button className="px-5 py-2 rounded-full bg-[#005f56] text-white text-sm font-semibold shadow-sm hover:bg-[#004a43] transition-colors">
            React + TypeScript
          </button>
        </div>
      </header>

      {/* Vertical Stack Layout */}
      <main className="max-w-[1200px] mx-auto flex flex-col gap-8">
        
        {/* Manifest Editor Panel */}
        <section className="bg-[#FEFEFD] rounded-3xl shadow-sm border border-gray-200/60 p-8 flex flex-col h-[650px]">
          <h3 className="font-bold text-gray-900 mb-2">Manifest Editor</h3>
          <p className="text-sm text-gray-500 mb-6">Edit the runtime manifest and keep the shell in sync.</p>
          <div className="flex gap-2 mb-6">
            <span className="px-4 py-1.5 bg-[#005f56] text-white text-[11px] font-bold rounded-full">Manifest</span>
            <span className="px-4 py-1.5 border border-[#005f56] text-[#005f56] text-[11px] font-bold rounded-full">Live editing</span>
          </div>
          <div className="flex-1 bg-[#2d333b] rounded-2xl p-6 font-mono text-[14px] leading-relaxed text-[#aebec8] shadow-inner overflow-hidden">
            <pre>
              1 &nbsp; {"{"} <br/>
              2 &nbsp; &nbsp; "type": "metric", <br/>
              3 &nbsp; &nbsp; "props": {"{"} <br/>
              4 &nbsp; &nbsp; &nbsp; "content": "Runtime-ready content" <br/>
              5 &nbsp; &nbsp; {"}"} <br/>
              6 &nbsp; {"}"}
            </pre>
          </div>
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 text-[12px]">
            <div><p className="font-bold text-gray-900 uppercase">Schema</p><p className="text-gray-500">Runtime-aware manifest definition</p></div>
            <div className="text-right"><p className="font-bold text-gray-900 uppercase">Version</p><p className="text-gray-500">0.1.0</p></div>
          </div>
        </section>

        {/* Live Preview Panel */}
        <section className="bg-[#FEFEFD] rounded-3xl shadow-sm border border-gray-200/60 p-8 flex flex-col h-[650px]">
          <h3 className="font-bold text-gray-900 mb-2">Live Preview</h3>
          <p className="text-sm text-gray-500 mb-8">Render the current manifest in a live runtime surface.</p>
          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-[#FDFDFC] flex flex-col justify-between">
            <div className="flex gap-2 mb-6">
              <span className="px-4 py-1.5 bg-[#005f56] text-white text-[11px] font-bold rounded-full">Runtime shell</span>
              <span className="px-4 py-1.5 bg-[#005f56] text-white text-[11px] font-bold rounded-full">Metric</span>
            </div>
            <div className="bg-[#F7F6F2] border border-gray-200 rounded-2xl p-6 mb-6">
               <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2">Metric</h4>
               <h2 className="text-xl font-bold text-gray-900 mb-1">Metric</h2>
               <p className="text-xs text-gray-600 mb-4">Resolved from the registry with a metric type contract.</p>
               <div className="text-5xl font-bold text-[#005f56] tracking-tight font-serif">84.2%</div>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 bg-[#005f56] text-white text-[11px] font-bold py-3 px-4 rounded-full">Manifest ready</button>
              <button className="flex-1 bg-[#005f56] text-white text-[11px] font-bold py-3 px-4 rounded-full">Registry aware</button>
              <button className="flex-1 bg-[#005f56] text-white text-[11px] font-bold py-3 px-4 rounded-full">Component selected</button>
            </div>
          </div>
        </section>

        {/* Inspector Panel */}
        <section className="bg-[#FEFEFD] rounded-3xl shadow-sm border border-gray-200/60 p-8 flex flex-col h-[650px]">
          <h3 className="font-bold text-gray-900 mb-2">Inspector</h3>
          <p className="text-sm text-gray-500 mb-8">Inspect the selected component and its runtime contract.</p>
          <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100 mb-6">
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">SELECTED COMPONENT</h4>
            <h2 className="text-xl font-bold text-gray-900 mb-1 font-serif">Metric</h2>
            <p className="text-xs text-gray-600">Displays a primary measurement with supporting context.</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100 mb-6 space-y-3">
             {['Type: metric', 'Category: analytics', 'Status: ready'].map((item) => (
                <div key={item} className="flex justify-between text-sm font-semibold text-[#005f56]">
                   <span>{item.split(': ')[0]}</span>
                   <span>{item.split(': ')[1]}</span>
                </div>
             ))}
          </div>
          <div className="bg-[#F8F9FA] rounded-2xl p-6 border border-gray-100 flex-1">
            <h4 className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">RUNTIME HINTS</h4>
            {['value', 'trend', 'status'].map((hint) => (
               <div key={hint} className="flex items-center gap-3 text-sm font-semibold mb-2">
                 <Check size={16} className="text-[#005f56]"/> {hint}
               </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
