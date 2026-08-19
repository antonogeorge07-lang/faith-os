import { createElement, type ReactNode } from 'react'
import type { ComponentDefinition, ComponentType } from '../types/runtime'
import type { Manifest } from './manifestSchema'

type ComponentRendererProps = {
  manifest: Manifest
  component: ComponentDefinition
  renderChildren?: (children: Manifest[] | undefined) => ReactNode
}

type ComponentRenderer = (props: ComponentRendererProps) => ReactNode

export const componentRegistry: Record<ComponentType, ComponentDefinition> = {
  metric: {
    id: 'metric',
    name: 'Metric',
    type: 'metric',
    category: 'analytics',
    description: 'Displays a primary measurement with supporting context.',
    status: 'ready',
    runtimeHints: ['value', 'trend', 'status'],
  },
  chart: {
    id: 'chart',
    name: 'Chart',
    type: 'chart',
    category: 'analytics',
    description: 'Renders a visualization surface for streamed or static series.',
    status: 'ready',
    runtimeHints: ['series', 'legend', 'axis'],
  },
  table: {
    id: 'table',
    name: 'Table',
    type: 'table',
    category: 'data',
    description: 'Displays structured rows with a compact data contract.',
    status: 'ready',
    runtimeHints: ['rows', 'columns', 'sorting'],
  },
  form: {
    id: 'form',
    name: 'Form',
    type: 'form',
    category: 'interaction',
    description: 'Hosts editable inputs and submission actions.',
    status: 'ready',
    runtimeHints: ['fields', 'validation', 'submit'],
  },
  markdown: {
    id: 'markdown',
    name: 'Markdown',
    type: 'markdown',
    category: 'content',
    description: 'Renders rich text content from a markdown body.',
    status: 'ready',
    runtimeHints: ['body', 'formatting', 'link'],
  },
  container: {
    id: 'container',
    name: 'Container',
    type: 'container',
    category: 'layout',
    description: 'Wraps child components and manages layout composition.',
    status: 'draft',
    runtimeHints: ['children', 'layout', 'slot'],
  },
}

const componentRenderers: Record<ComponentType, ComponentRenderer> = {
  metric: ({ component, manifest }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Metric'),
      createElement('h3', null, component.name),
      createElement('p', null, manifest.props?.value ?? 'Resolved from the registry with a metric type contract.'),
      createElement('div', { className: 'preview-stat' }, manifest.props?.value ?? '84.2%'),
    ),
  chart: ({ component }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Chart'),
      createElement('h3', null, component.name),
      createElement('div', { className: 'chart-bars' },
        createElement('span', { className: 'chart-bar chart-bar--one' }, null),
        createElement('span', { className: 'chart-bar chart-bar--two' }, null),
        createElement('span', { className: 'chart-bar chart-bar--three' }, null),
      ),
    ),
  table: ({ component }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Table'),
      createElement('h3', null, component.name),
      createElement('div', { className: 'table-preview' },
        createElement('div', { className: 'table-row' }, createElement('strong', null, 'Name'), createElement('span', null, 'Status')),
        createElement('div', { className: 'table-row' }, createElement('span', null, 'Alpha'), createElement('span', null, 'Ready')),
        createElement('div', { className: 'table-row' }, createElement('span', null, 'Beta'), createElement('span', null, 'Pending')),
      ),
    ),
  form: ({ component }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Form'),
      createElement('h3', null, component.name),
      createElement('div', { className: 'form-preview' },
        createElement('label', null, 'Name', createElement('input', { placeholder: 'Enter a value' })),
        createElement('label', null, 'Email', createElement('input', { placeholder: 'name@example.com' })),
      ),
    ),
  markdown: ({ component, manifest }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Markdown'),
      createElement('h3', null, component.name),
      createElement('pre', { className: 'markdown-preview' }, JSON.stringify(manifest.props ?? {}, null, 2)),
    ),
  container: ({ component, renderChildren }) =>
    createElement(
      'div',
      { className: 'preview-card' },
      createElement('p', { className: 'eyebrow' }, 'Container'),
      createElement('h3', null, component.name),
      createElement('p', null, 'Children render inside a composed layout shell.'),
      renderChildren ? createElement('div', { className: 'nested-layout' }, renderChildren(undefined)) : null,
    ),
}

export const componentDefinitions = Object.values(componentRegistry)

export const resolveComponentDefinition = (componentType: string) => {
  const normalizedType = componentType.trim().toLowerCase() as ComponentType
  return componentRegistry[normalizedType] ?? componentRegistry.metric
}

export const renderComponentPreview = (manifest: Manifest, componentType?: string): ReactNode => {
  const resolvedType = componentType ?? manifest.type
  const component = resolveComponentDefinition(resolvedType)
  const renderChildren = (children: Manifest[] | undefined): ReactNode => {
    if (!children?.length) {
      return null
    }

    return createElement(
      'div',
      { className: 'nested-layout' },
      ...children.map((child) => renderComponentPreview(child)),
    )
  }

  return componentRenderers[component.type]({
    component,
    manifest,
    renderChildren: (children) => renderChildren(children),
  })
}
