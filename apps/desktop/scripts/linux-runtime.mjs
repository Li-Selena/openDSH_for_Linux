/** Validate the Linux system package before sealing and after extracting application resources. */
import { lstatSync } from 'node:fs'
import { join } from 'node:path'
import { verifyPlatformBinaries } from '../../../native/system/scripts/repo.mjs'

/** Package carrying the x64 Landlock launcher and stable Node-API flock addons. */
export const LINUX_SYSTEM_PACKAGE = '@deepseek-ai/node-addon-system-linux-x64'

/**
 * Require real, complete ELF payloads rather than workspace links or missing optional dependencies.
 * @param {string} runtime Root of the prepared or packaged physical dsh tree.
 * @returns {void} Rejects missing files, links, wrong architectures and non-executable launchers.
 */
export function verifyLinuxSystemRuntime(runtime) {
  const directory = join(runtime, 'node_modules', LINUX_SYSTEM_PACKAGE)
  if (!lstatSync(directory).isDirectory()) throw new Error('desktop Linux runtime: system package must be a physical directory')
  const verified = verifyPlatformBinaries(directory)
  if (verified.name !== LINUX_SYSTEM_PACKAGE) throw new Error('desktop Linux runtime: unexpected system package')
  for (const file of ['bin/landlock-run', 'bin/glibc/system.node']) {
    if (!lstatSync(join(directory, file)).isFile()) throw new Error(`desktop Linux runtime: missing physical ${file}`)
  }
}
