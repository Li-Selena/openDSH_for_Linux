# Contributing

English | [中文](CONTRIBUTING.zh.md)

This repository maintains the community Fedora adaptation of DeepSeek Harness. Report issues and propose focused changes in [Li-Selena/openDSH_for_Linux](https://github.com/Li-Selena/openDSH_for_Linux).

## Reporting issues

Include the source revision, Fedora and desktop versions, reproduction steps, expected behavior, and actual behavior. Redact logs and screenshots; never attach credentials, account data, private sessions, or complete application profiles.

## Proposing changes

Keep Fedora adaptations separate from unrelated refactoring and dependency upgrades. Describe the problem, resulting behavior, checks run, and remaining limitations. Update both language versions of affected documentation and preserve existing licenses and attribution.

Use isolated test profiles without real credentials. Follow [AGENTS.md](AGENTS.md) and the [upstream development guide](docs/development.md) for relevant source checks. Do not claim a platform or installer has passed based only on an unpacked executable test.

## Scope

The initial target is Fedora 44, x86_64, KDE Wayland. Other environments require separate evidence. Upstream workflows are disabled and do not establish automated validation for this community repository.
