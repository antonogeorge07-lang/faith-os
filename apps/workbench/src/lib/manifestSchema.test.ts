import { describe, expect, it } from 'vitest'
import { parseManifest } from './manifestSchema'

describe('parseManifest', () => {
  it('accepts a valid manifest', () => {
    const result = parseManifest('{"type":"metric","props":{"value":42}}')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe('metric')
    }
  })

  it('returns descriptive errors for invalid manifests', () => {
    const result = parseManifest('{"type":"unknown","props":{}}')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0]).toContain('type')
    }
  })
})
