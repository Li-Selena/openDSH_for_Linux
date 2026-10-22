/** Package carrying the x64 Landlock launcher and stable Node-API flock addons. */
export const LINUX_SYSTEM_PACKAGE: '@deepseek-ai/node-addon-system-linux-x64'

/**
 * Require complete ELF payloads in a physical production package directory.
 * @param runtime Prepared or packaged physical dsh tree.
 * @returns Nothing; rejects links, missing payloads, wrong architectures and non-executable launchers.
 */
export function verifyLinuxSystemRuntime(runtime: string): void
