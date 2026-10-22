/** Resolve operating-system protocol registration from the application manifest. */

/**
 * Read whether this application may register the dsh protocol client.
 * @param manifest - Parsed application manifest.
 * @returns The explicit boolean, or true when the field is absent.
 */
export function desktopProtocolRegistrationEnabled(manifest: unknown): boolean {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    throw new Error('desktop protocol: invalid application manifest')
  }
  if (!('dshDesktopRegisterProtocolClient' in manifest)) return true
  const enabled = manifest.dshDesktopRegisterProtocolClient
  if (typeof enabled !== 'boolean') {
    throw new Error('desktop protocol: dshDesktopRegisterProtocolClient must be a boolean')
  }
  return enabled
}
