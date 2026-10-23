import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const afterRemove = fileURLToPath(new URL('../packaging/linux/rpm-after-remove.tpl', import.meta.url))

function runRemoval(remaining: string, alternatives: boolean): string {
  // Functions intercept cleanup without changing host integration, and
  // execFileSync waits for the owned shell to exit.
  const script = `
    function update-alternatives() { printf '%s' 'removed-launcher'; }
    function rm() { printf '%s' 'removed-launcher'; }
    function apparmor_status() { return 1; }
    ${alternatives ? '' : 'function type() { return 1; }'}
    source "$2" "$1"
  `
  return execFileSync('/bin/bash', ['--noprofile', '--norc', '-c', script, 'rpm-removal-test', remaining, afterRemove], {
    env: { PATH: '/usr/bin:/bin', BASH_ENV: '/dev/null', ENV: '/dev/null' }, encoding: 'utf8', timeout: 15_000,
  })
}

describe.skipIf(process.platform === 'win32')('RPM removal scriptlet (requires Bash)', () => {
  it.each(['1', '2', ''])('preserves integration while %s versions remain or the count is absent', (remaining) => {
    expect(runRemoval(remaining, true)).toBe('')
    expect(runRemoval(remaining, false)).toBe('')
  })

  it.each([true, false])('removes the launcher on final uninstall with alternatives=%s', (alternatives) => {
    expect(runRemoval('0', alternatives)).toBe('removed-launcher')
  })
})
