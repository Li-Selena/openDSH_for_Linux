# openDSH for Linux

[English](README.md) | 中文

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) `0.2.1-rc.2` 的社区 Fedora 桌面适配。本项目独立维护，不是 DeepSeek 官方发行版。

## 状态

当前为源码预览，目标环境是 Fedora 44、x86_64、KDE Wayland。本次源码导入不附带社区安装包，其他发行版、桌面环境和架构尚未验证。

Fedora 改动涵盖 Linux 桌面启动、独立随包 Node Host、CLI 启动、环境处理及本地目录/AppImage/RPM 打包，详见[适配差异](community/fedora-changes.patch)与[源码记录](community/source-snapshot.json)。

历史本地检查覆盖 GUI/Host 启动、文件与 Shell 操作、会话恢复、插件安装、模拟 API Key 持久化和 Office 样例。这些检查不代表真实 DeepSeek 推理、完整官方功能对齐、RPM 安装/升级/卸载或 AppImage 原始 FUSE/AppRun 路径已经验收。本源码副本尚未在干净环境重新构建。

<a id="run"></a>

<a id="run-from-source"></a>

## 源码与依赖

仓库包含内置插件源码、测试和受版本管理的测试快照，不包含个人账号、API Key、私人会话、已安装依赖、本机缓存、安装包、个人图片及额外安装的社区插件。

源码声明 Node.js `^22.19.0 || >=24.0.0` 和 pnpm `11.28.5`。[Linux 打包说明](apps/desktop/packaging/linux/README.zh.md)介绍现有构建入口。干净环境配置与安装流程验证仍属于发行准备事项；上游开发命令见[开发指南](docs/development.zh.md)。

请在应用设置中填写自己的 API Key，凭据保留在独立本地配置中，不要提交到仓库。当前包未配置官方更新源。

## 项目目录

| 路径 | 用途 |
| --- | --- |
| `apps/desktop/` | 桌面应用与 Fedora 适配 |
| `packages/`、`native/`、`python/`、`vendor/` | Harness 组件与随仓库保存的依赖源码 |
| `scripts/`、`patches/` | 构建、验证与依赖补丁 |
| `docs/`、`snapshots/` | 上游文档与受版本管理的测试样例 |
| `community/` | 源码记录与 Fedora 适配差异 |

上游 GitHub Actions 工作流以 `.disabled` 文件保留，不提供社区 CI，也不发布包。上游文档和辅助脚本可能描述本仓库并未运营的官方基础设施。

## 参与贡献

请在[本仓库](https://github.com/Li-Selena/openDSH_for_Linux/issues)报告 Fedora 问题，提供环境、复现步骤和已脱敏的诊断信息。提出修改前请阅读[贡献说明](CONTRIBUTING.zh.md)。

## 署名与许可

上游源码由 DeepSeek 开发，Fedora 适配由 [Li-Selena](https://github.com/Li-Selena)维护。保留原版权及 [MIT 许可证](LICENSE)。第三方组件继续适用各自条款，详见[第三方声明](THIRD_PARTY_NOTICES.md)和[品牌规范](BRAND_GUIDELINES.zh.md)。

最初导入来自本地源码归档，精确官方上游提交尚未核验。源码记录中的本地基线和适配提交编号不是官方上游发布编号；安装包发布前仍需完成二进制依赖与素材再分发核对。
