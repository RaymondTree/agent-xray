<p align="center">
  <img src="./src-tauri/icons/128x128@2x.png" width="128" height="128" alt="Agent X-Ray" />
</p>

<h1 align="center">Agent X-Ray · AI Agent 透视镜</h1>

<p align="center">
  一款 <strong>100% 离线运行</strong> 的交互式原理拆解应用（支持 <strong>Linux 桌面端 <code>.deb</code></strong> 与 <strong>纯静态网页版</strong>），直观揭示现代 AI Coding Agent（Claude Code、opencode 等）的底层工作机制——无需 API Key，不发起任何真实网络请求。
</p>

---

## 核心特性

- **12 个由浅入深的双语交互场景**
  1. **Agent 主循环**：`while` 循环如何驱动「问模型 → 调工具 → 喂回结果 → 直到 `stop_reason !== "tool_use"`」
  2. **API 请求长什么样**：无状态请求每次完整携带 `system`、`tools[]`、`messages[]`
  3. **SSE 流式输出**：`message_start`、`content_block_delta`、`input_json_delta`、`message_delta` 增量到达与拼接
  4. **工具调用机制**：工具 Schema 声明、JSON 参数生成、宿主执行与 `tool_result` 回传
  5. **上下文管理与提示词缓存**：1M Token 预算拆解、固定开销与缓存命中
  6. **对话分支与回滚**：点击对话树节点回溯，或从任意历史用户消息分叉（Fork）
  7. **MCP 协议（Model Context Protocol）**：`initialize`、`tools/list`、`tools/call` 标准 JSON-RPC 交互
  8. **Skills 技能系统**：斜杠命令与按需加载的程序性知识注入
  9. **子代理（Subagents）**：隔离上下文窗口执行子任务并只返回精炼摘要
  10. **钩子与权限审批（Hooks & Permissions）**：`PreToolUse` / `PostToolUse` 拦截及危险操作交互授权
  11. **记忆与压缩（Memory & Compaction）**：`CLAUDE.md` 持久记忆加载与上下文自动压缩
  12. **综合实战：完整追踪**：8 步端到端串联全部 11 项核心机制

- **右侧 5 标签 X-Ray 实时透视面板**
  - **请求 Req / 响应 Res**：支持各自独立切换 **「卡片视图 / 完整 JSON」**，支持 JSON 树折叠展开、当前步骤变更字段自动高亮定位，以及实时 **SSE 数据流管道与增量拼装缓冲区** 动画。
  - **上下文 Ctx**：Token 占用分布条与 `messages[]` 消息栈实时明细。
  - **流向 Flow**：User、Agent Harness、Tools/MCP 与 LLM API 之间的实时数据流向图。
  - **分支 Tree**：可点击切换的 SVG 对话有向树，点击任意节点即刻将中央对话区与上下文同步切换到该分支路径。

- **交互式沙盒与操控体验**
  - **请求参数沙盒**：实时修改 `model`、`temperature`、`tools[]` 启用数量、`stream` 流式开关与 `system` 提示词，即刻观察请求 JSON 与固定 Token 开销变化。
  - **单步演示与自动播放**：点击顶部任意步骤横条可直达该步（自动静默补全前序对话，仅播放当前步动画），悬停即可预览步骤要点。
  - **多语言与主题**：一键切换 **中英双语 / 纯中文 / English**（支持已展示对话实时无损重译），支持 **深色 / 浅色** 主题与首次 7 步聚光灯新手教学（第 1 步支持直接选择界面语言）。
  - **50%–200% 全局缩放与自适应抽屉**：支持 50% 至 200% 全界面缩放；高缩放或窄屏（等效宽度 `<= 1040px`）自动切换为平滑滑出抽屉布局；宽屏下收起两侧面板后中央控制台自动扩展填满空间。

---

## 安装桌面版（Debian / Ubuntu / 树莓派）

### 1. x86_64 电脑（`amd64`）

```bash
sudo apt install ./agent-xray_v0.1.17_amd64.deb
```

### 2. 树莓派等 ARM64 设备（`arm64`）

适用于搭载 64 位系统的 **Raspberry Pi 4 / 5（Raspberry Pi OS Trixie 64-bit / Debian 13 arm64 / Ubuntu 24.04+ arm64 等，`glibc >= 2.39`）**：

```bash
sudo apt install ./agent-xray_v0.1.17_arm64.deb
```

> 安装后可在系统应用菜单打开 **Agent X-Ray**，或在终端直接执行 `agent-xray`。  
> 若使用较旧的 Raspberry Pi OS Bookworm（Debian 12，`glibc 2.36`），建议在本机按下方步骤从源码编译打包，或直接使用纯静态网页版。

---

## 部署网页版（`agent-xray_v0.1.17_web.zip`）

网页版为**纯静态前端资源**（零后端、零外部 CDN 依赖），界面与交互功能与桌面端完全一致：

- **Cloudflare Pages**：登录 Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**，直接上传 `agent-xray_v0.1.17_web.zip` 即可部署上线。
- **GitHub Pages / Vercel / Netlify / Nginx**：将压缩包内容解压到站点根目录（含 `index.html`、`styles.css`、`app.js`、`xray.js`、`data.js`、`favicon.svg`），全部采用相对路径引用，根路径与子路径均可直接访问。
- **本地预览**：

```bash
unzip agent-xray_v0.1.17_web.zip -d web-dist
python3 -m http.server 8080 --directory web-dist
# 浏览器打开 http://127.0.0.1:8080
```

---

## 从源码构建

### 1. 准备系统依赖（Debian / Ubuntu）

需要 **Node.js（npm）**、**Rust（`cargo` / `rustup`）** 以及 Tauri 桌面运行时开发库：

```bash
sudo apt update
sudo apt install -y \
  build-essential curl wget file pkg-config \
  libwebkit2gtk-4.1-dev libgtk-3-dev libxdo-dev \
  libayatana-appindicator3-dev librsvg2-dev libssl-dev
```

### 2. 安装依赖与开发调试

```bash
npm ci

# 启动桌面端热调试窗口
npx tauri dev

# 构建本机架构 .deb 安装包
npx tauri build --bundles deb
```

### 3. 在 x86_64 主机交叉编译 ARM64 `.deb`（可选）

```bash
sudo dpkg --add-architecture arm64
sudo apt update
sudo apt install -y \
  gcc-aarch64-linux-gnu libc6-dev-arm64-cross \
  libwebkit2gtk-4.1-dev:arm64 libgtk-3-dev:arm64 \
  libayatana-appindicator3-dev:arm64 librsvg2-dev:arm64 \
  libssl-dev:arm64 libxdo-dev:arm64

rustup target add aarch64-unknown-linux-gnu

CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc \
CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc \
CXX_aarch64_unknown_linux_gnu=aarch64-linux-gnu-g++ \
AR_aarch64_unknown_linux_gnu=aarch64-linux-gnu-ar \
PKG_CONFIG_ALLOW_CROSS=1 \
PKG_CONFIG_LIBDIR=/usr/lib/aarch64-linux-gnu/pkgconfig:/usr/share/pkgconfig \
npx tauri build --target aarch64-unknown-linux-gnu --bundles deb
```

构建产物位于 `src-tauri/target/<arch>/release/bundle/deb/`。

---

## 目录结构

```text
agent-xray/
├── src/
│   ├── index.html          # 应用骨架、SVG 图标库、顶栏、控制台与 X-Ray 挂载点
│   ├── styles.css          # 深浅色主题变量、响应断点与抽屉样式
│   ├── data.js             # 请求基模板、12 个双语交互剧本与 SSE 帧数据
│   ├── xray.js             # 5 标签 X-Ray 渲染器、JSON 折叠高亮、SSE 动效与分支树
│   ├── app.js              # 状态机、沙盒参数、新手教学与桌面/网页缩放适配
│   └── favicon.svg         # 应用矢量图标
├── src-tauri/
│   ├── src/main.rs         # Tauri v2 入口与原生 WebView 缩放命令 set_zoom
│   ├── capabilities/       # Tauri v2 窗口权限配置
│   ├── icons/              # 多尺寸桌面图标
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── package.json
├── package-lock.json
├── CHANGELOG.md            # v0.1.1 至 v0.1.17 完整变更日志
├── TECHNICAL_DOCS.md       # 完整架构设计与模块技术文档
├── CHECKLIST.md            # v0.1.17 需求与验收清单
├── LICENSE
└── README.md
```

---

## 更多文档

- [版本变更日志 (CHANGELOG.md)](./CHANGELOG.md)
- [技术架构与实现文档 (TECHNICAL_DOCS.md)](./TECHNICAL_DOCS.md)
- [需求与验收清单 (CHECKLIST.md)](./CHECKLIST.md)

---

## 开源协议

[MIT License](./LICENSE)
