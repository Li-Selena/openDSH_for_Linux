# openDSH for Linux

English | [中文](README.zh.md)

Community Fedora desktop adaptation of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), based on `0.2.1-rc.2`. This project is maintained independently and is not an official DeepSeek release.

## Status

This is a source preview targeting Fedora 44, x86_64, KDE Wayland. No community installer is published with this source import. Other distributions, desktops, and architectures are not validated.

The Fedora changes cover Linux desktop startup, a standalone bundled Node Host, CLI launch, environment handling, and local directory/AppImage/RPM packaging. See the [adaptation diff](community/fedora-changes.patch) and [source record](community/source-snapshot.json).

Historical local checks cover GUI/Host startup, file and shell operations, session recovery, plugin installation, mock API Key persistence, and Office samples. They do not establish real DeepSeek inference, complete upstream feature parity, RPM installation/upgrade/removal, or original AppImage FUSE/AppRun startup. This source copy has not been rebuilt in a clean environment.

<a id="run"></a>

<a id="run-from-source"></a>

## Source and dependencies

The repository includes built-in plugin source, tests, and versioned test snapshots. It excludes personal accounts, API Keys, private sessions, installed dependencies, local caches, built installers, personal artwork, and separately installed community plugins.

The source declares Node.js `^22.19.0 || >=24.0.0` and pnpm `11.28.5`. The [Linux packaging guide](apps/desktop/packaging/linux/README.md) describes the existing build entry point. Clean-environment setup and installer validation remain release preparation tasks; upstream development commands are documented in the [development guide](docs/development.md).

Use your own API Key through the application settings. Keep credentials in a separate local profile and never commit them. The package has no configured official update feed.

## Project layout

| Path | Purpose |
| --- | --- |
| `apps/desktop/` | Desktop application and Fedora adaptation |
| `packages/`, `native/`, `python/`, `vendor/` | Harness components and bundled-source dependencies |
| `scripts/`, `patches/` | Build, validation, and dependency patches |
| `docs/`, `snapshots/` | Upstream documentation and versioned test fixtures |
| `community/` | Source record and Fedora adaptation diff |

Upstream GitHub Actions workflows are retained as `.disabled` files. They do not provide community CI or publish packages. Upstream documentation and helper scripts may describe official infrastructure that this repository does not operate.

## Contributing

Report Fedora issues in [this repository](https://github.com/Li-Selena/openDSH_for_Linux/issues), including your environment, reproduction steps, and redacted diagnostics. Read the [contribution guide](CONTRIBUTING.md) before proposing changes.

## Attribution and license

The upstream source is by DeepSeek; Fedora adaptation is maintained by [Li-Selena](https://github.com/Li-Selena). Preserve the original copyright and [MIT license](LICENSE). Third-party components retain their own terms; see [third-party notices](THIRD_PARTY_NOTICES.md) and the [brand guidelines](BRAND_GUIDELINES.md).

The original import is a local source archive whose exact official upstream commit is unverified. The local baseline and adaptation identifiers in the source record are not official upstream release identifiers. Binary dependency and artwork redistribution review remains pending before installer publication.
