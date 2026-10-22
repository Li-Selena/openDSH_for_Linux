/** Explicit package-store reuse for Desktop production dependency preparation. */
/**
 * Select an absolute pnpm store only when packaging explicitly configures one.
 * @param environment Packaging environment; no filesystem changes are performed.
 * @returns Normalized configured directory, or undefined to retain temporary storage.
 */
export function resolveDesktopRuntimeStoreDirectory(environment: NodeJS.ProcessEnv): string | undefined
