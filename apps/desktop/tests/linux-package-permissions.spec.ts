import { chmodSync, lstatSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeLinuxPackagePermissions } from '../scripts/linux-package-permissions.mjs'

describe.skipIf(process.platform === 'win32')('Linux package permissions (requires POSIX modes)', () => {
  it('allows ordinary users to read a root-installed payload and execute its programs', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'linux-package-modes-'))
    try {
      const app = join(fixture, 'app')
      const resources = join(app, 'resources')
      mkdirSync(resources, { recursive: true, mode: 0o700 })
      const archive = join(resources, 'app.asar')
      const program = join(app, 'deepseek-harness')
      const data = join(resources, 'data')
      writeFileSync(archive, 'fixture', { mode: 0o600 })
      writeFileSync(program, 'fixture', { mode: 0o700 })
      writeFileSync(data, 'fixture')
      chmodSync(data, 0o666)
      const external = join(fixture, 'external')
      writeFileSync(external, 'private fixture', { mode: 0o600 })
      const link = join(resources, 'external-link')
      symlinkSync(external, link)

      normalizeLinuxPackagePermissions(app)

      for (const directory of [app, resources]) expect(lstatSync(directory).mode & 0o7777).toBe(0o755)
      for (const file of [archive, data]) expect(lstatSync(file).mode & 0o7777).toBe(0o644)
      expect(lstatSync(program).mode & 0o7777).toBe(0o755)
      expect(lstatSync(link).isSymbolicLink()).toBe(true)
      expect(lstatSync(external).mode & 0o7777).toBe(0o600)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
