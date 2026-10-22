---
description: "Build a local unsigned Linux x64 application directory with bundled runtimes, plugin support and native payload verification."
---

# Local Linux packages

English | [中文](README.zh.md)

## Summary

Build a local unsigned Linux x64 application directory, then validate its bundled runtime and plugin support. AppImage and RPM are optional wrappers of the same directory; building does not install or publish them.

## Table of Contents

- [Build a directory](#build-directory)
- [Artifact formats and limits](#artifact-formats)
- [Runtime and plugin files](#runtime-files)
- [Startup without system integration](#startup)

<a id="build-directory"></a>

## Build a directory

Run from the repository root on Linux x64. First follow the [source setup](../../../../README.md#run-from-source) to create `.local/fedora-env.sh` and install the locked dependencies; the local environment keeps downloads, temporary files, package stores and application data in this checkout.

```sh
source .local/fedora-env.sh
pnpm --dir apps/desktop run package:linux --format dir
```

The command builds the official client profile, packs the current first-party packages, materializes a production dependency closure, prepares the bundled interpreters and builds the Electron application. It validates the physical runtime inventory, native modules, terminal execution, search, local plugin installation and Office conversion before reporting success. It does not install or launch the application.

The output is `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked/`, with the executable `deepseek-harness`. The folder includes the Electron GUI in `resources/app.asar`, the physical Host runtime in `resources/dsh`, and bundled interpreters and CLI in `resources/runtime`. Retained build logs and stage outcomes live under `.desktop-build/packaging-runs/`.

`--skip-build` reuses an existing complete official-profile build; package packing still verifies the recorded build profile. `DSH_DESKTOP_LINUX_APP_ID` overrides the default local identifier `local.deepseek.harness`. The package uses the source manifest version and retains the `unsigned` artifact suffix.

`DSH_DESKTOP_RUNTIME_STORE_DIR` optionally reuses an absolute pnpm store directory, retaining lockfile integrity checks and every runtime smoke check. Omission uses a temporary store removed after preparation; empty or relative paths reject preparation. The README environment selects `.local/pnpm-store` inside this checkout, so previously downloaded native and Office payloads can be reused.

<a id="artifact-formats"></a>

## Artifact formats and limits

The same entry point accepts `--format AppImage` or `--format rpm`. It first builds and checks the unpacked directory, then wraps a private copy of that verified application. RPM additionally requires an existing `rpmbuild` executable. The command does not install missing system tools, install RPMs, publish packages or register desktop associations. AppImage and RPM installation behavior require separate platform validation; the directory package is the first local delivery target.

On a Fedora RPM build host without `libcrypt.so.1`, electron-builder's bundled FPM needs `libxcrypt-compat`. The [README](../../../../README.md) gives the system-package option; a verified private copy exposed through `LD_LIBRARY_PATH` only to the packaging command is an alternative. This compatibility library is a build dependency and is not included in the application.

The local entry point rejects other operating systems and CPU architectures. It strips inherited official signing, update-policy and deployment settings. The package has no official mandatory-update policy or update feed, and it does not participate in the official upload or retained-CI release workflow.

<a id="runtime-files"></a>

## Runtime and plugin files

The runtime contains production files, rather than links into the development checkout. Installation resolves the system entry package's Linux platform dependency through the configured npm registry when no matching local tarball is supplied. Missing optional packages fail preparation instead of producing an incomplete application.

The Linux Host and CLI run with the standalone Node bundled in `resources/runtime/primary-runtime`, while Electron runs the GUI. The complete production tree, including the system entry, Linux platform package and Office engine, remains physical under `resources/dsh`. Packaging verifies the complete runtime inventory, declared ELF architecture, Node-API exports and Landlock executable permissions before copying and again in the assembled application. Subprocesses receive executable filesystem paths.

Third-party bundles stay in the writable Desktop profile under `DSH_HOME`; the application runtime remains immutable. The bundled package manager and the existing DSH version/build-script checks continue to govern plugin installation. See [the Desktop application](../../README.md) for shared runtime behavior.

<a id="startup"></a>

## Startup without system integration

The Linux local manifest sets `dshDesktopRegisterProtocolClient: false`. Omission means `true`; `false` prevents OS-level `dsh://` association registration, and a non-boolean value rejects startup. The internal `dsh-app://` application scheme remains available.

Use the [README startup procedure](../../../../README.md#run) when validating the executable, including `DSH_HOME`, the Electron `--user-data-dir` argument and `DSH_DESKTOP_HOST_ENVIRONMENT_MODE=inherit`. This preserves the configured temporary/cache directories without running user login-shell startup files. Packaging does not itself install an RPM or configure desktop associations.
