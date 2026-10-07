import * as matchers from '@testing-library/jest-dom/matchers'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'

expect.extend(matchers)

afterEach(cleanup)
