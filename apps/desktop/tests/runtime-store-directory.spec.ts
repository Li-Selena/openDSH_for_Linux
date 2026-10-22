import { resolve } from 'node:path'
import { expect, it } from 'vitest'
import { resolveDesktopRuntimeStoreDirectory } from '../scripts/runtime-store-directory.mjs'

it('retains the temporary production store when reuse is not configured', () => {
  expect(resolveDesktopRuntimeStoreDirectory({})).toBeUndefined()
})

it('normalizes an explicit absolute store directory', () => {
  const directory = resolve('contained', 'store', '..', 'pnpm-store')
  expect(resolveDesktopRuntimeStoreDirectory({ DSH_DESKTOP_RUNTIME_STORE_DIR: directory })).toBe(directory)
})

it.each(['', 'relative/store', '~/pnpm-store', '/store\0invalid'])('rejects invalid store configuration %j', (directory) => {
  expect(() => resolveDesktopRuntimeStoreDirectory({ DSH_DESKTOP_RUNTIME_STORE_DIR: directory }))
    .toThrow('must be a nonempty absolute directory')
})
