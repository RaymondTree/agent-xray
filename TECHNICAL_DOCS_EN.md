# Agent X-Ray Technical Documentation · 技术架构与实现文档

**Version / 版本**: `v0.1.17`  
**Target Runtimes / 运行形态**: Pure Static Web App (`src/`) & Tauri v2 Desktop App (`src-tauri/`, Linux `amd64` / `arm64` `.deb`)  
**Network Policy / 网络策略**: 100% offline deterministic simulation; zero external API calls, zero runtime CDNs, zero telemetry.

---

## 1. High-Level Architecture

Agent X-Ray is engineered as a dependency-free, vanilla ES2020 frontend application embedded inside a lightweight Tauri v2 WebKitGTK shell on Linux desktop and served directly as static assets on the web:

```text
+-------------------------------------------------------------------------+
|                           Topbar (#topbar)                              |
|  Brand + GitHub | Zoom (50-200%) | Guide Tour | Lang (bi/zh/en) | Theme |
+---------------+-----------------------------------+---------------------+
| Left Sidebar  |         Center Console            |   Right X-Ray Pane  |
| (#sidebar)    |          (#main)                  |    (#xrayPanel)     |
|               |                                   |                     |
| - #sideToggle | - Scenario Header + Step Jump     | - Tabs (#xrayTabs): |
| - Progress    |   (#stepbar + ResizeObserver)     |   Req/Res/Ctx/Flow/ |
| - 12 Scenario | - Chat Timeline (#chat)           |   Branch Tree       |
|   Items       |   - User bubbles (right-aligned)  | - #xrayToggleBtn    |
| - #sideTip    |   - Assistant/Thinking/Tool/Code/ | - #xrayBody:        |
|               |     HTTP/SSE/MCP/Memory/Perm/     |   - Cards / FullJSON|
| Collapse ->   |     Compact/Subagent/Error cards  |   - Live SSE Pipe   |
| 56px Rail     | - Composer + Sandbox Chip Row     |   - SVG Flow & Tree |
+---------------+-----------------------------------+---------------------+
          ^                                                   ^
          | Responsive Breakpoint <= 1040px (effective vw)    |
          +--------- Smooth Slide-Out Overlays (Drawer) ------+
```

### Runtime Detection & Host Integration
- **Web mode**: Executes purely from `index.html` + `styles.css` + `data.js` + `xray.js` + `app.js` using relative paths and `localStorage` persistence (`ax_lang`, `ax_theme`, `ax_zoom`, `ax_side_open`, `ax_xray_open`, `ax_done`, `ax_tour_seen`).
- **Desktop mode (`App._isTauri()`)**: Detects `window.__TAURI_INTERNALS__`. Global zoom invokes native WebView scaling (`invoke("set_zoom", { factor })`), falling back cleanly to `document.body.style.zoom` and CSS `--vw` / `--vh` variables in web browsers. External links (e.g. `#githubBtn`) invoke `open_external` with scheme validation (`http://` / `https://` only) in `src-tauri/src/main.rs`.

---

## 2. Source Code Inventory & Responsibilities

| File | Role | Key Symbols & Responsibilities |
| :--- | :--- | :--- |
| `src/index.html` | App Shell & Inline SVG Sprite | Defines semantic layout (`#topbar`, `#shell`, `#sidebar`, `#main`, `#xrayPanel`), inline `<svg>` icon `<symbol>` library (zero external icon fonts), and mount points (`#modalRoot`, `#popoverRoot`, `#tourRoot`, `#tooltip`, `#stepTip`, `#toast`). |
| `src/styles.css` | Design System & Layout Engine | CSS custom properties for dark (`:root`) and light (`html[data-theme="light"]`) themes; CSS Grid shell (`--side-w`, `--xray-w`) with animated panel transitions; `.is-item-card.is-scroll-hot` highlighting; `.xray-body.is-full-json` flex-column height fill; compact drawers (`@media` & `.bp-compact` / `.bp-h*`). |
| `src/data.js` | Protocol & Scenario Corpus | `REQ_BASE` baseline payload (`claude-sonnet-5-5`, `max_tokens: 8192`, 6 built-in tools); `SCENARIOS[0..11]` declarative bilingual teaching scripts (`steps[]`, `beats[]`, `freeText[]`, `defaultReply[]`, `treePaths{}`). |
| `src/xray.js` | X-Ray Inspector Engine (`XRay`) | `FIELD_DOCS` dictionary; `approxTokens()` estimator; `renderRequest()`, `renderResponse()`, `renderContext()`, `renderFlow()`, `renderTree()`; incremental SSE pipeline/buffer updater; bounded JSON tree renderer; scroll-zone tracker; SVG tree pan/zoom/maximize controller. |
| `src/app.js` | Console & Playback State Machine (`App`) | `I18N` & `TOUR_STEPS[0..6]`; `selectScenario()`, `playAll()`, `jumpToStep()` (`_jumpStep`), interactive `wait` & `perm` countdown controllers; `sendMessage()` with free-text Q&A matching and `1M` budget overflow simulation; Sandbox sheet; Guide popover & Spotlight tour; `ResizeObserver` stepbar & viewport scaling. |
| `src/favicon.svg` | Vector Brand Asset | Concentric radar/X-Ray reticle SVG icon. |
| `src-tauri/src/main.rs` | Native Desktop Bridge | Tauri v2 `tauri::Builder` registering `set_zoom(window, factor)` (clamped `0.5..=2.0`) and `open_external(url)` (`http`/`https` guard via `xdg-open`). |
| `src-tauri/tauri.conf.json` | Bundle Metadata | Product `"Agent X-Ray"`, version `"0.1.17"`, identifier `"com.agentxray.app"`, `frontendDist: "../src"`, deb target (`category: "DeveloperTool"`). |

---

## 3. Declarative Scenario DSL (`src/data.js`)

Each entry in `SCENARIOS` models an architectural mechanism through ordered `steps[]`, where every step contains an array of `beats[]`:

| Beat `t` | Purpose & Visual Representation | X-Ray / State Side Effect |
| :--- | :--- | :--- |
| `user` | Right-aligned user message bubble | Appended to `timeline` for live re-translation |
| `think` | Italicized internal model reasoning block | Rendered inside subtle bordered card |
| `say` | Left-aligned agent bubble with inline code/markdown formatting + `Fork here` trigger on hover | Supports `forkData` snapshot for branch creation |
| `tool` | Collapsible tool execution card (`Read`, `Edit`, `Bash`, `Grep`, `Glob`, `Write`, `Task`, `Skill`) | CSS `grid-template-rows` smooth expand/collapse |
| `http` | Simulated `POST /v1/messages` request status pill (`200 OK`, latency) | Precedes SSE playback |
| `sse` | Real-time frame-by-frame SSE emitter (`message_start` -> `content_block_*` -> `message_delta` -> `message_stop`) | Streams via `XRay.beginSSE()` & `XRay.pushSSEFrame()` |
| `mcp` | JSON-RPC request/response trace (`initialize`, `tools/list`, `tools/call`) | Bilingual title/payload rendering |
| `mem` | Disk memory snapshot card (`MEMORY.md` / `CLAUDE.md` diff lines) | Highlights persistent rule updates |
| `perm` | Interactive Permission / Hook Gate card (`Allow` / `Deny`, 10s SVG countdown ring) | Resolves asynchronously or auto-denies at `0s` |
| `compact` | Context compaction bar (`from -> to`, e.g., `920k -> 12k`, `890k -> 14k`) + summary block | Visualizes token reclamation under `1M` budget |
| `sub` | Isolated subagent execution summary (`summary` -> `^ Only concise summary returns`) | Contrasts child window vs parent context |
| `code` | Syntax-formatted fenced snippet with dual-paper copy button (`bi/zh/en` localized via `codeEn`) | 2s green checkmark copy feedback |
| `note` | Callout banner (`info` / `warn` / `key`) | Bilingual stacked paragraphs |
| `xr` | Declarative X-Ray patch (`tab`, `focus`, `request`, `context`, `flow`, `tree`) | Deep-copied & filtered through `_applySandbox()` |
| `wait` | Interactive pause beat (`kind: "xray" \| "sandbox"`) with circular countdown & skip action | Listens to `XRay.onInteract` / Sandbox open events |
| `done` | Final scenario summary card + key metric grid (`stats`) | Marks scenario complete in `localStorage` |

---

## 4. Playback Engine & Async Cancellation

To guarantee deterministic, race-free playback across rapid scenario switching, step jumping, pause/resume, and reset:
- **Generation Guard (`this._runId` / `gen`)**: Every async playback (`playAll`, `_jumpStep`, `sendMessage`, `forkFrom`) increments `_runId` and checks `this._runId === gen` after every `await _sleep()`, `_waitIfPaused()`, or SSE frame loop.
- **Step Jump (`_jumpStep(stepIdx)`)**: Reconstructs prior state up to `stepIdx - 1` synchronously into muted timeline items + X-Ray patches (`silent: true`, `silentTab: true`), renders a separator marker, and plays only `steps[stepIdx]` at normal speed.
- **Pause / Resume**: `_sleep(ms)` checks `_paused` and awaits `_resumeResolvers`. Clicking `#pauseBtn` freezes timers, SSE streaming, and wait prompts cleanly; resuming releases all queued resolvers.
- **User Prompt Interruption**: Pending interactive `wait` or `perm` beats register cancel callbacks (`_activeWaitCancel`, `_activeCountdownCancel`) cleared cleanly on reset, skip, or navigation.

---

## 5. X-Ray 5-Tab Inspector (`src/xray.js`)

### 5.1 Request & Response Views (`Cards` vs `Full JSON`)
- **Card Mode (`reqView === "cards"` / `resView === "cards"`)**:
  - Decomposes payloads into semantic sections (`Model & Params`, `system`, `tools`, `messages`, `Live SSE Pipeline`, `Assembled Buffer`, `Usage & Stop`, `Raw SSE Frames`).
  - **Item-Card Scroll Highlighting (`_syncCardScrollHot`)**: On scroll and `ResizeObserver` events inside `#xrayBody`, inspects all `.is-item-card` headers (`.th`, `.mh`, `.sse-preview-h`). The active window is the **second 1/6 vertical band** from the top of `#xrayBody`:
    `zoneTop = br.top + br.height / 6`, `zoneBottom = br.top + br.height / 3`, `zoneMid = br.top + br.height * 0.25`.
    Strictly one card receives `.is-scroll-hot` (prioritizing cards inside `[1/6, 1/3]` closest to `zoneMid = 25%`, or nearest overall if none fall inside). Bottom padding `max(64px, 48vh)` ensures trailing short cards can scroll into the active zone. Clicking any highlighted field opens `#xrayDoc` directly beneath that card, clamping smooth scroll adjustments (`maxDown`) to keep its header below `br.height / 6`.
- **Full JSON Mode (`reqView === "json"` / `resView === "json"`)**:
  - **Bounded Tree Folding (`_renderJSONVal`)**: `.jnode` / `.jfold` toggles are emitted **only at `depth <= 1`** (`root` and top-level containers such as `"tools"`, `"messages"`, `"content"`, `"usage"`, `"error"`). Expanding `"tools"` reveals all enabled tool definitions cleanly syntax-highlighted without recursive nested fold triangles inside `tools[i].input_schema.properties...`. Fold overrides persist in `_foldOverrides` (`Map<jpath, boolean>`).
  - **Dynamic Flex-Fill Layout (`.xray-body.is-full-json`)**: `#xrayBody` switches to a flex column (`padding-bottom: 12px`) when `.xr-json-card` is present. `.xr-json-card` (`flex: 1 1 0; min-height: 150px`) stretches to the bottom of the viewport when `#xrayDoc` is closed, and `.json` (`flex: 1 1 0; min-height: 0; overflow: auto`) shrinks dynamically whenever `#xrayDoc` pops in at the bottom—preventing `.xr-mode-bar` from scrolling off-screen.
- **Incremental SSE Streaming (`_updateResponseIncremental`)**: Appends incoming `.sse-row` frames and updates buffer blocks (`#xrSseBufferBody`) and token counts without tearing down DOM scroll state.

### 5.2 Models, Context Budget & Sandbox Simulation
- **Supported Models**: `claude-fable-5-2`, `claude-opus-5-5`, `claude-sonnet-5-5` (default), `claude-haiku-5-5`.
- **Context Window (`1M` Standard)**: Default `contextBudget` is `1,000,000` (`1M`). `XRay.fixedOverhead()` computes `approxTokens(req.system) + approxTokens(req.tools.slice(0, sandbox.toolsEnabled))`.
- **Overflow Error Simulation**: Reducing `#sbBudget` in Sandbox (`4000`, `1000`, or `250`) triggers `HTTP 400 invalid_request_error` in both playback and free-text chat whenever `fixedOverhead() + used > budget`, displaying an error card and switching Response view via `XRay.setErrorResponse()`.

### 5.3 SVG Flow & Directed Branch Tree
- **Flow Tab**: Static calibrated SVG graph (`client <-> agent <-> api / tools / mcp`) with active node/edge highlighting and animated directional signal indicator.
- **Branch Tree Tab**: Dynamically computes layout columns/rows from `{ id, label, sub, x, y, parent }`. Supports wheel zoom around cursor (`0.35x–3.0x`), drag-to-pan (with zoom compensation `dx / bz`), auto-fit (`_fitTreeToCanvas`), modal maximize/restore with placeholder geometry interpolation (`_toggleTreeMaximize`), and bidirectional branch switching via `onBranchSelect`.

---

## 6. Internationalization, Accessibility & Responsive Design

- **3-Mode Localization (`bi` / `zh` / `en`)**:
  - `bi` (`中英`): Inline controls use `<span class="bi-inline">` (`zh / en`); long descriptions and cards stack `.bi-zh` and `.bi-en`.
  - `zh` / `en`: Single-language rendering with zero cross-language leakage (including tooltips, hover `title` attributes, code examples via `codeEn`, tool outputs via `outputEn`, SSE JSON deltas via `dtEn`, and Sandbox labels).
  - Non-destructive `timeline[]` array stores structured render descriptors (`user`, `think`, `say`, `tool`, `http`, `mcp`, `mem`, `perm`, `compact`, `sub`, `code`, `note`, `done`, `err`) so switching languages re-renders already-played turns cleanly.
- **Collapsed Left Sidebar Tooltip**: Hovering `.scn-item` when `!App.sideOpen` renders `.tt-head` (scenario number pill `.tt-num` + localized title `.tt-titles`) above a dashed separator and scenario hint.
- **Adaptive Scaling & Breakpoints**:
  - Global zoom (`0.5`–`2.0`) synchronizes effective CSS variables (`--vw`, `--vh`) and responsive height/width classes (`bp-compact` at `<= 1040px`, `bp-h800`, `bp-h700`, `bp-h620`).
  - On narrow/zoomed viewports (`<= 1040px`), `#sidebar` and `#xrayPanel` convert into smooth fixed overlay drawers (`transform: translateX(...)`), mutually exclusive on open.
  - `#stepbar` switches dynamically between default pills, `.compact`, `.balls`, and `.stacked` modes via `ResizeObserver`.

---

## 7. Build, Verification & Packaging Reference

### Automated Headless Verification
- **Syntax Validation**: `node --check src/data.js && node --check src/xray.js && node --check src/app.js`.
- **DOM & Visual Verification**: Headless Chromium via Chrome DevTools Protocol verifies single-line desktop welcome layout, `[1/6, 1/3]` single-card scroll-hot selection, `depth <= 1` JSON folding inside `tools`, `.is-full-json` bottom-fill & `#xrayDoc` spacing, collapsed sidebar `.tt-head` tooltips in `bi`/`zh`/`en`, 4-model Sandbox switching, and `1M` budget accounting.

### Desktop `.deb` Build & Cross-Compilation
- Native `amd64` and cross-compiled `aarch64-unknown-linux-gnu` (`arm64`) `.deb` bundles build via `npx tauri build --bundles deb` using `src-tauri/tauri.conf.json` (`version: "0.1.17"`).
- Resulting binaries install `/usr/bin/agent-xray`, desktop entry `/usr/share/applications/Agent X-Ray.desktop`, and hicolor icons (`32x32`, `128x128`, `256x256@2`, `512x512`).

### Static Web Distribution
- `agent-xray_v0.1.17_web.zip` packages `src/*` plus Cloudflare Pages `_headers` (`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`) with zero external asset dependencies.
