import { useMemo, useState } from 'react'
import './App.css'
import LivePreview from './components/LivePreview'
import ManifestEditor from './components/ManifestEditor'
import Panel from './components/Panel'
import Inspector from './components/Inspector'
import { componentDefinitions, resolveComponentDefinition } from './lib/componentRegistry'
import { branding } from './config/brand'
import type { ComponentType, RuntimeShellState } from './types/runtime'

const initialState: RuntimeShellState = {
  manifestText: '{\n  "type": "metric",\n  "props": {\n    "content": "Runtime-ready content"\n  }\n}',
  selectedComponentType: 'metric',
}

function App() {
  const [state, setState] = useState<RuntimeShellState>(initialState)

  const selectedComponent = useMemo(
    () => resolveComponentDefinition(state.selectedComponentType),
    [state.selectedComponentType],
  )

  return (
    <main className="shell-shell">
      <header className="shell-header">
        <div>
          <p className="eyebrow">{branding.eyebrow}</p>
          <h1>{branding.title}</h1>
        </div>
        <div className="shell-badges">
          <label className="pill pill--accent" htmlFor="component-type">
            <span>Type</span>
            <select
              id="component-type"
              className="component-select"
              value={state.selectedComponentType}
              onChange={(event) =>
                setState((current) => ({ ...current, selectedComponentType: event.target.value as ComponentType }))
              }
            >
              {componentDefinitions.map((component) => (
                <option key={component.id} value={component.type}>
                  {component.name}
                </option>
              ))}
            </select>
          </label>
          <span className="pill">React + TypeScript</span>
        </div>
      </header>

      <section className="shell-grid" aria-label={branding.sectionLabel}>
        <Panel title="Manifest Editor" subtitle="Edit the runtime manifest and keep the shell in sync.">
          <ManifestEditor
            manifestText={state.manifestText}
            onChange={(value) => setState((current) => ({ ...current, manifestText: value }))}
          />
        </Panel>

        <Panel title="Live Preview" subtitle="Render the current manifest in a live runtime surface.">
          <LivePreview manifestText={state.manifestText} selectedComponentType={state.selectedComponentType} />
        </Panel>

        <Panel title="Inspector" subtitle="Inspect the selected component and its runtime contract.">
          <Inspector component={selectedComponent} />
        </Panel>
      </section>
    </main>
  )
}

export default App
