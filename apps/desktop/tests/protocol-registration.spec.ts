import { expect, it } from 'vitest'
import { desktopProtocolRegistrationEnabled } from '../src/protocol-registration.ts'

it('retains protocol registration unless the manifest explicitly disables it', () => {
  expect(desktopProtocolRegistrationEnabled({})).toBe(true)
  expect(desktopProtocolRegistrationEnabled({ dshDesktopRegisterProtocolClient: true })).toBe(true)
  expect(desktopProtocolRegistrationEnabled({ dshDesktopRegisterProtocolClient: false })).toBe(false)
})

it.each([undefined, null, 'false', 0, 1, {}, []])('rejects a nonboolean protocol registration field (%j)', value => {
  expect(() => desktopProtocolRegistrationEnabled({ dshDesktopRegisterProtocolClient: value })).toThrow('must be a boolean')
})

it.each([undefined, null, 'false', []])('rejects an invalid application manifest (%j)', manifest => {
  expect(() => desktopProtocolRegistrationEnabled(manifest)).toThrow('invalid application manifest')
})
