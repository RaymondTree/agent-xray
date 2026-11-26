# Changelog · 版本变更日志

本文件完整记录 **Agent X-Ray** 的所有重要变更。
本文档覆盖从 `v0.1.1` 到测试迭代 `v0.1.2–v0.1.17` 直至正式版 `v0.1.17` 的全部演进细节。

---

## [v0.1.17] - 2026-11-26（正式发行版）

### 核心更新
- **1M 上下文预算与新一代模型清单**
  - 默认模型由 `claude-sonnet-4-5` 升级为 `claude-sonnet-5-5`；请求沙盒（`#sbModel`）扩展至 `claude-fable-5-2`、`claude-opus-5-5`、`claude-sonnet-5-5`、`claude-haiku-5-5` 四个模型，请求头标签同步实时更新（`#sbModelVal`）。
  - 标准上下文预算由 `200k`（`200,000`）升级为 **`1M`（`1,000,000`）**，贯穿 `REQ_BASE`、`App.sandbox`、`XRay.state.context`、输入框 chip 溢出检测（`ctxTok > budget`）、场景 05 的预算拆解、场景 11/12 的压缩演示（`920k→12k` / `890k→14k`）以及 `README.md`。
- **完整 JSON 视图与透视交互打磨**
  - JSON 树折叠开关（`.jfold` / `.jnode`）限制为仅在 `depth <= 1`（`root` 及 `tools`、`messages`、`content`、`usage`、`error` 等顶层容器）输出，修复了 `tools[]` 内部嵌套展开时"感觉无限"的多级折叠问题，同时保留全深度语法高亮、`focusKey` 高亮环与可点击的蓝色字段文档。
  - 新增 flex 撑满布局 `.xray-body.is-full-json`：`Request JSON` / `Response JSON` 卡片在空闲时平滑延伸至透视镜面板底部；当字段文档卡（`#xrayDoc`）弹出时动态收缩让出空间，`.xr-mode-bar` 始终固定于顶部。
  - 卡片模式 `.is-item-card` 滚动高亮热区调整为**自上而下第 2 个 1/6 垂直切片**（`[1/6, 1/3]`，中点 `25%`），严格单一选中；`focusKey` 自动滚动目标（`0.25`）、`#xrayDoc` 滚动钳制（`br.height / 6`）及 `.xray-body.is-cards-scroll` 底部留白（`max(64px, 48vh)`）同步校准。
- **对称侧栏开关与收起态悬停标题**
  - `#xrayToggleBtn` 对称放置于左侧栏头部 `.xray-head` 内，与 `#sideToggleBtn` 对齐；X-Ray 面板收起时，`#xrayExpandBtn` 显示在 `#resetBtn` 旁。
  - 收起的左侧栏（`!this.sideOpen`）悬停体验项时，`.tooltip` 顶部新增 `.tt-head` 场景编号 + 本地化/双语标题，`中英` / `中文` / `EN` 三种语言模式严格隔离。
- **汇总 `v0.1.2–v0.1.17` 全部增量改进**
  - 双语（`中英` / `中文` / `EN`）对话时间线、X-Ray 面板、提示语与导览浮层的实时无损重译重渲染，`EN` 模式零中文泄漏。
  - 可交互分支树联动（点击任意节点即可回溯/切换对话历史与上下文）、可交互 "Try It" 与权限倒计时关卡、CSS Grid/Keyframe 平滑抽屉与手风琴、响应式 `ResizeObserver` 步骤条，以及 `50%–200%` 全局缩放（`<= 1040px` 时自动切换为抽屉形态）。

---

## 测试迭代（`v0.1.2`–`v0.1.17`）

### [v0.1.17] - 2026-11-26
- **卡片滚动高亮热区调整（`src/xray.js`、`src/styles.css`）**：`_syncCardScrollHot` 的活动高亮带由 `[0.25, 0.50]`（`zoneMid = 0.375`）移至第 2 个 1/6 切片 `[1/6, 1/3]`（`zoneMid = 0.25`）；`focusKey` 自动滚动目标（`0.25`）与 `#xrayDoc` 滚动钳制（`br.height / 6`）同步更新；`.xray-body.is-cards-scroll` 底部留白调为 `padding-bottom: max(64px, 48vh)`。
- **模型与上下文升级（`src/data.js`、`src/xray.js`、`src/app.js`、`README.md`）**：示例模型替换为 `claude-fable-5-2`、`claude-opus-5-5`、`claude-sonnet-5-5`（默认）、`claude-haiku-5-5`；上下文预算由 `200,000`（`200k`）提升至 `1,000,000`（`1M`），覆盖界面、请求沙盒（`#sbModel`、`#sbModelVal`、`#sbBudget`）、输入框 chip 与压缩指标（`920k→12k`、`890k→14k`）。
- **完整 JSON 修复（`src/xray.js`、`src/styles.css`）**：
  - `_renderJSONVal` 中 `.jfold` 可折叠包裹层限制在 `depth <= 1`，杜绝 `tools[]` 内部的无休止嵌套折叠/展开链。
  - 新增 `.xr-json-card` 与 `.xray-body.is-full-json` flex 纵向布局，`Request JSON` / `Response JSON` 撑满剩余面板高度直达底部；`#xrayDoc` 弹出时动态让出空间。
- **收起态左侧栏悬停提示（`src/app.js`、`src/styles.css`）**：`!this.sideOpen` 时悬停提示顶部前置 `.tt-head`（体验编号徽章 + 标题），遵循 `bi` / `zh` / `en` 语言模式。

### [v0.1.16] - 2026-11-26
- **对称 X-Ray 面板开关（`src/index.html`、`src/styles.css`、`src/app.js`）**：`#xrayToggleBtn` 由 `.topbar` 移入 `.xray-head`，与 `#sideToggleBtn` 对称；X-Ray 收起时 `.scn-actions` 内 `#resetBtn` 旁新增 `#xrayExpandBtn`；同步更新 `TOUR_STEPS[6]` 文案与浮层外点击选择器。
- **卡片滚动单一选中热区（`src/xray.js`）**：高亮带收窄至 `[0.25, 0.50]`（`zoneMid = 0.375`），保证任意滚动偏移下严格只有一张 `.is-scroll-hot` 卡片；`focusKey` 内层卡片滚动目标为 `0.375`。

### [v0.1.15] - 2026-11-26
- **欢迎页布局与内部卡片高亮（`src/styles.css`、`src/xray.js`）**：`.empty p` 字号/内边距调整为 `13.5px`，100% 桌面缩放下 4 条双语引导语均单行显示；滚动居中高亮（`is-scroll-hot`）由外层区块容器下移至各 `.is-item-card` 元素（`tools[i]`、`messages[i]`、`sse-preview`），`#xrayDoc` 干净地置于标题/卡片下方。

### [v0.1.14] - 2026-11-26
- **卡片模式可交互字段与滚动热区检视（`src/xray.js`、`src/styles.css`、`src/app.js`）**：卡片视图字段键（`.xr-ck`、`.xr-cfield`、`.xr-ch-key`）可点击，在激活卡片正下方展开对应 `#xrayDoc` 文档；新增 `ResizeObserver` 与滚动监听驱动 `.is-scroll-hot` 强调；补充 `error`/`status` 字段文档；沙盒标签统一为 `tools count`。

### [v0.1.13] - 2026-11-26
- **自适应步骤条与建议追问打磨（`src/styles.css`、`src/app.js`、`src/data.js`）**：`#stepbar` 新增 `ResizeObserver` 布局模式（`.compact`、`.balls`、`.stacked`），避免窄面板或 12 步场景下步骤胶囊溢出；打磨建议追问提示词派发与 Hook 区块文案。

### [v0.1.12] - 2026-11-25
- **上下文溢出模拟与紧凑顶栏（`src/index.html`、`src/styles.css`、`src/xray.js`、`src/app.js`）**：窄视口新增 `#langCycleBtn`；播放或对话中 `ctxTok > budget` 时模拟 `setErrorResponse()` / `HTTP 400 invalid_request_error`；打磨输入框 chip 显示（`tokens` 与 `/ budget tok`）。

### [v0.1.11] - 2026-11-25
- **可交互等待节拍与权限倒计时（`src/styles.css`、`src/xray.js`、`src/app.js`、`src/data.js`）**：被动等待替换为可交互圆形倒计时环（`.ring-cd`），覆盖 `wait` 节拍（`xray-req`、`xray-res`、`xray-tree`、`sandbox`）与 `perm` 审批卡（10 秒自动拒绝超时，支持用户即时覆盖/跳过）；`XRay.onInteract` 回调接入实时步骤完成。

### [v0.1.10] - 2026-11-25
- **统一矢量面板图标与即时响应式初始化（`src/index.html`、`src/styles.css`、`src/app.js`）**：开关图标替换为清晰的内联 `<svg>` 面板分割图标（`rect + divider + .panel-arrow`），支持水平翻转过渡与初始布局/断点同步时的 `.noPanelAnim` 动画抑制。

### [v0.1.9] - 2026-11-25
- **面板方向箭头与 X-Ray 开关样式（`src/index.html`、`src/styles.css`、`src/app.js`）**：引入 `#i-panel-lt` / `#i-panel-gt` 面板方向符号；`#xrayToggleBtn` 在明/暗主题下统一边框与悬停对比度。

### [v0.1.8] - 2026-11-25
- **导览定位修复与双语浮层双栏（`src/styles.css`、`src/app.js`）**：显式定位避免初始导览卡从 `(12,12)` 闪现；对齐 `.bi-inline` 基线间距；`.pop-cols` 双栏导览浮层配虚线纵向分隔（`.pop-col-en`）。

### [v0.1.7] - 2026-11-25
- **收起态侧栏头部几何（`src/styles.css`、`src/app.js`）**：`.side-head` 高度（展开 `72px` / 收起 `78px`）与 `.side-title` 内边距（`34px` / `48px`）平衡校准，`#sideToggleBtn` 与 `#doneCount` 干净对齐；导览第 7 步说明打磨。

### [v0.1.6] - 2026-11-25
- **平滑图标轨侧栏收起与进度条（`src/index.html`、`src/styles.css`、`src/app.js`）**：生硬的左侧栏隐藏替换为精致的 `56px` 编号图标轨（`.shell.noSide`）；`#doneCount` 旁新增可视化进度条（`#doneBar`）；收起态指示器绑定悬停提示（`_bindSidebarTooltips`）。

### [v0.1.5] - 2026-11-25
- **滚动保持的实时更新与动画手风琴（`src/styles.css`、`src/xray.js`、`src/app.js`）**：工具调用体展开升级为 CSS `grid-template-rows: 0fr -> 1fr` 过渡；新增 `_updateResponseIncremental()` 平滑追加实时 SSE 帧而不重置滚动；新增 `_bindChatScrollGuard`，用户手动滚动时暂停自动滚底。

### [v0.1.4] - 2026-11-25
- **SVG 流程箭头精度与双语基线（`src/styles.css`、`src/xray.js`）**：新增 `--node-active-bg` 明暗主题令牌；对齐 `.bi-inline` flex 基线；Flow 标签页 SVG 节点/箭头坐标（`ax`、`ay`、`lx`、`ly`）重新校准，箭头精确衔接。

### [v0.1.3] - 2026-11-25
- **JSON 树聚焦环、折叠记忆与助手分叉（`src/index.html`、`src/styles.css`、`src/xray.js`、`src/app.js`、`src/data.js`）**：新增 `_foldOverrides` Map（键为 `jpath`），折叠状态在重渲染后保留；扩展 `FIELD_DOCS`（`input_schema`、`properties`、`required`、`partial_json`、`cache_*` 等）；新增 `.jfocus-row.json-focus-ring`；"Fork here" 按钮由用户气泡移至 `.msg.assistant .ai-head`；分支树弹框新增最大化/还原 SVG 图标。

### [v0.1.2] - 2026-11-25
- **双语基础、分支联动、实时重译与布局修复（`index.html`、`styles.css`、`xray.js`、`app.js`、`data.js`、`README.md`）**：
  - 修复 `.shell.noSide` / `.shell.noXray` CSS 特异性，面板收起时中央控制台干净扩展。
  - 分支树点击（`treePaths`）联动回溯/切换中央对话时间线与 X-Ray 状态。
  - 已有对话消息、工具卡、代码块、HTTP/SSE/MCP/Memory 卡片与 X-Ray 视图的全量无损实时重译（`中英` / `中文` / `EN`），英文模式纯半角标点、零中文泄漏。
  - `#xrayDoc` 置于 JSON 卡片下方；用户消息靠右对齐；复制按钮 SVG 形变统一（`2s` 绿色对勾）；步骤跳转悬停热区放大并加 `white-space: nowrap` 胶囊；新增动画弹层/浮层过渡；导览第 1 步双语语言选择器；顶栏 GitHub 链接（`#githubBtn`）。

---

## [v0.1.1] - 2026-11-25
- 首个打包发行版（`agent-xray_0.1.1_amd64.deb`、`agent-xray_0.1.1_arm64.deb`、`agent-xray_0.1.1_web.zip`、`source-code.zip`）：
  - 12 个由浅入深的 AI Agent 学习场景：Agent 主循环、请求 JSON、SSE 流式输出、工具调用、上下文与提示词缓存、分支与回滚、MCP、Skills、子代理、Hooks 与权限、记忆与压缩，以及 8 步完整综合演练。
  - 5 标签 X-Ray 透视镜（`Request`、`Response`、`Context`、`Flow`、`Branch Tree`）、请求沙盒、50%–200% 缩放（Tauri v2 `set_zoom` / `open_external` IPC 指令）、明/暗主题，以及静态 Cloudflare Pages / Linux `.deb` 打包。
