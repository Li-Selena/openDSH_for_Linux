# openDSH for Linux

English | [中文](README.zh.md)

Community Fedora desktop adaptation of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), based on `0.2.1-rc.2`. Maintained independently; this is not an official DeepSeek release.

## Status

This repository currently distributes source. There is no downloadable community installer yet. The primary setup below builds and runs an unsigned application directory; cloning the repository alone does not install the desktop app.

The target is Fedora 44, x86_64, KDE Wayland. Historical local checks cover GUI/Host startup, files and shell commands, session recovery, plugins, mock API Key persistence, and Office samples. A fresh-machine end-to-end installation, real DeepSeek inference, complete upstream feature parity, RPM system lifecycle, and original AppImage FUSE/AppRun startup remain unvalidated.

## Requirements

The source manifest and existing Fedora build records establish the following requirements. The system package commands below are Fedora setup guidance, not a claim that a minimal fresh system has been qualified.

| Item | Requirement |
| --- | --- |
| OS / CPU | Fedora 44, x86_64; Linux x64 is required by the packaging entry point |
| Desktop | KDE Plasma / Wayland is the initial validation target; a graphical session is needed to run the app |
| Node.js | Recommend [Node.js 24 LTS](https://nodejs.org/en/download), with npm and development headers; the source declares `^22.19.0 || >=24.0.0` |
| Package manager | [Corepack](https://github.com/nodejs/corepack), selecting the repository-pinned pnpm `11.28.5`; do not substitute `pnpm@latest` |
| Build tools | Git 2.26+, GCC/G++, Make, Python 3, pkg-config, tar, xz, unzip |
| GUI libraries | GTK 3, NSS, ALSA, GBM/DRM and X11 compatibility libraries, including on Wayland |
| Network | Access to npm, GitHub, Electron, Node.js and Python/runtime download sources; the initial build downloads substantial payloads |
| Disk / memory | Allow tens of GB for dependencies, caches and intermediate files; the previous bundled application was about 1.1 GB. No minimum RAM has been established |
| API Key | Not needed to build; use your own valid DeepSeek API Key for model requests after startup |

Run the following in a Fedora terminal to install missing build tools and common GUI libraries. `sudo` is used only for system packages; run dependency installation, builds and the app as your ordinary user.

```bash
sudo dnf install git gcc gcc-c++ make python3 pkgconf-pkg-config tar xz unzip
sudo dnf install gtk3 nss alsa-lib libXScrnSaver mesa-libgbm libdrm
```

Install a complete Node.js 24 distribution following the [Node.js instructions](https://nodejs.org/en/download), then confirm `node --version`, `npm --version`, and `corepack --version`. Official Node.js 24 distributions include Corepack; if your distribution omits it, follow the [Corepack installation instructions](https://github.com/nodejs/corepack#how-to-install). Native builds need `include/node/node_api.h` relative to the selected Node installation.

<a id="run"></a>

<a id="run-from-source"></a>

## Build and run from source

Use Bash for the commands below. The directory-build entry point was used for the existing Fedora adaptation; the complete fresh-machine sequence below has not been requalified. No private profile or developer-specific parent directory is required.

### 1. Get the repository

```bash
git clone https://github.com/Li-Selena/openDSH_for_Linux.git
cd openDSH_for_Linux
```

Use Git clone rather than a ZIP: packaging records Git HEAD. Run the following steps from the repository root.

### 2. Create an isolated local environment

Create the ignored `.local/fedora-env.sh` once. It keeps application data and common tool caches in this checkout and creates pnpm shims locally, without changing shell startup files or global command associations.

```bash
mkdir -p .local
cat > .local/fedora-env.sh <<'EOF'
export DSH_LINUX_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
umask 077
export COREPACK_HOME="$DSH_LINUX_ROOT/.local/corepack"
export COREPACK_ENABLE_AUTO_PIN=0
export PNPM_HOME="$DSH_LINUX_ROOT/.local/pnpm"
export PATH="$DSH_LINUX_ROOT/.local/bin:$PNPM_HOME:$PATH"
export TMPDIR="$DSH_LINUX_ROOT/.local/tmp"
export TMP="$TMPDIR"
export TEMP="$TMPDIR"
export XDG_CACHE_HOME="$DSH_LINUX_ROOT/.local/cache"
export XDG_CONFIG_HOME="$DSH_LINUX_ROOT/.local/config"
export XDG_DATA_HOME="$DSH_LINUX_ROOT/.local/share"
export XDG_STATE_HOME="$DSH_LINUX_ROOT/.local/state"
export npm_config_cache="$DSH_LINUX_ROOT/.local/npm-cache"
export npm_config_devdir="$DSH_LINUX_ROOT/.local/node-gyp"
export ELECTRON_CACHE="$XDG_CACHE_HOME/electron"
export electron_config_cache="$ELECTRON_CACHE"
export ELECTRON_BUILDER_CACHE="$XDG_CACHE_HOME/electron-builder"
export DSH_DESKTOP_RUNTIME_STORE_DIR="$DSH_LINUX_ROOT/.local/pnpm-store"
export DSH_HOME="$DSH_LINUX_ROOT/.local/run/dsh-home"
export DSH_DESKTOP_USER_DATA_DIR="$DSH_LINUX_ROOT/.local/run/electron"
export DSH_DESKTOP_HOST_ENVIRONMENT_MODE=inherit
export DSH_DESKTOP_OPEN_DEVTOOLS=0
export DSH_TELEMETRY_MODE=DISABLED
export DSH_TELEMETRY_DISABLED=1
mkdir -p "$DSH_LINUX_ROOT/.local/bin" "$COREPACK_HOME" "$PNPM_HOME" \
  "$TMPDIR" "$XDG_CACHE_HOME" "$XDG_CONFIG_HOME" "$XDG_DATA_HOME" \
  "$XDG_STATE_HOME" "$npm_config_cache" "$npm_config_devdir" \
  "$DSH_DESKTOP_RUNTIME_STORE_DIR" "$DSH_HOME" "$DSH_DESKTOP_USER_DATA_DIR"
EOF
source .local/fedora-env.sh
corepack enable --install-directory "$DSH_LINUX_ROOT/.local/bin" pnpm
pnpm --version
```

The pnpm version should be `11.28.5`, selected by `package.json`; Corepack may need to download it the first time. In every new terminal, return to the checkout and run `source .local/fedora-env.sh` before continuing. Keep this local file out of commits.

### 3. Install dependencies and build

```bash
pnpm install --frozen-lockfile --store-dir "$DSH_DESKTOP_RUNTIME_STORE_DIR"
pnpm --dir apps/desktop run package:linux --format dir
```

Do not add `--ignore-scripts` for source setup: this workspace explicitly allowlists required native build scripts. The packaging command builds the client, resolves production dependencies, downloads the bundled runtime, and runs its own payload checks; it does not install an RPM or launch the app.

Successful directory output: `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked/`. The executable is `deepseek-harness`. Keep the entire directory, including `resources/`; the executable alone is not a complete app.

### 4. Start the directory build

```bash
source .local/fedora-env.sh
dsh_app_dir="$DSH_LINUX_ROOT/apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked"
"$dsh_app_dir/deepseek-harness" --user-data-dir="$DSH_DESKTOP_USER_DATA_DIR"
```

Start it from an ordinary graphical desktop session. This runs the built directory directly, without requiring a system RPM installation. It does not perform the separate KDE menu/taskbar integration used by the maintainer’s personal deployment.

The packaged app contains its own Node/pnpm/Python runtime. To check its CLI in another terminal, source the same environment, set `dsh_app_dir` as above, and run:

```bash
"$dsh_app_dir/resources/runtime/cli/bin/dsh" --version
```

### 5. Configure the first session

1. Choose **Add API Key** in the welcome screen, or open the account/model settings later.
2. Enter and save your own DeepSeek API Key, then select your workspace and model.
3. Make a small test request to verify your key, network and account. Mock persistence tests do not establish real service access.
4. Install optional community plugins through the app’s plugin manager. Whale, dsh-web and personal artwork are not bundled here.

The environment above stores credentials, sessions and settings in `.local/run/`. Back it up privately before updating; do not upload it, attach it to an issue, or delete it as though it were only a cache.

## Optional AppImage and RPM output

After the directory build succeeds, the same source entry point accepts the commands below. `--skip-build` reuses the existing complete client build; packaging and runtime validation still run.

```bash
pnpm --dir apps/desktop run package:linux --format AppImage --skip-build
```

RPM additionally needs Fedora’s [rpm-build](https://packages.fedoraproject.org/pkgs/rpm/rpm-build/) and, for the bundled FPM on hosts missing `libcrypt.so.1`, [libxcrypt-compat](https://packages.fedoraproject.org/pkgs/libxcrypt/libxcrypt-compat/):

```bash
sudo dnf install rpm-build libxcrypt-compat
pnpm --dir apps/desktop run package:linux --format rpm --skip-build
```

Artifacts are written under `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/` and retain `unsigned` in their names. Building these files does not install them. RPM system installation/upgrade/removal and original AppImage startup remain separate validation tasks; prefer the directory workflow above for this preview.

## Updates, removal and troubleshooting

- **Update:** exit the app, privately back up `.local/run/`, use `git pull --ff-only`, then repeat environment loading, dependency installation and directory packaging. No official automatic update feed is configured.
- **Remove:** after exit, remove the directory build or the checkout when no longer needed; preserve `.local/run/` if you want to keep credentials and sessions. This directory workflow installs no system RPM.
- **Missing runtime library:** inspect `ldd "$dsh_app_dir/deepseek-harness"` and install the Fedora package supplying the missing library. Chinese Office previews also need available CJK fonts.
- **Build failure:** inspect `apps/desktop/.desktop-build/packaging-runs/`; check Node headers, pnpm version, download access and the first failed stage. Avoid sharing raw logs without redaction.
- **Memory pressure:** set `export DSH_GATE_CONCURRENCY=2` before building to reduce concurrent steps.
- **Corepack/signature error:** update Corepack using its official instructions; keep integrity checks enabled.
- **SOCKS proxy warning:** DSH’s HTTP proxy configuration expects an HTTP/HTTPS proxy URL; check the [network guide](docs/user/guide/network-proxy.md).
- **Node loader error:** do not disable native TypeScript stripping with `--no-experimental-strip-types` in `NODE_OPTIONS`.
- **Sandbox/SELinux failure:** preserve the error and diagnose the affected permission; disabling Electron’s sandbox or SELinux is not part of this setup.

## Source, contributing and license

Built-in plugin source, tests and versioned test snapshots are included. Personal profiles, installed dependencies, caches, installers and separately installed community plugins are excluded. See the [Linux packaging reference](apps/desktop/packaging/linux/README.md), [development guide](docs/development.md), [adaptation diff](community/fedora-changes.patch) and [source record](community/source-snapshot.json).

Upstream GitHub Actions and Dependabot configurations are retained with `.disabled` suffixes. They do not provide community CI or publishing. Report issues in [this repository](https://github.com/Li-Selena/openDSH_for_Linux/issues) and read the [contribution guide](CONTRIBUTING.md) before proposing changes.

The upstream source is by DeepSeek; Fedora adaptation is maintained by [Li-Selena](https://github.com/Li-Selena). Preserve the original copyright and [MIT license](LICENSE); third-party components retain their own terms. See [third-party notices](THIRD_PARTY_NOTICES.md) and [brand guidelines](BRAND_GUIDELINES.md).

The original import is a local archive whose exact official upstream commit is unverified. Local identifiers in the source record are not official release identifiers. Binary dependency and artwork redistribution review remains pending before installer publication.
