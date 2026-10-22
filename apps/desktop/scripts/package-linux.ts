/** Build unsigned Linux packages without official publication, update feeds or signing settings. */
import { execFile } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs, promisify } from 'node:util'
import { pnpmCommand } from '../../../scripts/release/process.ts'
import { desktopTargetBuildPaths } from './desktop-build-paths.mjs'
import { desktopBuildCommitEnvironment, readDesktopBuildCommit } from './desktop-build-commit.mjs'
import { resolveDesktopAppId } from './desktop-release-environment.mjs'
import { createPackagingRun } from './packaging-run.mjs'
import { packagingErrorDetails } from './packaging-step.mjs'

const APP_ROOT = resolve(import.meta.dirname, '..')
const REPOSITORY_ROOT = resolve(APP_ROOT, '../..')
const LOCAL_RELEASE_SETTINGS = [
  /^DSH_DESKTOP_(?:APP_ID|LINUX_APP_ID|BUILD_VERSION|PACKAGING_RUN_DIR)$/iu,
  /^DSH_DESKTOP_(?:AUTO_UPDATE_|MANDATORY_UPDATE_|UPDATE_|MACOS_|WINDOWS_)/iu,
  /^(?:DSH_PACKAGING_|DOWNLOAD_(?:TEST|PROD)_|APPLE_|(?:WIN_)?CSC_)/iu,
]

/** Local artifacts built from the same verified Linux application directory. */
export type LinuxPackageFormat = 'dir' | 'AppImage' | 'rpm'

/** Validated options for one native Linux x64 packaging run. */
export interface LinuxPackageInvocation {
  readonly format: LinuxPackageFormat
  /** Reuse the existing official-profile build; release packing still verifies its build record. */
  readonly skipBuild: boolean
}

/**
 * Parse the local entry point, rejecting foreign build hosts and all publication/signing flags.
 * @param argv Arguments after the script name.
 * @param platform Build-host operating system.
 * @param arch Build-host architecture.
 * @returns Native-target local packaging options; directory output is the default.
 */
export function parseLinuxPackageInvocation(
  argv: readonly string[], platform: NodeJS.Platform = process.platform, arch: string = process.arch,
): LinuxPackageInvocation {
  if (platform !== 'linux' || arch !== 'x64') throw new Error('desktop Linux package: requires a Linux x64 build host')
  const { values } = parseArgs({ args: argv.filter(argument => argument !== '--'), allowPositionals: false,
    options: { format: { type: 'string', default: 'dir' }, 'skip-build': { type: 'boolean', default: false } } })
  const format = values.format
  if (format !== 'dir' && format !== 'AppImage' && format !== 'rpm') throw new Error('desktop Linux package: format must be dir, AppImage or rpm')
  return { format, skipBuild: values['skip-build'] }
}

/**
 * Select local identity and unsigned mode without inheriting official release policy or credentials.
 * @param environment Parent build environment; temporary directories and tool caches are retained.
 * @returns Isolated Linux environment; DSH_DESKTOP_LINUX_APP_ID may override the local app identifier.
 */
export function linuxLocalPackageEnvironment(environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const selected = {
    ...Object.fromEntries(Object.entries(environment).filter(([name]) => !LOCAL_RELEASE_SETTINGS.some(rule => rule.test(name)))),
    DSH_DESKTOP_APP_ID: environment.DSH_DESKTOP_LINUX_APP_ID ?? 'local.deepseek.harness',
    DSH_DESKTOP_UNSIGNED: '1',
    DSH_DESKTOP_TARGET_PLATFORM: 'linux',
    DSH_DESKTOP_TARGET_ARCH: 'x64',
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  }
  resolveDesktopAppId(selected)
  return selected
}

/**
 * Build and verify a local Linux application before optionally wrapping it in AppImage or RPM.
 * @param invocation Validated native Linux packaging options.
 * @param environment Parent environment supplying contained temporary/cache paths and networking.
 * @returns The directory containing unsigned local artifacts; no package is installed or published.
 */
export async function packageLinux(
  invocation: LinuxPackageInvocation, environment: NodeJS.ProcessEnv = process.env,
): Promise<string> {
  // Exported callers receive the same native-host check as the CLI before any writes or downloads.
  parseLinuxPackageInvocation([])
  const selected = linuxLocalPackageEnvironment(environment)
  if (invocation.format === 'rpm') await promisify(execFile)('rpmbuild', ['--version'], { env: selected })
  const paths = desktopTargetBuildPaths('linux-x64')
  const product = JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf8')) as { version: string }
  Object.assign(selected, desktopBuildCommitEnvironment(readDesktopBuildCommit(REPOSITORY_ROOT)))
  const secrets = Object.entries(environment).filter(([name]) => /KEY|SECRET|TOKEN|PASSWORD/iu.test(name)).map(([, value]) => value ?? '')
  const run = createPackagingRun(join(APP_ROOT, '.desktop-build', 'packaging-runs'), {
    target: 'linux-x64', format: invocation.format, unsigned: true, version: product.version,
  }, { secrets })
  selected.DSH_DESKTOP_PACKAGING_RUN_DIR = run.directory
  const [command, ...prefix] = pnpmCommand()
  const execute = (stage: string, args: readonly string[], cwd = APP_ROOT) =>
    run.run(stage, command, [...prefix, ...args], { cwd, env: selected })
  const builder = (format?: Exclude<LinuxPackageFormat, 'dir'>) => [
    'exec', 'electron-builder', '--config', 'electron-builder.config.mjs', '--linux', ...format === undefined ? [] : [format],
    '--x64', '--publish', 'never',
  ]
  let success = false
  try {
    if (!invocation.skipBuild) await execute('build', ['run', 'build:official'], REPOSITORY_ROOT)
    await execute('pack:dsh', ['run', 'release:pack', '--family', 'dsh', '--out', paths.packedDsh], REPOSITORY_ROOT)
    await execute('pack:host', ['--dir', 'apps/desktop-host', 'pack', '--pack-destination', paths.packedDsh], REPOSITORY_ROOT)
    await execute('pack:vendor', ['run', 'release:pack', '--family', 'vendor', '--out', paths.packedVendor], REPOSITORY_ROOT)
    rmSync(paths.packedLandlock, { recursive: true, force: true })
    mkdirSync(paths.packedLandlock, { recursive: true })
    await execute('build:system-entry', ['--dir', 'native/system', 'run', 'build:ts'], REPOSITORY_ROOT)
    await execute('pack:system-entry', ['--dir', 'native/system/packages/entry', 'pack', '--pack-destination', paths.packedLandlock], REPOSITORY_ROOT)
    await execute('prepare:runtime', ['run', 'prepare:runtime'])
    await execute('prepare:packages', ['run', 'prepare:packages'])
    await execute('prepare:dsh', ['run', 'prepare:dsh'])
    await execute('package:dir', [...builder(), '--dir'])
    await execute('verify:application', ['exec', 'tsx', 'scripts/smoke-packaged-runtime.ts', '--unsigned'])
    if (invocation.format !== 'dir') {
      // RPM's target writes AppArmor metadata into its input even with --prepackaged.
      const staging = join(run.directory, 'prepackaged')
      try {
        cpSync(join(paths.unsignedArtifacts, 'linux-unpacked'), staging, { recursive: true, preserveTimestamps: true, verbatimSymlinks: true })
        await execute('package:artifact', [...builder(invocation.format), '--prepackaged', staging])
      } finally { rmSync(staging, { recursive: true, force: true }) }
    }
    success = true
    return paths.unsignedArtifacts
  } catch (error) {
    throw new Error(`desktop Linux package failed; see ${run.directory}\n${packagingErrorDetails(error, secrets)}`)
  } finally {
    run.finish(success)
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === import.meta.filename) {
  const invocation = parseLinuxPackageInvocation(process.argv.slice(2))
  console.log(`desktop Linux package: ${await packageLinux(invocation)}`)
}
