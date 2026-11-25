# Agent X-Ray · AI Agent 透视镜

A **100% offline** interactive desktop application built with **Tauri v2** and vanilla HTML/CSS/JavaScript that visualizes how modern AI coding agents (such as Claude Code and opencode) operate under the hood—no API keys, network calls, or external runtimes required.

---

## Key Features

- **12 Progressive Bilingual Scenarios**
  1. **The Agent Loop** (`while` loop until `stop_reason !== "tool_use"`)
  2. **API Request Anatomy** (`system`, `tools[]`, `messages[]` sent statelessly each turn)
  3. **SSE Streaming** (`message_start`, `content_block_delta`, `input_json_delta`, `message_delta`)
  4. **Tool Calling & Dispatch** (schema declaration, JSON args, host execution, `tool_result` feedback)
  5. **Context Window & Prompt Caching** (token budget breakdown & cache hits)
  6. **Conversation Branching & Rollback** (clickable tree nodes & user-message forking)
  7. **MCP (Model Context Protocol)** (`initialize`, `tools/list`, `tools/call` JSON-RPC)
  8. **Skills & Slash Commands** (on-demand procedural knowledge injection)
  9. **Subagents** (isolated context windows & summarized return)
  10. **Hooks & Permission Gates** (`PreToolUse`, `PostToolUse`, interactive approval/denial)
  11. **Persistent Memory** (`CLAUDE.md` / session recall)
  12. **Capstone End-to-End Walkthrough** (8-step combined scenario)

- **5-Tab Live X-Ray Inspector**
  - **Req (`请求 Req`)** & **Res (`响应 Res`)**: independent `[Cards | Full JSON]` views, collapsible JSON trees, automatic highlight & scroll-to-focus on fields modified in the current step, plus live SSE pipe & frame buffer animation.
  - **Ctx (`上下文 Ctx`)**: token breakdown bar and message stack inspector.
  - **Flow (`流向 Flow`)**: real-time dataflow diagram between User, Agent Harness, Tools/MCP, and LLM API.
  - **Tree (`分支 Tree`)**: clickable conversation DAG supporting branching from any user turn.

- **Interactive Parameter Sandbox & Controls**
  - Edit `model`, `temperature`, active `tools[]` count, `stream` mode, and `system` prompt live and watch request JSON + fixed token overhead update immediately.
  - Jump directly to any step (auto-prefilling prior steps cleanly) or type prompts in the console composer.
  - Switch seamlessly between **Bilingual (`中英`)**, **Chinese (`中文`)**, and **English (`EN`)**, and **Dark / Light** themes.
  - **Native WebView Zoom (`50%` – `200%`)**: powered by Tauri's `WebviewWindow::set_zoom`, paired with responsive slide-over drawers at compact viewports (`<= 1040px` effective CSS width).

---

## Install (Debian / Ubuntu `amd64`)

Download `agent-xray_0.1.1_amd64.deb` and install with `apt` or `dpkg`:

```bash
sudo apt install ./agent-xray_0.1.1_amd64.deb
```

Launch from your application menu (**Agent X-Ray**) or run:

```bash
agent-xray
```

---

## Build from Source

### 1. System Prerequisites (Debian / Ubuntu)

```bash
sudo apt update
sudo apt install -y \
  build-essential curl wget file pkg-config \
  libwebkit2gtk-4.1-dev libgtk-3-dev libxdo-dev \
  libayatana-appindicator3-dev librsvg2-dev libssl-dev
```

You also need **Node.js (npm)** and **Rust (`cargo` / `rustup`)**.

### 2. Install JS Dependencies & Build

```bash
npm ci

# Run in development mode
npx tauri dev

# Build the Debian installer (.deb)
npx tauri build --bundles deb
```

The built `.deb` package is generated under `src-tauri/target/release/bundle/deb/`.

---

## Project Structure

```text
agent-xray/
├── src/
│   ├── index.html          # App shell, SVG sprites, topbar, sidebar, console, X-Ray mount
│   ├── styles.css          # Dark/light themes, responsive breakpoints & compact drawers
│   ├── data.js             # Request template + 12 bilingual scenarios & SSE frames
│   ├── xray.js             # 5-tab X-Ray inspector, JSON tree/focus, SSE visualizer, SVG tree
│   └── app.js              # Scenario engine, sandbox, guided tour, zoom & viewport controller
├── src-tauri/
│   ├── src/main.rs         # Tauri v2 entry point + `set_zoom` command
│   ├── capabilities/       # Tauri v2 window capability permissions
│   ├── icons/              # Desktop application icons
│   ├── Cargo.toml
│   ├── build.rs
│   └── tauri.conf.json
├── package.json
├── LICENSE
└── README.md
```

---

## License

[MIT](./LICENSE)
