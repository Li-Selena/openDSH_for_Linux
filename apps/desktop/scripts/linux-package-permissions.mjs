/** Set distributable Linux permissions without following links outside the application. */
import { chmodSync, lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Make root-installed payloads readable by ordinary users despite the builder's umask.
 * @param {string} directory Application output directory owned by the packaging run.
 * @returns {void} Preserves executable files and symlinks; rejects special filesystem entries.
 */
export function normalizeLinuxPackagePermissions(directory) {
  const pending = [directory]
  while (pending.length > 0) {
    const path = pending.pop()
    const stat = lstatSync(path)
    if (stat.isSymbolicLink()) continue
    if (stat.isDirectory()) {
      chmodSync(path, 0o755)
      for (const name of readdirSync(path)) pending.push(join(path, name))
    } else if (stat.isFile()) {
      chmodSync(path, (stat.mode & 0o111) !== 0 ? 0o755 : 0o644)
    } else {
      throw new Error(`desktop Linux package: unsupported filesystem entry ${path}`)
    }
  }
}
