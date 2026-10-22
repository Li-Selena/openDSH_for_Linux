/** Keep Linux runtime debug region labels independent of the builder's home directory. */
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Make debug region paths repository-relative, including labels inside serialized client factories.
 * @param {string} source JavaScript bundle text.
 * @param {string} repositoryRoot Absolute repository directory used by the bundler.
 * @returns {string} Bundle text with code, copyright notices and other string values preserved.
 */
export function relativeBundleRegionPaths(source, repositoryRoot) {
  const escaped = repositoryRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.replace(new RegExp(`(//#region [^/\\r\\n]*)${escaped}/`, 'g'), '$1')
}

/**
 * Normalize debug labels before the Linux runtime integrity descriptor is written.
 * @param {string} runtime Physical runtime directory owned by the packaging run.
 * @param {string} repositoryRoot Absolute build repository directory.
 * @returns {number} Number of rewritten JavaScript files; symbolic links are not followed.
 */
export function normalizeLinuxBundlePaths(runtime, repositoryRoot) {
  const pending = [runtime]
  let changed = 0
  while (pending.length > 0) {
    const path = pending.pop()
    const stat = lstatSync(path)
    if (stat.isDirectory()) {
      for (const name of readdirSync(path)) pending.push(join(path, name))
    } else if (stat.isFile() && /\.[cm]?js$/u.test(path)) {
      const before = readFileSync(path, 'utf8')
      const after = relativeBundleRegionPaths(before, repositoryRoot)
      if (after !== before) {
        writeFileSync(path, after)
        changed++
      }
    }
  }
  return changed
}
