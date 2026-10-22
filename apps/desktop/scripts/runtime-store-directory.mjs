/** Read explicit package-store reuse without changing the default temporary production store. */
import { isAbsolute, resolve } from 'node:path'

/**
 * Select an existing pnpm cache location only when packaging explicitly configures one.
 * @param {NodeJS.ProcessEnv} environment Packaging environment; no filesystem changes are performed.
 * @returns {string | undefined} Normalized absolute store, or undefined to retain temporary storage.
 */
export function resolveDesktopRuntimeStoreDirectory(environment) {
  const selected = environment.DSH_DESKTOP_RUNTIME_STORE_DIR
  if (selected === undefined) return undefined
  if (!selected || selected.includes('\0') || !isAbsolute(selected)) {
    throw new Error('DSH_DESKTOP_RUNTIME_STORE_DIR must be a nonempty absolute directory')
  }
  return resolve(selected)
}
