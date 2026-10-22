---
description: "生成本地未签名的 Linux x64 应用目录，包含内置运行时、插件支持与原生载荷校验。"
---

# Linux 本地包

[English](README.md) | 中文

## 概述

生成本地未签名的 Linux x64 应用目录，并校验其内置运行时与插件支持。AppImage 和 RPM 是同一目录的可选封装；构建不会安装或发布它们。

## 目录

- [生成目录](#build-directory)
- [产物格式与限制](#artifact-formats)
- [运行时与插件文件](#runtime-files)
- [不启用系统集成的启动](#startup)

<a id="build-directory"></a>

## 生成目录

在 Linux x64 上从仓库根目录运行。先按[源码配置步骤](../../../../README.zh.md#run-from-source)创建 `.local/fedora-env.sh` 并安装锁定依赖；本地环境将下载、临时文件、包存储与应用数据保留在当前项目内。

```sh
source .local/fedora-env.sh
pnpm --dir apps/desktop run package:linux --format dir
```

该命令构建 official 客户端 profile，打包当前第一方包，生成生产依赖闭包，准备内置解释器，并构建 Electron 应用。命令在报告成功前校验物理运行时清单、原生模块、终端执行、搜索、本地插件安装与 Office 转换。它不会安装或启动应用。

输出目录为 `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked/`，执行文件为 `deepseek-harness`。目录包含 `resources/app.asar` 内的 Electron GUI、`resources/dsh` 内的物理 Host 运行时，以及 `resources/runtime` 内的解释器和 CLI。保留的构建日志和阶段结果位于 `.desktop-build/packaging-runs/` 下。

`--skip-build` 复用已有的完整 official-profile 构建；打包阶段仍会校验记录的构建 profile。`DSH_DESKTOP_LINUX_APP_ID` 可以覆盖默认本地标识 `local.deepseek.harness`。包使用源码清单中的版本，产物名称保留 `unsigned` 后缀。

`DSH_DESKTOP_RUNTIME_STORE_DIR` 可选复用绝对路径的 pnpm store 目录，保留 lockfile 完整性检查及所有运行时 smoke 检查。省略时使用准备结束后删除的临时 store；空路径或相对路径会使准备失败。README 环境选择当前项目内的 `.local/pnpm-store`，以复用已下载的原生与 Office 载荷。

<a id="artifact-formats"></a>

## 产物格式与限制

同一入口接受 `--format AppImage` 或 `--format rpm`。它先构建并校验解包目录，再封装已验证应用的私有副本。RPM 还要求系统已有 `rpmbuild` 执行文件。命令不会安装缺失的系统工具、安装 RPM、发布包或注册桌面关联。AppImage 与 RPM 的安装行为需要单独的平台验收；目录包是首个本地交付目标。

如果 Fedora RPM 构建机缺少 `libcrypt.so.1`，electron-builder 内置 FPM 需要 `libxcrypt-compat`。[README](../../../../README.zh.md)给出了系统包安装方式，也可使用经过校验的私有副本，仅通过打包命令的 `LD_LIBRARY_PATH` 提供。这份兼容库属于构建依赖，不包含在应用内。

本地入口拒绝其他操作系统与 CPU 架构。它移除继承的官方签名、更新策略和部署设置。包不含官方强制更新策略或更新源，也不参与官方上传或保留 CI 发布产物的流程。

<a id="runtime-files"></a>

## 运行时与插件文件

运行时包含生产文件，不是指向开发源码的链接。没有匹配的本地 tarball 时，安装过程通过配置的 npm registry 解析 system entry 包的 Linux 平台依赖。缺少可选平台包会使准备失败，避免生成不完整应用。

Linux Host 和 CLI 使用 `resources/runtime/primary-runtime` 内置的独立 Node，Electron 运行 GUI。完整生产依赖树保留在物理目录 `resources/dsh` 下，包括 system entry、Linux 平台包和 Office 引擎。打包过程在复制前以及应用组装后，校验完整运行时清单、声明的 ELF 架构、Node-API 导出与 Landlock 执行权限。子进程收到可执行的文件系统路径。

第三方 bundle 保存在 `DSH_HOME` 下可写的 Desktop profile 中，应用运行时保持不可变。内置包管理器及已有 DSH 版本、构建脚本检查继续管理插件安装。共享运行时行为见 [Desktop 应用](../../README.zh.md)。

<a id="startup"></a>

## 不启用系统集成的启动

Linux 本地清单设置 `dshDesktopRegisterProtocolClient: false`。省略时表示 `true`；`false` 禁止注册操作系统级 `dsh://` 关联，非布尔值会使启动失败。内部 `dsh-app://` 应用 scheme 仍然可用。

验证执行文件时使用 [README 启动步骤](../../../../README.zh.md#run)，包括 `DSH_HOME`、Electron 的 `--user-data-dir` 参数及 `DSH_DESKTOP_HOST_ENVIRONMENT_MODE=inherit`。这会保留配置的临时与缓存目录，不运行用户登录 shell 的启动文件。打包本身不会安装 RPM 或配置桌面关联。
