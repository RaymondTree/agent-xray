# Changelog · 版本变更日志

All notable changes to **Agent X-Ray** are documented in this file.
本文档完整记录 **Agent X-Ray** 从 `v0.1.1` 到测试迭代 `v0.1.2–v0.1.17` 直至正式版 `v0.1.17` 的全部演进细节。

---

## [v0.1.17] - 2026-11-26（正式发行版 / Formal Release）

### Highlights / 核心更新
- **1M Context Budget & Updated Model Suite / 1M 上下文预算与新一代模型清单**
  - Updated default model from `claude-sonnet-4-5` to `claude-sonnet-5-5`, and expanded Request Sandbox (`#sbModel`) to `claude-fable-5-2`, `claude-opus-5-5`, `claude-sonnet-5-5`, and `claude-haiku-5-5` with live header label sync (`#sbModelVal`).
  - Upgraded standard context budget from `200k` (`200,000`) to **`1M` (`1,000,000`)** across `REQ_BASE`, `App.sandbox`, `XRay.state.context`, composer chip overflow checks (`ctxTok > budget`), Scenario 05 budget breakdown, Scenario 11/12 compaction demos (`920k→12k` / `890k→14k`), and `README.md`.
- **Full-JSON & Inspector UX Refinements / 完整 JSON 视图与透视交互打磨**
  - Restricted JSON tree folding toggles (`.jfold` / `.jnode`) to `depth <= 1` (`root` and top-level containers such as `tools`, `messages`, `content`, `usage`, `error`), fixing nested infinite-feel multi-level expansion inside `tools[]` while retaining full syntax highlighting, `focusKey` highlight rings, and clickable blue field docs at all depths.
  - Added flex-fill `.xray-body.is-full-json` layout so `Request JSON` / `Response JSON` cards stretch cleanly to the bottom of the inspector pane when idle, and dynamically shrink to reserve space for `#xrayDoc` when a field doc card opens—keeping `.xr-mode-bar` pinned at the top.
  - Tuned Card mode `.is-item-card` scroll-highlight active zone to the **second 1/6 vertical slice** (`[1/6, 1/3]`, midpoint `25%`) with strict single-winner selection, aligned `focusKey` auto-scroll (`0.25`) and `#xrayDoc` clamping (`br.height / 6`), and `.xray-body.is-cards-scroll` bottom padding (`max(64px, 48vh)`).
- **Symmetric Side Panel Controls & Collapsed Sidebar Tooltips / 对称侧栏开关与收起态悬停标题**
  - Placed `#xrayToggleBtn` symmetrically inside `.xray-head` alongside `#sideToggleBtn` in the left sidebar header, plus `#xrayExpandBtn` next to `#resetBtn` when the X-Ray panel is collapsed.
  - Added `.tt-head` scenario number + localized/bilingual title header at the top of `.tooltip` when hovering items in the collapsed left sidebar (`!this.sideOpen`), with strict `中英` / `中文` / `EN` isolation.
- **Complete `v0.1.2–v0.1.17` Feature Consolidation / 汇总 `v0.1.2–v0.1.17` 全部增量改进**
  - Bilingual (`中英` / `中文` / `EN`) live non-destructive re-rendering of chat timeline, X-Ray panels, tooltips, and tour overlays with zero Chinese leakage in `EN` mode.
  - Interactive branch tree synchronization (click any node to rewind/switch chat history and context), interactive "Try It" & permission countdown gates, smooth CSS Grid/Keyframe drawers and accordions, responsive `ResizeObserver` stepbar, and `50%–200%` global zoom with auto-drawer switching at `<= 1040px`.

---

## Testing Iterations (`v0.1.2`–`v0.1.17`)

### [v0.1.17] - 2026-11-26
- **Card Scroll-Highlight Band Adjustment (`src/xray.js`, `src/styles.css`)**: Moved active highlight band in `_syncCardScrollHot` from `[0.25, 0.50]` (`zoneMid = 0.375`) to the second 1/6 slice `[1/6, 1/3]` (`zoneMid = 0.25`), updated `focusKey` auto-scroll target (`0.25`) and `#xrayDoc` scroll clamp (`br.height / 6`), and tuned `.xray-body.is-cards-scroll` `padding-bottom: max(64px, 48vh)`.
- **Model & Context Upgrade (`src/data.js`, `src/xray.js`, `src/app.js`, `README.md`)**: Replaced example models with `claude-fable-5-2`, `claude-opus-5-5`, `claude-sonnet-5-5` (default), and `claude-haiku-5-5`; updated max context budget from `200,000` (`200k`) to `1,000,000` (`1M`) across UI, Request Sandbox (`#sbModel`, `#sbModelVal`, `#sbBudget`), composer chip, and compaction metrics (`920k→12k`, `890k→14k`).
- **Full JSON Fixes (`src/xray.js`, `src/styles.css`)**:
  - Limited `.jfold` collapsible wrappers to `depth <= 1` in `_renderJSONVal`, preventing endless nested collapse/expand chains inside `tools[]`.
  - Added `.xr-json-card` and `.xray-body.is-full-json` flex-column layout so `Request JSON` / `Response JSON` fills the remaining panel height to the bottom and yields space dynamically when `#xrayDoc` pops up.
- **Collapsed Left Sidebar Tooltip (`src/app.js`, `src/styles.css`)**: Prepended `.tt-head` (experience index badge + title) at the top of hover tooltips whenever `!this.sideOpen`, respecting `bi` / `zh` / `en`.

### [v0.1.16] - 2026-11-26
- **Symmetric X-Ray Panel Toggles (`src/index.html`, `src/styles.css`, `src/app.js`)**: Moved `#xrayToggleBtn` from `.topbar` into `.xray-head` to mirror `#sideToggleBtn`; added `#xrayExpandBtn` next to `#resetBtn` inside `.scn-actions` when X-Ray is collapsed; updated `TOUR_STEPS[6]` copy and popover outside-click selector.
- **Single-Winner Card Scroll Zone (`src/xray.js`)**: Narrowed card highlight band to `[0.25, 0.50]` (`zoneMid = 0.375`), guaranteed strictly one `.is-scroll-hot` card at any scroll offset, and scrolled `focusKey` inner cards to `0.375`.

### [v0.1.15] - 2026-11-26
- **Welcome Page Layout & Inner Item-Card Highlighting (`src/styles.css`, `src/xray.js`)**: Adjusted `.empty p` font sizing/padding (`13.5px`) so all 4 bilingual guide sentences fit on single lines at 100% desktop zoom; shifted scroll-center highlighting (`is-scroll-hot`) from outer section wrappers onto individual `.is-item-card` elements (`tools[i]`, `messages[i]`, `sse-preview`) and positioned `#xrayDoc` cleanly below headers/cards.

### [v0.1.14] - 2026-11-26
- **Interactive Card Mode Fields & Scroll-Hot Inspection (`src/xray.js`, `src/styles.css`, `src/app.js`)**: Made Card view field keys (`.xr-ck`, `.xr-cfield`, `.xr-ch-key`) clickable to reveal contextual `#xrayDoc` documentation directly beneath the active card; added `ResizeObserver` and scroll listeners driving `.is-scroll-hot` emphasis; added `error`/`status` field docs; normalized Sandbox label to `tools count`.

### [v0.1.13] - 2026-11-26
- **Adaptive Stepbar & Suggested Follow-Up Polish (`src/styles.css`, `src/app.js`, `src/data.js`)**: Added `ResizeObserver` layout modes on `#stepbar` (`.compact`, `.balls`, `.stacked`) to avoid step-pill overflow across narrow panels or 12-step scenarios; refined suggested follow-up prompt dispatching and Hook block wording.

### [v0.1.12] - 2026-11-25
- **Context Overflow Simulation & Compact Topbar (`src/index.html`, `src/styles.css`, `src/xray.js`, `src/app.js`)**: Added `#langCycleBtn` for narrow viewports; added `setErrorResponse()` / `HTTP 400 invalid_request_error` simulation when `ctxTok > budget` during playback or chat; refined composer chip display (`tokens` vs `/ budget tok`).

### [v0.1.11] - 2026-11-25
- **Interactive Waiting Beats & Permission Countdowns (`src/styles.css`, `src/xray.js`, `src/app.js`, `src/data.js`)**: Replaced passive waits with interactive circular countdown rings (`.ring-cd`) for `wait` beats (`xray-req`, `xray-res`, `xray-tree`, `sandbox`) and `perm` approval cards (10s auto-deny timeout with instant user override/skip); wired `XRay.onInteract` callbacks into live step completion.

### [v0.1.10] - 2026-11-25
- **Unified Vector Panel Icons & Instant Responsive Init (`src/index.html`, `src/styles.css`, `src/app.js`)**: Replaced toggle icon artwork with crisp inline `<svg>` panel-split icons (`rect + divider + .panel-arrow`) supporting horizontal flip transitions and `.noPanelAnim` suppression during initial layout/breakpoint sync.

### [v0.1.9] - 2026-11-25
- **Panel Directional Arrows & X-Ray Toggle Styling (`src/index.html`, `src/styles.css`, `src/app.js`)**: Introduced `#i-panel-lt` / `#i-panel-gt` panel directional symbols and unified `#xrayToggleBtn` border/hover contrast across light and dark themes.

### [v0.1.8] - 2026-11-25
- **Guide Tour Position Fix & Bilingual Popover Columns (`src/styles.css`, `src/app.js`)**: Prevented initial tour-card flash from `(12,12)` via explicit positioning prior to reveal, aligned `.bi-inline` baseline spacing, and styled two-column `.pop-cols` guide popovers with dotted vertical divider (`.pop-col-en`).

### [v0.1.7] - 2026-11-25
- **Collapsed Sidebar Header Geometry (`src/styles.css`, `src/app.js`)**: Balanced `.side-head` height (`72px` expanded / `78px` collapsed) and `.side-title` padding (`34px` / `48px`) for clean alignment of `#sideToggleBtn` and `#doneCount`; refined Tour Step 7 description.

### [v0.1.6] - 2026-11-25
- **Smooth Icon-Rail Sidebar Collapse & Progress Bar (`src/index.html`, `src/styles.css`, `src/app.js`)**: Replaced abrupt left sidebar hiding with a sleek `56px` numbered icon rail (`.shell.noSide`), added visual progress bar (`#doneBar`) alongside `#doneCount`, and bound hover tooltips (`_bindSidebarTooltips`) on collapsed indicators.

### [v0.1.5] - 2026-11-25
- **Scroll-Preserving Live Updates & Animated Accordions (`src/styles.css`, `src/xray.js`, `src/app.js`)**: Upgraded tool-call body expansion to CSS `grid-template-rows: 0fr -> 1fr` transitions; added `_updateResponseIncremental()` to append live SSE frames smoothly without resetting scroll; added `_bindChatScrollGuard` so manual user scrolling suspends auto-scroll-to-bottom.

### [v0.1.4] - 2026-11-25
- **SVG Flow Arrow Precision & Bilingual Baseline (`src/styles.css`, `src/xray.js`)**: Added `--node-active-bg` light/dark tokens, aligned `.bi-inline` flex baselines, and recalibrated Flow tab SVG node/arrow coordinates (`ax`, `ay`, `lx`, `ly`) for exact arrowhead attachment.

### [v0.1.3] - 2026-11-25
- **JSON Tree Focus Ring, Fold Memory & Assistant Forking (`src/index.html`, `src/styles.css`, `src/xray.js`, `src/app.js`, `src/data.js`)**: Added `_foldOverrides` Map keyed by `jpath` so fold states survive re-renders; expanded `FIELD_DOCS` (`input_schema`, `properties`, `required`, `partial_json`, `cache_*`, etc.); added `.jfocus-row.json-focus-ring`; moved "Fork here" button from user bubbles to `.msg.assistant .ai-head`; added maximize/compress SVG icons for the Branch Tree modal.

### [v0.1.2] - 2026-11-25
- **Bilingual Foundation, Branch Sync, Live Re-Translation & Layout Fixes (`index.html`, `styles.css`, `xray.js`, `app.js`, `data.js`, `README.md`)**:
  - Fixed `.shell.noSide` / `.shell.noXray` CSS specificity so center console expands cleanly on panel collapse.
  - Wired Branch Tree clicks (`treePaths`) to rewind/switch central chat timeline and X-Ray state synchronously.
  - Enabled lossless live re-translation across existing chat messages, tool cards, code blocks, HTTP/SSE/MCP/Memory cards, and X-Ray views (`中英` / `中文` / `EN`), plus pure English half-width punctuation and zero Chinese leaks in `EN`.
  - Positioned `#xrayDoc` below JSON cards, aligned user messages to the right, unified copy button SVG morphing (`2s` green checkmark), enlarged Step Jump hover hitboxes with `white-space: nowrap` pills, added animated sheet/popover transitions, added bilingual Step 1 language chooser in Guide Tour, and added topbar GitHub link (`#githubBtn`).

---

## [v0.1.1] - 2026-11-25
- Initial packaged release (`agent-xray_0.1.1_amd64.deb`, `agent-xray_0.1.1_arm64.deb`, `agent-xray_0.1.1_web.zip`, `source-code.zip`):
  - 12 interactive AI Agent learning scenarios covering Agent Loop, Request JSON, SSE Streaming, Tool Calling, Context & Prompt Caching, Branching & Rollback, MCP, Skills, Subagents, Hooks & Permissions, Memory & Compaction, and an 8-step full capstone trace.
  - 5-tab X-Ray inspector (`Request`, `Response`, `Context`, `Flow`, `Branch Tree`), Request Sandbox, 50%–200% zoom with Tauri v2 `set_zoom` / `open_external` IPC commands, dark/light themes, and static Cloudflare Pages / Linux `.deb` packaging.
