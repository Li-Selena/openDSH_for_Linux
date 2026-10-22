import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { LINUX_SYSTEM_PACKAGE, verifyLinuxSystemRuntime } from '../scripts/linux-runtime.mjs'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'linux-runtime-test-'))
  roots.push(root)
  const directory = join(root, 'node_modules', LINUX_SYSTEM_PACKAGE)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ name: LINUX_SYSTEM_PACKAGE, os: ['linux'], cpu: ['x64'] }))
  const binaries = [
    { tool: 'landlock-run', kind: 'static-musl', path: 'bin/landlock-run' },
    { tool: 'flock', kind: 'node-api', path: 'bin/glibc/system.node', libc: 'glibc', napi: 8 },
    { tool: 'flock', kind: 'node-api', path: 'bin/musl/system.node', libc: 'musl', napi: 8 },
  ]
  writeFileSync(join(directory, 'prebuilds.json'), JSON.stringify({ platform: 'linux-x64', binaries }))
  for (const binary of binaries) {
    const body = Buffer.alloc(64)
    body.writeUInt32LE(0x464c457f)
    body[4] = 2
    body[5] = 1
    body.writeUInt16LE(binary.kind === 'static-musl' ? 2 : 3, 16)
    body.writeUInt16LE(62, 18)
    const file = join(directory, binary.path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.concat([body, Buffer.from('napi_register_module_v1\0node_api_module_get_api_version_v1\0')]), { mode: 0o755 })
  }
  return { root, directory }
}

it('requires all declared Linux ELF binaries in a materialized package', () => {
  const f = fixture()
  expect(() => { verifyLinuxSystemRuntime(f.root) }).not.toThrow()
  rmSync(join(f.directory, 'bin/landlock-run'))
  expect(() => { verifyLinuxSystemRuntime(f.root) }).toThrow('missing bin/landlock-run')
})

it.skipIf(process.platform === 'win32')('rejects a non-executable Landlock launcher', () => {
  const f = fixture()
  chmodSync(join(f.directory, 'bin/landlock-run'), 0o644)
  expect(() => { verifyLinuxSystemRuntime(f.root) }).toThrow('not executable')
})

it('rejects a development symlink in place of the physical platform package', () => {
  const f = fixture()
  const runtime = join(f.root, 'linked')
  const link = join(runtime, 'node_modules', LINUX_SYSTEM_PACKAGE)
  mkdirSync(dirname(link), { recursive: true })
  symlinkSync(f.directory, link, process.platform === 'win32' ? 'junction' : 'dir')
  expect(() => { verifyLinuxSystemRuntime(runtime) }).toThrow('physical directory')
})

it('rejects wrong-architecture addons before application packaging', () => {
  const f = fixture()
  writeFileSync(join(f.directory, 'bin/glibc/system.node'), 'not an ELF file')
  expect(() => { verifyLinuxSystemRuntime(f.root) }).toThrow('ELF64')
})
