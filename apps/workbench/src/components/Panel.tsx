type PanelProps = {
  title: string
  subtitle: string
  children: React.ReactNode
}

function Panel({ title, subtitle, children }: PanelProps) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="panel__body">{children}</div>
    </section>
  )
}

export default Panel
