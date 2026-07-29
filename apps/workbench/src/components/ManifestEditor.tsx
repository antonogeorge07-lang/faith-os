type ManifestEditorProps = {
  manifestText: string
  onChange: (value: string) => void
}

function ManifestEditor({ manifestText, onChange }: ManifestEditorProps) {
  return (
    <div className="editor-stack">
      <div className="editor-toolbar">
        <span className="pill pill--accent">Manifest</span>
        <span className="pill">Live editing</span>
      </div>
      <textarea
        className="manifest-editor"
        value={manifestText}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
      />
      <div className="editor-meta">
        <div>
          <strong>Schema</strong>
          <p>Runtime-aware manifest definition</p>
        </div>
        <div>
          <strong>Version</strong>
          <p>0.1.0</p>
        </div>
      </div>
    </div>
  )
}

export default ManifestEditor
