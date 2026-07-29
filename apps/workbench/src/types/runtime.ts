export type ComponentType = 'metric' | 'chart' | 'table' | 'form' | 'markdown' | 'container'

export type ComponentDefinition = {
  id: string
  name: string
  type: ComponentType
  category: string
  description: string
  status: 'ready' | 'draft' | 'disabled'
  runtimeHints: string[]
}

export type RuntimeShellState = {
  manifestText: string
  selectedComponentType: ComponentType
}
