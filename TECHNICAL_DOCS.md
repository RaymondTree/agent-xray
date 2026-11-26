# Agent X-Ray 技术架构与实现文档

**版本**: `v0.1.17`  
**运行形态**: 纯静态 Web 应用（`src/`）与 Tauri v2 桌面应用（`src-tauri/`，Linux `amd64` / `arm64` `.deb`）  
**网络策略**: 100% 离线确定性模拟；零外部 API 调用、零运行时 CDN、零遥测。

---

## 1. 高层架构

Agent X-Ray 是一个零依赖的原生 ES2020 前端应用，在 Linux 桌面端嵌入轻量 Tauri v2 WebKitGTK 壳运行，在 Web 端则以静态资源形式直接提供服务：

```text
+-------------------------------------------------------------------------+
|                           Topbar (#topbar)                              |
|  品牌 + GitHub | 缩放 (50-200%) | 导览 | 语言 (bi/zh/en) | 主题          |
+---------------+-----------------------------------+---------------------+
| 左侧栏         |          中央控制台                |  右侧 X-Ray 面板    |
| (#sidebar)    |           (#main)                 |    (#xrayPanel)     |
|               |                                   |                     |
| - #sideToggle | - 场景头部 + 步骤跳转              | - 标签页 (#xrayTabs):|
| - 进度条       |   (#stepbar + ResizeObserver)     |   请求/响应/上下文/  |
| - 12 个场景项  | - 对话时间线 (#chat)              |   流程/分支树        |
| - #sideTip    |   - 用户气泡 (右对齐)              | - #xrayToggleBtn    |
|               |   - 助手/思考/工具/代码/           | - #xrayBody:        |
| 收起 ->        |     HTTP/SSE/MCP/记忆/权限/        |   - 卡片 / 完整JSON |
| 56px 图标轨   |     紧凑卡/子代理/错误卡片         |   - 实时 SSE 管道   |
|               | - 输入框 + 沙盒 Chip 行            |   - SVG 流程与分支树|
+---------------+-----------------------------------+---------------------+
          ^                                                   ^
          | 响应式断点 <= 1040px (有效视口宽度)                |
          +--------- 平滑滑出弹层 (抽屉) ----------------------+
```

### 运行时检测与宿主集成
- **Web 模式**：纯粹基于 `index.html` + `styles.css` + `data.js` + `xray.js` + `app.js` 运行，使用相对路径与 `localStorage` 持久化（`ax_lang`、`ax_theme`、`ax_zoom`、`ax_side_open`、`ax_xray_open`、`ax_done`、`ax_tour_seen`）。
- **桌面模式（`App._isTauri()`）**：检测 `window.__TAURI_INTERNALS__`。全局缩放调用原生 WebView 缩放（`invoke("set_zoom", { factor })`），在 Web 浏览器中优雅回退到 `document.body.style.zoom` 与 CSS `--vw` / `--vh` 变量。外部链接（如 `#githubBtn`）在 `src-tauri/src/main.rs` 中调用 `open_external`，并做协议校验（仅 `http://` / `https://`）。

---

## 2. 源码清单与职责

| 文件 | 角色 | 关键符号与职责 |
| :--- | :--- | :--- |
| `src/index.html` | 应用外壳与内联 SVG 精灵库 | 语义化布局（`#topbar`、`#shell`、`#sidebar`、`#main`、`#xrayPanel`）、内联 `<svg>` 图标 `<symbol>` 库（零外部图标字体），以及挂载点（`#modalRoot`、`#popoverRoot`、`#tourRoot`、`#tooltip`、`#stepTip`、`#toast`）。 |
| `src/styles.css` | 设计系统与布局引擎 | 暗色（`:root`）与亮色（`html[data-theme="light"]`）主题的 CSS 自定义属性；CSS Grid 外壳（`--side-w`、`--xray-w`）与动画面板过渡；`.is-item-card.is-scroll-hot` 高亮；`.xray-body.is-full-json` flex 纵向撑满；紧凑抽屉（`@media` 与 `.bp-compact` / `.bp-h*`）。 |
| `src/data.js` | 协议与场景语料库 | `REQ_BASE` 基准载荷（`claude-sonnet-5-5`、`max_tokens: 8192`、6 个内置工具）；`SCENARIOS[0..11]` 声明式双语教学脚本（`steps[]`、`beats[]`、`freeText[]`、`defaultReply[]`、`treePaths{}`）。 |
| `src/xray.js` | X-Ray 透视引擎（`XRay`） | `FIELD_DOCS` 词典；`approxTokens()` 估算器；`renderRequest()`、`renderResponse()`、`renderContext()`、`renderFlow()`、`renderTree()`；增量 SSE 管道/缓冲区更新器；有界 JSON 树渲染器；滚动热区追踪器；SVG 分支树平移/缩放/最大化控制器。 |
| `src/app.js` | 控制台与播放状态机（`App`） | `I18N` 与 `TOUR_STEPS[0..6]`；`selectScenario()`、`playAll()`、`jumpToStep()`（`_jumpStep`）；可交互 `wait` 与 `perm` 倒计时控制器；`sendMessage()` 自由文本问答匹配与 `1M` 预算溢出模拟；沙盒弹层；导览浮层与聚光灯导览；`ResizeObserver` 步骤条与视口缩放。 |
| `src/favicon.svg` | 矢量品牌资产 | 同心雷达/X-Ray 准星 SVG 图标。 |
| `src-tauri/src/main.rs` | 原生桌面桥接 | Tauri v2 `tauri::Builder`，注册 `set_zoom(window, factor)`（钳制在 `0.5..=2.0`）与 `open_external(url)`（通过 `xdg-open` 做 `http`/`https` 防护）。 |
| `src-tauri/tauri.conf.json` | 打包元数据 | 产品名 `"Agent X-Ray"`、版本 `"0.1.17"`、标识符 `"com.agentxray.app"`、`frontendDist: "../src"`、deb 目标（`category: "DeveloperTool"`）。 |

---

## 3. 声明式场景 DSL（`src/data.js`）

`SCENARIOS` 中每条记录通过有序的 `steps[]` 建模一种架构机制，每个 step 包含一个 `beats[]` 数组：

| 节拍 `t` | 用途与视觉呈现 | X-Ray / 状态副作用 |
| :--- | :--- | :--- |
| `user` | 右对齐的用户消息气泡 | 追加到 `timeline` 以支持实时重译 |
| `think` | 斜体内部模型推理块 | 渲染在带浅色边框的卡片内 |
| `say` | 左对齐的 agent 气泡，内联代码/Markdown 排版 + 悬停 `Fork here` 触发 | 支持 `forkData` 快照用于创建分支 |
| `tool` | 可折叠的工具执行卡片（`Read`、`Edit`、`Bash`、`Grep`、`Glob`、`Write`、`Task`、`Skill`） | CSS `grid-template-rows` 平滑展开/收起 |
| `http` | 模拟 `POST /v1/messages` 请求状态胶囊（`200 OK`、时延） | 位于 SSE 播放之前 |
| `sse` | 逐帧实时 SSE 发射器（`message_start` -> `content_block_*` -> `message_delta` -> `message_stop`） | 通过 `XRay.beginSSE()` 与 `XRay.pushSSEFrame()` 流式输出 |
| `mcp` | JSON-RPC 请求/响应追踪（`initialize`、`tools/list`、`tools/call`） | 双语标题/载荷渲染 |
| `mem` | 磁盘记忆快照卡片（`MEMORY.md` / `CLAUDE.md` diff 行） | 高亮持久化规则更新 |
| `perm` | 可交互权限/Hook 关卡卡片（`Allow` / `Deny`，10 秒 SVG 倒计时环） | 异步解决或在 `0s` 时自动拒绝 |
| `compact` | 上下文压缩条（`from -> to`，例如 `920k -> 12k`、`890k -> 14k`）+ 摘要块 | 可视化 `1M` 预算下的令牌回收 |
| `sub` | 隔离的子代理执行摘要（`summary` -> `^ 仅简洁摘要返回`） | 对比子窗口与父上下文 |
| `code` | 语法高亮围栏代码片段，双栏复制按钮（`bi/zh/en` 通过 `codeEn` 本地化） | 2 秒绿色对勾复制反馈 |
| `note` | 提示横幅（`info` / `warn` / `key`） | 双语堆叠段落 |
| `xr` | 声明式 X-Ray 补丁（`tab`、`focus`、`request`、`context`、`flow`、`tree`） | 深拷贝并经由 `_applySandbox()` 过滤 |
| `wait` | 可交互暂停节拍（`kind: "xray" \| "sandbox"`），带圆形倒计时与跳过操作 | 监听 `XRay.onInteract` / 沙盒打开事件 |
| `done` | 场景收尾摘要卡片 + 关键指标网格（`stats`） | 在 `localStorage` 中标记场景完成 |

---

## 4. 播放引擎与异步取消

为保证在快速切换场景、步骤跳转、暂停/恢复与重置时播放的确定性与无竞态：
- **代际守卫（`this._runId` / `gen`）**：每次异步播放（`playAll`、`_jumpStep`、`sendMessage`、`forkFrom`）都会递增 `_runId`，并在每次 `await _sleep()`、`_waitIfPaused()` 或 SSE 帧循环之后检查 `this._runId === gen`。
- **步骤跳转（`_jumpStep(stepIdx)`）**：将 `stepIdx - 1` 之前的历史状态同步重建为静音时间线条目 + X-Ray 补丁（`silent: true`、`silentTab: true`），渲染分隔标记，随后仅以正常速度播放 `steps[stepIdx]`。
- **暂停 / 恢复**：`_sleep(ms)` 检查 `_paused` 并等待 `_resumeResolvers`。点击 `#pauseBtn` 可干净冻结计时器、SSE 流与等待提示；恢复时释放所有排队的 resolver。
- **用户输入打断**：待处理的交互式 `wait` 或 `perm` 节拍注册取消回调（`_activeWaitCancel`、`_activeCountdownCancel`），在重置、跳过或导航时干净清理。

---

## 5. X-Ray 五标签透视镜（`src/xray.js`）

### 5.1 请求与响应视图（`卡片` 与 `完整 JSON`）
- **卡片模式（`reqView === "cards"` / `resView === "cards"`）**：
  - 将载荷拆解为语义区块（`Model & Params`、`system`、`tools`、`messages`、`Live SSE Pipeline`、`Assembled Buffer`、`Usage & Stop`、`Raw SSE Frames`）。
  - **条目卡片滚动高亮（`_syncCardScrollHot`）**：在 `#xrayBody` 内滚动与 `ResizeObserver` 事件触发时，检查所有 `.is-item-card` 头部（`.th`、`.mh`、`.sse-preview-h`）。活动窗口为 `#xrayBody` 自上而下**第 2 个 1/6 垂直带**：
    `zoneTop = br.top + br.height / 6`，`zoneBottom = br.top + br.height / 3`，`zoneMid = br.top + br.height * 0.25`。
    严格只有一张卡片获得 `.is-scroll-hot`（优先选中位于 `[1/6, 1/3]` 且最接近 `zoneMid = 25%` 的卡片；若无则取整体最近的）。底部留白 `max(64px, 48vh)` 保证尾部短卡片也能滚入活动区。点击任一被高亮字段时，`#xrayDoc` 直接在该卡片下方展开，并对平滑滚动调整（`maxDown`）做钳制，使该卡片头部保持在 `br.height / 6` 之下。
- **完整 JSON 模式（`reqView === "json"` / `resView === "json"`）**：
  - **有界树折叠（`_renderJSONVal`）**：`.jnode` / `.jfold` 开关**仅在 `depth <= 1` 时输出**（`root` 与 `"tools"`、`"messages"`、`"content"`、`"usage"`、`"error"` 等顶层容器）。展开 `"tools"` 时完整呈现所有启用工具定义并保持语法高亮，而不会在 `tools[i].input_schema.properties...` 内产生递归嵌套的折叠三角。折叠覆盖状态持久保存在 `_foldOverrides`（`Map<jpath, boolean>`）。
  - **动态 flex 撑满布局（`.xray-body.is-full-json`）**：存在 `.xr-json-card` 时 `#xrayBody` 切换为 flex 纵向（`padding-bottom: 12px`）。`.xr-json-card`（`flex: 1 1 0; min-height: 150px`）在 `#xrayDoc` 关闭时延伸至视口底部；`.json`（`flex: 1 1 0; min-height: 0; overflow: auto`）在 `#xrayDoc` 从底部弹出时动态收缩——避免 `.xr-mode-bar` 被滚出屏幕。
- **增量 SSE 流式（`_updateResponseIncremental`）**：追加传入的 `.sse-row` 帧并更新缓冲区区块（`#xrSseBufferBody`）与令牌计数，全程不破坏 DOM 滚动状态。

### 5.2 模型、上下文预算与沙盒模拟
- **支持模型**：`claude-fable-5-2`、`claude-opus-5-5`、`claude-sonnet-5-5`（默认）、`claude-haiku-5-5`。
- **上下文窗口（`1M` 标准）**：默认 `contextBudget` 为 `1,000,000`（`1M`）。`XRay.fixedOverhead()` 计算 `approxTokens(req.system) + approxTokens(req.tools.slice(0, sandbox.toolsEnabled))`。
- **溢出错误模拟**：在沙盒中调低 `#sbBudget`（`4000`、`1000` 或 `250`）后，只要 `fixedOverhead() + used > budget`，播放与自由文本对话均触发 `HTTP 400 invalid_request_error`，显示错误卡片，并通过 `XRay.setErrorResponse()` 切换响应视图。

### 5.3 SVG 流程图与有向分支树
- **流程标签页**：静态校准的 SVG 图（`client <-> agent <-> api / tools / mcp`），带活动节点/边高亮与动画方向信号指示。
- **分支树标签页**：根据 `{ id, label, sub, x, y, parent }` 动态计算布局行列。支持以光标为中心的滚轮缩放（`0.35x–3.0x`）、拖拽平移（含缩放补偿 `dx / bz`）、自动适配（`_fitTreeToCanvas`）、弹框最大化/还原（几何插值占位，`_toggleTreeMaximize`），以及通过 `onBranchSelect` 双向切换分支。

---

## 6. 国际化、无障碍与响应式设计

- **三模式本地化（`bi` / `zh` / `en`）**：
  - `bi`（`中英`）：内联控件使用 `<span class="bi-inline">`（`zh / en`）；长描述与卡片纵向堆叠 `.bi-zh` 与 `.bi-en`。
  - `zh` / `en`：单语言渲染，零跨语言泄漏（含提示语、悬停 `title` 属性、经 `codeEn` 输出的代码示例、经 `outputEn` 输出的工具结果、经 `dtEn` 输出的 SSE JSON 增量以及沙盒标签）。
  - 无损的 `timeline[]` 数组保存结构化渲染描述符（`user`、`think`、`say`、`tool`、`http`、`mcp`、`mem`、`perm`、`compact`、`sub`、`code`、`note`、`done`、`err`），切换语言时可干净重渲染已播放回合。
- **收起态左侧栏悬停提示**：`!App.sideOpen` 时悬停 `.scn-item`，在虚线分隔线与场景提示上方渲染 `.tt-head`（场景编号胶囊 `.tt-num` + 本地化标题 `.tt-titles`）。
- **自适应缩放与断点**：
  - 全局缩放（`0.5`–`2.0`）同步有效 CSS 变量（`--vw`、`--vh`）与响应式高度/宽度类（`<= 1040px` 时 `.bp-compact`，以及 `.bp-h800`、`.bp-h700`、`.bp-h620`）。
  - 窄屏/放大视口（`<= 1040px`）下，`#sidebar` 与 `#xrayPanel` 转换为平滑固定弹层抽屉（`transform: translateX(...)`），打开时互斥。
  - `#stepbar` 通过 `ResizeObserver` 在默认胶囊、`.compact`、`.balls` 与 `.stacked` 模式间动态切换。

---

## 7. 构建、验证与打包参考

### 自动化无头验证
- **语法校验**：`node --check src/data.js && node --check src/xray.js && node --check src/app.js`。
- **DOM 与视觉验证**：通过 Chrome DevTools Protocol 驱动无头 Chromium，验证桌面端欢迎页单行布局、`[1/6, 1/3]` 单卡片滚动热区选择、`tools` 内 `depth <= 1` JSON 折叠、`.is-full-json` 底部撑满与 `#xrayDoc` 间距、收起态侧栏 `.tt-head` 提示（`bi`/`zh`/`en`）、四模型沙盒切换，以及 `1M` 预算核算。

### 桌面 `.deb` 构建与交叉编译
- 使用 `src-tauri/tauri.conf.json`（`version: "0.1.17"`）通过 `npx tauri build --bundles deb` 构建原生 `amd64` 与交叉编译 `aarch64-unknown-linux-gnu`（`arm64`）`.deb` 包。
- 生成的二进制安装 `/usr/bin/agent-xray`、桌面入口 `/usr/share/applications/Agent X-Ray.desktop` 及 hicolor 图标（`32x32`、`128x128`、`256x256@2`、`512x512`）。

### 静态 Web 分发
- `agent-xray_v0.1.17_web.zip` 打包 `src/*` 及 Cloudflare Pages `_headers`（`X-Content-Type-Options: nosniff`、`Referrer-Policy: no-referrer`），零外部资产依赖。
