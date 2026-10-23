import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { normalizeLinuxBundlePaths, relativeBundleRegionPaths } from '../scripts/linux-bundle-paths.mjs'

const repository = '/home/build-user/private/project.name'
const label = `//#region \\0dsh-css:${repository}/packages/client/style.css.mjs`

it('makes plain and serialized debug labels relative without changing string values or legal notices', () => {
  const source = `/*! Copyright Example, MIT */\n${label}\nconst value = ${JSON.stringify(repository)};\n`
  const expected = source.replace(`${repository}/packages`, 'packages')
  expect(relativeBundleRegionPaths(source, repository)).toBe(expected)
  expect(JSON.parse(relativeBundleRegionPaths(JSON.stringify(source), repository))).toBe(expected)
  expect(relativeBundleRegionPaths(source, '/home/build-user/private/projectXname')).toBe(source)
})

describe.skipIf(process.platform === 'win32')('Linux runtime debug paths (requires POSIX symlinks)', () => {
  it('rewrites JavaScript bundles while preserving non-code files and external symlink targets', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'linux-bundle-paths-'))
    try {
      const runtime = join(fixture, 'runtime')
      mkdirSync(runtime)
      const bundle = join(runtime, 'client.js')
      const data = join(runtime, 'data.txt')
      const external = join(fixture, 'external.js')
      for (const file of [bundle, data, external]) writeFileSync(file, label)
      symlinkSync(external, join(runtime, 'external.js'))
      expect(normalizeLinuxBundlePaths(runtime, repository)).toBe(1)
      expect(readFileSync(bundle, 'utf8')).toBe(label.replace(`${repository}/packages`, 'packages'))
      for (const file of [data, external]) expect(readFileSync(file, 'utf8')).toBe(label)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
