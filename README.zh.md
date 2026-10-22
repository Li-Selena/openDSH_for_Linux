# openDSH for Linux

[English](README.md) | 中文

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) `0.2.1-rc.2` 的社区 Fedora 桌面适配。项目独立维护，不是 DeepSeek 官方发行版。

## 当前状态

当前仓库提供源码，尚未提供可直接下载的社区安装包。下方主流程是在本机编译并运行未签名的目录版；仅克隆仓库并不等于安装了桌面应用。

目标环境是 Fedora 44、x86_64、KDE Wayland。历史本地检查覆盖 GUI/Host 启动、文件与 Shell、会话恢复、插件、模拟 API Key 持久化和 Office 样例。全新机器完整安装、真实 DeepSeek 推理、完整官方功能对齐、RPM 系统安装生命周期及 AppImage 原始 FUSE/AppRun 启动尚未完成验收。

## 所需环境

以下要求依据源码清单和已有 Fedora 构建记录整理。下方系统包命令用于 Fedora 环境准备，不代表已经在最小化全新系统上完成验收。

| 项目 | 要求 |
| --- | --- |
| 系统 / CPU | Fedora 44、x86_64；打包入口要求在 Linux x64 上运行 |
| 桌面 | 首期验证目标为 KDE Plasma / Wayland；运行应用需要图形会话 |
| Node.js | 推荐 [Node.js 24 LTS](https://nodejs.org/en/download)，包含 npm 与开发头文件；源码声明支持 `^22.19.0 || >=24.0.0` |
| 包管理器 | 使用 [Corepack](https://github.com/nodejs/corepack)选择仓库锁定的 pnpm `11.28.5`，不要直接换成 `pnpm@latest` |
| 构建工具 | Git 2.26+、GCC/G++、Make、Python 3、pkg-config、tar、xz、unzip |
| 图形库 | GTK 3、NSS、ALSA、GBM/DRM 和 X11 兼容库；Wayland 下也会用到部分兼容库 |
| 网络 | 能访问 npm、GitHub、Electron、Node.js 及 Python/运行时下载源；首次构建需要下载较多资源 |
| 磁盘 / 内存 | 为依赖、缓存及中间产物预留数十 GB；此前完整应用约 1.1 GB。尚未测定最低内存要求 |
| API Key | 构建不需要 Key；启动后调用模型需要自行配置有效的 DeepSeek API Key |

在 Fedora 终端按需安装构建工具和常用图形库。`sudo` 仅用于系统包安装；后续依赖安装、构建和应用运行均使用普通用户。

```bash
sudo dnf install git gcc gcc-c++ make python3 pkgconf-pkg-config tar xz unzip
sudo dnf install gtk3 nss alsa-lib libXScrnSaver mesa-libgbm libdrm
```

按 [Node.js 官方说明](https://nodejs.org/en/download)安装完整的 Node.js 24，然后确认 `node --version`、`npm --version`、`corepack --version` 可用。官方 Node.js 24 发行包包含 Corepack；若系统发行包未附带，按 [Corepack 安装说明](https://github.com/nodejs/corepack#how-to-install)补齐。原生构建还需要所选 Node 安装中的 `include/node/node_api.h`。

<a id="run"></a>

<a id="run-from-source"></a>

## 从源码构建并运行

以下命令使用 Bash。目录版构建入口已用于现有 Fedora 适配，但下方完整的全新机器流程尚未重新验收，不需要原作者的私人配置或开发目录。

### 1. 获取仓库

```bash
git clone https://github.com/Li-Selena/openDSH_for_Linux.git
cd openDSH_for_Linux
```

请使用 Git 克隆而非下载 ZIP：打包流程会读取 Git HEAD。后续步骤均从仓库根目录执行。

### 2. 创建独立本地环境

首次创建被 Git 忽略的 `.local/fedora-env.sh`，将应用数据和常用工具缓存放在当前项目内，并在本地创建 pnpm 命令入口，不修改 Shell 启动文件或全局命令关联。

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

pnpm 应显示由 `package.json` 指定的 `11.28.5`，Corepack 首次使用可能需要下载该版本。以后每次打开新终端，先进入仓库并执行 `source .local/fedora-env.sh`，再继续操作。不要将这个本地文件提交到仓库。

### 3. 安装依赖并构建

```bash
pnpm install --frozen-lockfile --store-dir "$DSH_DESKTOP_RUNTIME_STORE_DIR"
pnpm --dir apps/desktop run package:linux --format dir
```

源码依赖安装不要额外添加 `--ignore-scripts`：仓库已明确允许必要的原生构建脚本。打包命令会编译客户端、准备生产依赖、下载内置运行时并执行载荷检查，不会安装 RPM 或启动应用。

目录版成功后的输出位置为 `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked/`，主程序是 `deepseek-harness`。必须保留整个目录及其中的 `resources/`，不能只复制一个可执行文件。

### 4. 启动目录版

```bash
source .local/fedora-env.sh
dsh_app_dir="$DSH_LINUX_ROOT/apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/linux-unpacked"
"$dsh_app_dir/deepseek-harness" --user-data-dir="$DSH_DESKTOP_USER_DATA_DIR"
```

请在普通用户的图形桌面会话中启动。此方式直接运行构建目录，无需先安装系统 RPM；它不会执行维护者个人部署中另行进行的 KDE 菜单和任务栏集成。

打包后的应用自带 Node/pnpm/Python 运行时。需要核对内置 CLI 时，在另一个终端加载相同环境、按上方设置 `dsh_app_dir` 后执行：

```bash
"$dsh_app_dir/resources/runtime/cli/bin/dsh" --version
```

### 5. 首次配置

1. 在欢迎页选择 **Add API Key / 添加 API Key**，也可稍后从账号或模型设置进入。
2. 输入并保存自己的 DeepSeek API Key，再选择工作区和模型。
3. 用一个简单请求检查 Key、网络和账号状态；模拟服务的持久化测试不代表真实服务已验证。
4. 如有需要，通过应用内插件管理器安装社区插件；本仓库没有捆绑鲸鱼、dsh-web 或个人图片。

以上环境将凭据、会话和设置保存在 `.local/run/`。更新前请私密备份，不要上传、作为 Issue 附件发送，或当作普通缓存删除。

## 可选的 AppImage 与 RPM 产物

目录版构建成功后，同一源码入口还接受以下命令。`--skip-build` 复用已有的完整客户端构建，打包与运行时校验仍会执行。

```bash
pnpm --dir apps/desktop run package:linux --format AppImage --skip-build
```

RPM 另外需要 Fedora 的 [rpm-build](https://packages.fedoraproject.org/pkgs/rpm/rpm-build/)；若系统缺少 `libcrypt.so.1`，内置 FPM 还需要 [libxcrypt-compat](https://packages.fedoraproject.org/pkgs/libxcrypt/libxcrypt-compat/)：

```bash
sudo dnf install rpm-build libxcrypt-compat
pnpm --dir apps/desktop run package:linux --format rpm --skip-build
```

产物写入 `apps/desktop/.desktop-build/targets/linux-x64/unsigned-artifacts/`，文件名保留 `unsigned`。生成这些文件不等于安装了它们。RPM 系统安装/升级/卸载和 AppImage 原始启动仍需独立验收；本次预览优先使用上方目录版流程。

## 更新、移除与常见问题

- **更新：** 先退出应用，私密备份 `.local/run/`，执行 `git pull --ff-only`，再重复加载环境、安装依赖和目录打包。当前未配置官方自动更新源。
- **移除：** 退出后可移除目录版产物或不再需要的源码目录；如需保留凭据和会话，请保留 `.local/run/`。本目录版流程没有安装系统 RPM。
- **运行库缺失：** 用 `ldd "$dsh_app_dir/deepseek-harness"` 查看缺失库，再安装提供它的 Fedora 包；中文 Office 预览还需要可用的 CJK 字体。
- **构建失败：** 查看 `apps/desktop/.desktop-build/packaging-runs/`，核对 Node 头文件、pnpm 版本、下载网络及首个失败阶段。分享日志前先脱敏。
- **内存不足：** 构建前设置 `export DSH_GATE_CONCURRENCY=2`，降低并行步骤数。
- **Corepack 或签名错误：** 按官方说明更新 Corepack，保留完整性校验。
- **SOCKS 代理提示：** DSH 的 HTTP 代理配置需要 HTTP/HTTPS 代理地址，详见[网络指南](docs/user/guide/network-proxy.zh.md)。
- **Node 加载错误：** 不要在 `NODE_OPTIONS` 中用 `--no-experimental-strip-types` 关闭原生 TypeScript 类型剥离。
- **沙箱或 SELinux 错误：** 保留错误并定位具体权限问题；关闭 Electron 沙箱或 SELinux 不属于本安装流程。

## 源码、贡献与许可

仓库保留内置插件源码、测试及受版本管理的测试快照，排除个人配置、已安装依赖、缓存、安装包和额外安装的社区插件。详见 [Linux 打包参考](apps/desktop/packaging/linux/README.zh.md)、[开发指南](docs/development.zh.md)、[适配差异](community/fedora-changes.patch)和[源码记录](community/source-snapshot.json)。

上游 GitHub Actions 与 Dependabot 配置以 `.disabled` 后缀保留，不提供社区 CI 或发布功能。请在[本仓库](https://github.com/Li-Selena/openDSH_for_Linux/issues)报告问题，提出修改前阅读[贡献说明](CONTRIBUTING.zh.md)。

上游源码由 DeepSeek 开发，Fedora 适配由 [Li-Selena](https://github.com/Li-Selena)维护。保留原版权及 [MIT 许可证](LICENSE)，第三方组件适用各自条款。详见[第三方声明](THIRD_PARTY_NOTICES.md)和[品牌规范](BRAND_GUIDELINES.zh.md)。

最初导入来自本地归档，精确官方上游提交尚未核验；源码记录中的本地编号不是官方发布编号。安装包发布前仍需完成二进制依赖和素材再分发核对。
