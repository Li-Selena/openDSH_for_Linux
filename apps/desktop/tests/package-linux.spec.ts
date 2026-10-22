import { describe, expect, it } from 'vitest'
import { createElectronBuilderConfig } from '../scripts/electron-builder-config.mjs'
import { linuxLocalPackageEnvironment, parseLinuxPackageInvocation } from '../scripts/package-linux.ts'

describe('local Linux packaging', () => {
  it('defaults to an unpacked directory and accepts only explicit local artifact formats', () => {
    expect(parseLinuxPackageInvocation([], 'linux', 'x64')).toEqual({ format: 'dir', skipBuild: false })
    for (const format of ['dir', 'AppImage', 'rpm']) {
      expect(parseLinuxPackageInvocation(['--format', format, '--skip-build'], 'linux', 'x64'))
        .toEqual({ format, skipBuild: true })
    }
    expect(() => parseLinuxPackageInvocation(['--format', 'deb'], 'linux', 'x64')).toThrow('format must be')
    expect(() => parseLinuxPackageInvocation(['--publish', 'always'], 'linux', 'x64')).toThrow()
    expect(() => parseLinuxPackageInvocation(['--signed'], 'linux', 'x64')).toThrow()
  })

  it.each([['darwin', 'x64'], ['win32', 'x64'], ['linux', 'arm64']] as const)('rejects the %s/%s build host', (platform, arch) => {
    expect(() => parseLinuxPackageInvocation([], platform, arch)).toThrow('requires a Linux x64 build host')
  })

  it('retains contained build paths while stripping official policy, signing and upload settings', () => {
    const selected = linuxLocalPackageEnvironment({
      TMPDIR: '/controlled/tmp', XDG_CACHE_HOME: '/controlled/cache', DSH_HOME: '/controlled/home',
      DSH_DESKTOP_HOST_ENVIRONMENT_MODE: 'inherit', DSH_DESKTOP_APP_ID: 'com.deepseek.harness',
      DSH_DESKTOP_MANDATORY_UPDATE_CONFIG: 'official policy', DSH_DESKTOP_AUTO_UPDATE_ENV: 'production',
      DSH_DESKTOP_UPDATE_CHANNEL: 'latest', DSH_DESKTOP_MACOS_TEAM_ID: 'team',
      DSH_DESKTOP_WINDOWS_TOKEN_PIN: 'fixture', DOWNLOAD_PROD_COS_SECRET_KEY: 'fixture',
      APPLE_ID: 'fixture', CSC_LINK: 'fixture', DSH_PACKAGING_PRESET: 'production',
    })
    expect(selected).toMatchObject({ TMPDIR: '/controlled/tmp', XDG_CACHE_HOME: '/controlled/cache', DSH_HOME: '/controlled/home',
      DSH_DESKTOP_HOST_ENVIRONMENT_MODE: 'inherit', DSH_DESKTOP_APP_ID: 'local.deepseek.harness', DSH_DESKTOP_UNSIGNED: '1',
      DSH_DESKTOP_TARGET_PLATFORM: 'linux', DSH_DESKTOP_TARGET_ARCH: 'x64' })
    for (const name of ['DSH_DESKTOP_MANDATORY_UPDATE_CONFIG', 'DSH_DESKTOP_AUTO_UPDATE_ENV', 'DSH_DESKTOP_UPDATE_CHANNEL',
      'DSH_DESKTOP_WINDOWS_TOKEN_PIN', 'DSH_DESKTOP_MACOS_TEAM_ID', 'DOWNLOAD_PROD_COS_SECRET_KEY', 'APPLE_ID', 'CSC_LINK', 'DSH_PACKAGING_PRESET']) {
      expect(selected).not.toHaveProperty(name)
    }
  })

  it('builds local application metadata with neither official feeds nor OS protocol registration', () => {
    const config = createElectronBuilderConfig(linuxLocalPackageEnvironment(), 'linux', 'x64')
    expect(config.publish).toBeNull()
    expect(config.protocols).toEqual([])
    expect(config.extraMetadata.dshDesktopRegisterProtocolClient).toBe(false)
    expect(config.extraMetadata).not.toHaveProperty('dshMandatoryUpdatePolicy')
    expect(config.linux.executableName).toBe('deepseek-harness')
    expect(config.rpm?.packageName).toBe('deepseek-harness')
    expect(config.rpm?.afterRemove).toMatch(/rpm-after-remove\.tpl$/u)
    expect(config.rpm?.fpm).toEqual([
      '--rpm-compression', 'xz', '--rpm-compression-level', '6', '--iteration', '2',
      '--rpm-posttrans', expect.stringMatching(/rpm-posttrans\.sh$/u),
    ])
    expect(config.rpm?.artifactName).toContain('-r2-unsigned.')
    expect(config.artifactName).toContain('-unsigned.')
    expect(config.files.filter(entry => typeof entry !== 'string')).toEqual([])
    expect(config.extraResources).toContainEqual(expect.objectContaining({ to: 'dsh' }))
    expect(config.extraResources).toContainEqual(expect.objectContaining({ to: 'dsh/node_modules', filter: ['**/*'] }))
  })

  it('rejects signed Linux packaging even when official release variables are present', () => {
    expect(() => createElectronBuilderConfig({ ...linuxLocalPackageEnvironment(), DSH_DESKTOP_UNSIGNED: '0' }, 'linux', 'x64'))
      .toThrow('unsigned local x64 packages only')
  })
})
