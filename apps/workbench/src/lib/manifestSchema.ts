import { z } from 'zod'
import { componentRegistry } from './componentRegistry'

const componentTypes = Object.keys(componentRegistry) as [keyof typeof componentRegistry, ...(keyof typeof componentRegistry)[]]

export const manifestSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(componentTypes),
    props: z.record(z.string(), z.unknown()).optional(),
    children: z.array(z.lazy(() => manifestSchema)).optional(),
  }),
)

export type Manifest = z.infer<typeof manifestSchema>

export const parseManifest = (source: string) => {
  try {
    const parsed = JSON.parse(source)
    return {
      success: true as const,
      data: manifestSchema.parse(parsed),
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false as const,
        errors: error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`),
      }
    }

    return {
      success: false as const,
      errors: ['Manifest must be valid JSON.'],
    }
  }
}
