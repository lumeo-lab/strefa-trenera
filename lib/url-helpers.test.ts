import { describe, expect, it } from 'vitest'
import { updateSearchParams } from './url-helpers'

describe('updateSearchParams', () => {
  it('does nothing when window is undefined (SSR)', () => {
    // In vitest node environment, window is undefined — function should not throw
    expect(() => updateSearchParams({ filter: 'test' })).not.toThrow()
  })
})
