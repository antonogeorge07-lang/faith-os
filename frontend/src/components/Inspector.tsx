import type { ComponentDefinition } from '../types/runtime'

type InspectorProps = {
  component: ComponentDefinition
}

function Inspector({ component }: InspectorProps) {
  return (
    <div className="inspector-stack">
      <div className="inspector-card">
        <p className="eyebrow">Selected component</p>
        <h3>{component.name}</h3>
        <p>{component.description}</p>
      </div>

      <div className="inspector-card">
        <div className="meta-row">
          <span>Type</span>
          <strong>{component.type}</strong>
        </div>
        <div className="meta-row">
          <span>Category</span>
          <strong>{component.category}</strong>
        </div>
        <div className="meta-row">
          <span>Status</span>
          <strong>{component.status}</strong>
        </div>
      </div>

      <div className="inspector-card">
        <p className="eyebrow">Runtime hints</p>
        <ul className="hint-list">
          {component.runtimeHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Inspector
