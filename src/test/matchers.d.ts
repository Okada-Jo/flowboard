import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import 'vitest'

// The jest-dom Vitest adapter still augments the pre-v5 Assertion signature.
// Use Vitest's shared matcher interface for sync and async assertions instead.
declare module 'vitest' {
  // Module augmentation requires an interface to merge the matcher types.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<
    R extends void | Promise<void>,
    T,
  > extends TestingLibraryMatchers<T, R> {}
}
