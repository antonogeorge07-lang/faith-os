import { renderComponentPreview, resolveComponentDefinition } from '../lib/componentRegistry'
import { parseManifest } from '../lib/manifestSchema'

type LivePreviewProps = {
  manifestText: string
  selectedComponentType: string
}

function LivePreview({ manifestText, selectedComponentType }: LivePreviewProps) {
  const component = resolveComponentDefinition(selectedComponentType)
  const validation = parseManifest(manifestText)

  return (
    <div className="preview-stack">
      <div className="preview-shell">
        <div className="preview-surface">
          <div className="preview-header">
            <span className="pill">Runtime shell</span>
            <span className="pill pill--accent">{component.name}</span>
          </div>

          {validation.success ? (
            <>
              {renderComponentPreview(validation.data, selectedComponentType)}
              <div className="preview-grid">
                <div className="preview-chip">Manifest ready</div>
                <div className="preview-chip">Registry aware</div>
                <div className="preview-chip">Component selected</div>
              </div>
            </>
          ) : (
            <div className="preview-card preview-card--error">
              <p className="eyebrow">Validation failed</p>
              <h3>Unable to render manifest</h3>
              <ul className="hint-list">
                {validation.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LivePreview
