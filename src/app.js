/* ============================================================
   Agent X-Ray - Main Interactive Console & Learning State Machine
   ============================================================ */

const I18N = {
  appSub:     { zh: "AI Agent 透视镜", en: "Interactive Internals" },
  tour:       { zh: "新手教学", en: "Guide Tour" },
  listTitle:  { zh: "体验清单", en: "EXPERIENCES" },
  sideTip:    { zh: "点击任意体验跳转；悬停可预览提示；完成后有 ✓。", en: "Click any experience to jump; hover for hints; completed items get ✓." },
  howTo:      { zh: "怎么玩", en: "Guide" },
  autoplay:   { zh: "自动演示", en: "Auto play" },
  pause:      { zh: "暂停", en: "Pause" },
  resume:     { zh: "继续", en: "Resume" },
  stepJump:   { zh: "单步演示", en: "Step Jump" },
  params:     { zh: "请求参数", en: "Request params" },
  offline:    { zh: "离线模拟", en: "Offline sim" },
  emptyTitle: { zh: "准备好了，随时开始", en: "Ready when you are" },
  emptyDesc:  { zh: "点右上「自动演示」看全流程，或直接点击上方「单步演示」横条只看某一步；也可以在底部输入你的问题。", en: "Press \"Auto play\" for the full trace, click any \"Step Jump\" bar above to demo a single step, or ask a question below." },
  startBtn:   { zh: "开始自动演示", en: "Start Auto Play" },
  stepPrefix: { zh: "步骤", en: "Step" },
  clickDemo:  { zh: "点击仅演示这一步（自动保留前序上下文）", en: "Click to play only this step (prior context preserved)" },
  thinking:   { zh: "思考中", en: "Thinking" },
  forkBtn:    { zh: "从这里分支", en: "Fork here" },
  copy:       { zh: "复制", en: "Copy" },
  copied:     { zh: "已复制", en: "Copied" },
  inputLbl:   { zh: "输入 JSON", en: "input JSON" },
  outputLbl:  { zh: "输出结果", en: "output" },
  mcpReq:     { zh: "发送 ->", en: "RPC ->" },
  mcpRes:     { zh: "<- 返回", en: "<- RPC" },
  permTitle:  { zh: "权限审批 / Hook 安检", en: "Permission / Hook Check" },
  allowBtn:   { zh: "允许执行", en: "Allow" },
  denyBtn:    { zh: "拒绝拦截", en: "Deny" },
  permWaiting:{ zh: "等待审批 · 超时自动拒绝", en: "Waiting · auto-deny on timeout" },
  permTimedOut:{ zh: "10s 超时自动拒绝", en: "10s timeout · auto-denied" },
  interactTitle:        { zh: "动手试试 · 右侧 X-Ray 面板", en: "Try It · Right X-Ray Panel" },
  interactSandboxTitle: { zh: "动手试试 · 请求参数沙盒", en: "Try It · Request Params" },
  interactWaiting:      { zh: "等待操作 · 可随时跳过", en: "Waiting · skip anytime" },
  interactOpenXray:     { zh: "展开右侧 X-Ray", en: "Open X-Ray" },
  interactSkip:         { zh: "跳过继续", en: "Continue" },
  interactDone:         { zh: "已完成操作，继续演示", en: "Action completed · continuing" },
  interactTimeout:      { zh: "10s 未操作，自动继续演示", en: "10s elapsed · continuing demo" },
  interactBranchSwitched:{ zh: "已切换分支预览 · 即将继续主线演示", en: "Branch previewed · resuming main trace" },
  subParent:  { zh: "主 Agent 上下文", en: "Main Agent Context" },
  subChild:   { zh: "子代理独立上下文", en: "Isolated Subagent" },
  subArrow:   { zh: "↑ 仅把精炼结论带回主上下文", en: "^ Only the concise summary returns" },
  compactLbl: { zh: "上下文压缩 (Compaction)", en: "Context Compaction" },
  doneTitle:  { zh: "本体验已完成", en: "Experience Complete" },
  doneNext:   { zh: "继续下一课", en: "Next Experience" },
  doneAll:    { zh: "全部 12 课已完成！", en: "All 12 Experiences Complete!" },
  resetScn:   { zh: "已重置当前体验", en: "Scenario reset" },
  confirmTtl: { zh: "清空所有学习进度？", en: "Reset all learning progress?" },
  confirmMsg: { zh: "这将清除所有已完成打勾记录、当前对话与自定义分叉，并恢复到第 1 课初始状态。确定继续吗？", en: "This will clear all completed checkmarks, active chat state and custom branches, and return to Experience 1. Continue?" },
  confirmNo:  { zh: "取消", en: "Cancel" },
  confirmYes: { zh: "确认清空", en: "Confirm Reset" },
  clearedAll: { zh: "已清空全部学习进度", en: "All progress cleared" },
  forkedTip:  { zh: "已从该回复分支出新路径，可在右侧「分支」树切换回原路径", en: "Forked a new branch from this reply - switch back anytime in the Branch tree" },
  prefillSep: { zh: "已静音保留前 {n} 步上下文 · 正在单独演示第 {cur} 步", en: "Prefilled {n} prior step(s) silently · Playing Step {cur}" },
  stepOf:     { zh: "第 {a} / {b} 步", en: "Step {a} / {b}" },
  running:    { zh: "执行中...", en: "running..." }
};

const TOUR_STEPS = [
  {
    id: "lang",
    target: "#langSeg",
    pos: "bottom",
    allowTargetClick: true,
    forceBilingual: true,
    badge: { zh: "第 1 / 7 步 · 语言选择", en: "1 / 7 · Language" },
    title: { zh: "先选择你的界面语言", en: "Choose Your Interface Language" },
    desc:  {
      zh: "可以直接点击上方高亮的「中英 / 中文 / EN」按钮，或点击下方快捷选项。选定后，后续所有教学步骤和整个界面都会立即切换到你选择的语言。",
      en: "Click the highlighted \"中英 / 中文 / EN\" toggle in the topbar, or pick below. Remaining tour steps and the whole interface switch immediately."
    }
  },
  {
    id: "list",
    target: "#scnList",
    pos: "right",
    badge: { zh: "第 2 / 7 步 · 课程清单", en: "2 / 7 · Curriculum" },
    title: { zh: "12 个由浅入深的交互体验", en: "12 Progressive Interactive Experiences" },
    desc:  {
      zh: "从最基础的 while 主循环，到 MCP、Skills、子代理与完整综合实战。悬停可预览要点，完成后会亮起高对比度绿色 ✓。",
      en: "From the basic while-loop up to MCP, Skills, Subagents and the Capstone trace. Hover items for tips; completed lessons show a crisp green checkmark."
    }
  },
  {
    id: "stepbar",
    target: "#stepbar",
    pos: "bottom",
    badge: { zh: "第 3 / 7 步 · 单步演示", en: "3 / 7 · Step Jump" },
    title: { zh: "悬停看简介 · 点击只演这一步", en: "Hover for Preview · Click for Single Step" },
    desc:  {
      zh: "把鼠标放在任意横条上会放大并弹出这一步的要点；点击横条会瞬间保留前面步骤的上下文，仅动画演示你选中的这一步。",
      en: "Hover any step bar to enlarge it and preview its summary. Clicking instantly prefills prior steps and animates only that step."
    }
  },
  {
    id: "chat",
    target: "#chat",
    pos: "right",
    badge: { zh: "第 4 / 7 步 · 模拟控制台", en: "4 / 7 · Live Console" },
    title: { zh: "工具 JSON 自动展开与高亮", en: "Auto-Focused Tool JSON Cards" },
    desc:  {
      zh: "演示到工具调用、MCP JSON-RPC 或权限拦截时，卡片会自动展开并高亮关键 JSON；悬停任意 AI 回答还能「从这里分支」。",
      en: "Tool calls, MCP JSON-RPC and permission gates auto-expand and highlight key JSON. Hover any AI reply to fork a branch."
    }
  },
  {
    id: "xray",
    target: "#xrayPanel",
    pos: "left",
    badge: { zh: "第 5 / 7 步 · X-Ray 透视镜", en: "5 / 7 · X-Ray Inspector" },
    title: { zh: "卡片 / 完整 JSON 切换 + 实时流管道", en: "Cards / Full JSON & Live SSE Pipeline" },
    desc:  {
      zh: "右侧 5 个标签页同步揭秘底层状态：「请求」和「响应」支持切换「卡片」与「完整 JSON」，点击树节点还能切换分支对话。",
      en: "All 5 inspector tabs reveal live internals: Request & Response toggle Cards vs Full JSON, SSE streams live, and clicking Tree nodes switches chat branches."
    }
  },
  {
    id: "sandbox",
    target: "#sandboxBtn",
    pos: "top",
    badge: { zh: "第 6 / 7 步 · 请求沙盒", en: "6 / 7 · Request Sandbox" },
    title: { zh: "亲手改模型参数与系统提示", en: "Edit Model Params & Ask Questions" },
    desc:  {
      zh: "点击「请求参数」可实时开关工具、调节 temperature 或改 system prompt，观察 token 开销变化；也能在底部输入问题做离线问答。",
      en: "Click \"Request params\" to toggle tools, tune temperature or edit system prompt and watch token overhead shift. Or ask questions below."
    }
  },
  {
    id: "zoom",
    target: "#zoomSelect",
    pos: "bottom",
    badge: { zh: "第 7 / 7 步 · 缩放与侧栏", en: "7 / 7 · Zoom & Layout" },
    title: { zh: "50%~200% 缩放 & 固定侧栏开关", en: "50%-200% Zoom & Sidebar Toggles" },
    desc:  {
      zh: "可在此随时调整整体界面缩放比例，点击上方「新手教学」随时重看本指引；左侧体验清单左上角与右侧 X-Ray 面板右上角按钮（收起后可在「重置本场景」右侧展开）可平滑收起或展开两侧面板。",
      en: "Scale the UI from 50% to 200% here, replay this guide anytime, or collapse either side panel from its top corner button (re-expand X-Ray beside Reset scenario)."
    }
  }
];

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function highlightCode(src) {
  let out = esc(src);
  out = out.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="tk-cm">$1</span>');
  out = out.replace(/(&quot;[^&]*?&quot;|'[^']*?')/g, '<span class="tk-str">$1</span>');
  out = out.replace(/\b(const|let|var|async|await|function|return|if|else|while|true|false|null|break|new|import|from)\b/g, '<span class="tk-kw">$1</span>');
  out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tk-num">$1</span>');
  return out;
}

async function copyTextSafe(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const App = {
  lang: localStorage.getItem("ax_lang") || "bi",
  theme: localStorage.getItem("ax_theme") || "dark",
  zoom: Number(localStorage.getItem("ax_zoom") || "1") || 1,
  sideOpen: localStorage.getItem("ax_side_open") !== "0",
  xrayOpen: localStorage.getItem("ax_xray_open") !== "0",
  scnIdx: 0,
  stepIdx: -1,
  playing: false,
  paused: false,
  runId: 0,
  completed: new Set(JSON.parse(localStorage.getItem("ax_done") || "[]")),
  chatTimeline: [],
  branchSnapshots: new Map(),
  customIdSeq: 1,
  tourIdx: -1,
  sandbox: {
    model: "claude-sonnet-5-5",
    maxTokens: 8192,
    temperature: 0.2,
    toolsEnabled: 6,
    stream: true,
    system: REQ_BASE.system,
    contextBudget: 1000000
  },

  init() {
    document.documentElement.dataset.theme = this.theme;
    document.documentElement.dataset.lang = this.lang;
    const vp = this._syncViewportClasses();
    this._wasCompact = vp.compact;
    if (vp.compact) {
      this.sideOpen = false;
      this.xrayOpen = false;
    }
    this.applySidebars(false);
    this.applyZoom(this.zoom, false);

    XRay.init({
      onBranchSelect: (nid) => this.handleTreeSelect(nid),
      onInteract: (kind, detail) => this._notifyInteractiveAction(kind, detail)
    });
    XRay.setLang(this.lang);
    XRay.setSandbox(this.sandbox);

    this._bindTopbar();
    this._bindConsole();
    this._renderI18n();
    this.renderSidebar();
    this.selectScenario(0);

    const stepbar = document.getElementById("stepbar");
    if (stepbar && typeof ResizeObserver !== "undefined") {
      this._stepbarObs = new ResizeObserver(() => {
        if (this._stepbarRaf) cancelAnimationFrame(this._stepbarRaf);
        this._stepbarRaf = requestAnimationFrame(() => {
          this._stepbarRaf = 0;
          this._layoutStepbar();
        });
      });
      this._stepbarObs.observe(stepbar);
    }

    if (!localStorage.getItem("ax_tour_seen")) {
      setTimeout(() => this.startTour(), 420);
    }
  },

  /* ============================================================
     Bilingual Rendering Helpers
     ============================================================ */
  t(key) {
    const entry = I18N[key];
    if (!entry) return key;
    return this.lang === "en" ? entry.en : entry.zh;
  },

  tPair(key, fallbackEn) {
    const entry = I18N[key];
    if (!entry) return this.biInline(key, fallbackEn || key);
    return this.biInline(entry.zh, entry.en);
  },

  tStack(key) {
    const entry = I18N[key];
    if (!entry) return esc(key);
    return this.biStack(entry.zh, entry.en);
  },

  biPairText(zh, en) {
    if (this.lang === "zh") return zh || "";
    if (this.lang === "en") return en || zh || "";
    if (!en || zh === en) return zh || "";
    return `${zh} / ${en}`;
  },

  biObjText(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return this.biPairText(obj.zh, obj.en);
  },

  biText(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return this.lang === "en" ? (obj.en || obj.zh || "") : (obj.zh || obj.en || "");
  },

  _fmt(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  },

  biInline(zh, en, forceBi = false) {
    const cleanZh = zh || "";
    const cleanEn = en || "";
    if (!forceBi && this.lang === "zh") return esc(cleanZh);
    if (!forceBi && this.lang === "en") return esc(cleanEn || cleanZh);
    if (!cleanEn || cleanZh === cleanEn) return esc(cleanZh);
    return `<span class="bi-inline"><span class="bi-zh">${esc(cleanZh)}</span><span class="bi-sep">/</span><span class="bi-en">${esc(cleanEn)}</span></span>`;
  },

  biStack(zh, en, forceBi = false) {
    const cleanZh = zh || "";
    const cleanEn = en || "";
    if (!forceBi && this.lang === "zh") return `<span class="bi-zh">${this._fmt(cleanZh)}</span>`;
    if (!forceBi && this.lang === "en") return `<span class="bi-en">${this._fmt(cleanEn || cleanZh)}</span>`;
    if (cleanZh && cleanEn && cleanZh === cleanEn) {
      return `<span class="bi-zh">${this._fmt(cleanZh)}</span>`;
    }
    return `<span class="bi-zh">${this._fmt(cleanZh)}</span>${cleanEn ? `<span class="bi-en">${this._fmt(cleanEn)}</span>` : ""}`;
  },

  biHTML(zh, en) {
    return this.biStack(zh, en, false);
  },

  /* ============================================================
     Language Switch (Live Re-translation Everywhere)
     ============================================================ */
  setLanguage(newLang) {
    if (!["bi", "zh", "en"].includes(newLang)) return;
    this.lang = newLang;
    localStorage.setItem("ax_lang", this.lang);
    document.documentElement.dataset.lang = this.lang;
    document.querySelectorAll("#langSeg button[data-lang]").forEach(b => b.classList.toggle("on", b.dataset.lang === this.lang));
    const cycleBtn = document.getElementById("langCycleBtn");
    if (cycleBtn) {
      const lblMap = { bi: "中英", zh: "中文", en: "EN" };
      cycleBtn.textContent = lblMap[this.lang] || "中英";
      cycleBtn.title = this.biPairText(
        `当前语言：${lblMap[this.lang]}（点击切换）`,
        `Language: ${lblMap[this.lang]} (click to cycle)`
      );
    }

    XRay.setLang(this.lang);
    this._renderI18n();
    this.renderSidebar();
    this._renderScenarioHeader();
    this.renderStepDots();
    this._rerenderChat();

    // Update open overlays if present
    this._updateOpenHintPopover();
    if (document.querySelector(".sheet")) {
      this.openSandbox({ instant: true });
    }
    if (document.querySelector(".modal.confirm")) {
      this.openResetConfirm({ instant: true });
    }
    if (this.tourIdx >= 0) this._renderTourStep();
  },

  _bindTopbar() {
    document.getElementById("sideToggleBtn").addEventListener("click", () => {
      const compact = this._effViewport().w <= 1040;
      this.sideOpen = !this.sideOpen;
      if (compact) {
        if (this.sideOpen) this.xrayOpen = false;
      } else {
        localStorage.setItem("ax_side_open", this.sideOpen ? "1" : "0");
      }
      this._hideTooltip();
      this.applySidebars(true);
    });
    this._bindSidebarTooltips();
    const toggleXray = () => {
      const compact = this._effViewport().w <= 1040;
      this.xrayOpen = !this.xrayOpen;
      if (compact) {
        if (this.xrayOpen) this.sideOpen = false;
      } else {
        localStorage.setItem("ax_xray_open", this.xrayOpen ? "1" : "0");
      }
      this.applySidebars(true);
    };
    document.getElementById("xrayToggleBtn")?.addEventListener("click", toggleXray);
    document.getElementById("xrayExpandBtn")?.addEventListener("click", toggleXray);

    const ghBtn = document.getElementById("githubBtn");
    if (ghBtn) {
      ghBtn.addEventListener("click", async (e) => {
        if (this._isTauri()) {
          e.preventDefault();
          try {
            await window.__TAURI_INTERNALS__.invoke("open_external", { url: ghBtn.href });
          } catch {}
        }
      });
    }

    window.addEventListener("resize", () => this._handleViewportMode());

    const zoomSel = document.getElementById("zoomSelect");
    zoomSel.value = String(this.zoom);
    zoomSel.addEventListener("change", () => {
      this.applyZoom(Number(zoomSel.value), true);
    });

    document.getElementById("tourBtn").addEventListener("click", () => this.startTour());

    document.querySelectorAll("#langSeg button[data-lang]").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.lang === this.lang);
      btn.addEventListener("click", () => this.setLanguage(btn.dataset.lang));
    });
    const cycleBtn = document.getElementById("langCycleBtn");
    if (cycleBtn) {
      const lblMap = { bi: "中英", zh: "中文", en: "EN" };
      cycleBtn.textContent = lblMap[this.lang] || "中英";
      cycleBtn.title = this.biPairText(
        `当前语言：${lblMap[this.lang]}（点击切换）`,
        `Language: ${lblMap[this.lang]} (click to cycle)`
      );
      cycleBtn.addEventListener("click", () => {
        const order = ["bi", "zh", "en"];
        const next = order[(order.indexOf(this.lang) + 1) % order.length];
        this.setLanguage(next);
      });
    }

    document.getElementById("themeBtn").addEventListener("click", () => {
      this.theme = this.theme === "dark" ? "light" : "dark";
      localStorage.setItem("ax_theme", this.theme);
      document.documentElement.dataset.theme = this.theme;
      XRay.render({ skipScroll: true });
    });

    document.getElementById("resetAllBtn").addEventListener("click", () => this.openResetConfirm());
  },

  _bindConsole() {
    document.getElementById("playBtn").addEventListener("click", () => {
      if (this.playing) {
        if (this.paused && this._branchPlayPause) {
          this._restoreBranchPlayPause();
        }
        this.paused = !this.paused;
        this._updatePlayBtn();
      } else {
        this.playAll();
      }
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.selectScenario(this.scnIdx);
      this.showToast(this.biPairText(I18N.resetScn.zh, I18N.resetScn.en));
    });

    document.getElementById("hintBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleHintPopover();
    });

    document.getElementById("sandboxBtn").addEventListener("click", () => this.openSandbox());
    this._bindChatScrollGuard(document.getElementById("chat"));

    const input = document.getElementById("composerInput");
    const send = document.getElementById("sendBtn");
    const fire = (allowSuggested = false) => {
      const val = input.value.trim();
      if (!val) {
        if (allowSuggested) {
          const sug = this._getSuggestedQuestion();
          if (sug) this.sendUser(sug);
        }
        return;
      }
      input.value = "";
      input.style.overflowY = "hidden";
      input.style.height = "auto";
      this.sendUser(val);
    };
    send.addEventListener("click", () => fire(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fire(false);
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.overflowX = "hidden";
      input.style.overflowY = input.scrollHeight > 115 ? "auto" : "hidden";
      input.style.height = Math.min(115, input.scrollHeight) + "px";
    });
  },

  _isTauri() {
    return Boolean(window.__TAURI_INTERNALS__?.invoke);
  },

  _coordScale() {
    return this._isTauri() ? 1 : (this.zoom || 1);
  },

  _effViewport() {
    const z = this._coordScale();
    return {
      z,
      w: window.innerWidth / z,
      h: window.innerHeight / z
    };
  },

  _syncViewportClasses() {
    const isTauri = this._isTauri();
    const z = this.zoom || 1;
    const { w, h } = this._effViewport();
    const root = document.documentElement;

    if (!isTauri && document.body) {
      if (Math.abs(z - 1) < 0.001) {
        document.body.style.zoom = "";
        document.body.style.width = "";
        document.body.style.height = "";
        root.style.setProperty("--vw", "100vw");
        root.style.setProperty("--vh", "100vh");
      } else {
        document.body.style.zoom = String(z);
        document.body.style.width = `${w}px`;
        document.body.style.height = `${h}px`;
        root.style.setProperty("--vw", `${w}px`);
        root.style.setProperty("--vh", `${h}px`);
      }
    } else if (document.body) {
      document.body.style.zoom = "";
      document.body.style.width = "";
      document.body.style.height = "";
      root.style.setProperty("--vw", "100vw");
      root.style.setProperty("--vh", "100vh");
    }

    const cl = root.classList;
    cl.toggle("bp-xl", w >= 1800);
    cl.toggle("bp-1440", w <= 1440);
    cl.toggle("bp-1280", w <= 1280);
    cl.toggle("bp-1120", w <= 1120);
    cl.toggle("bp-1040", w <= 1040);
    cl.toggle("bp-860", w <= 860);
    cl.toggle("bp-760", w <= 760);
    cl.toggle("bp-660", w <= 660);
    cl.toggle("bp-h620", h <= 620);
    cl.toggle("bp-h460", h <= 460);
    return { w, h, compact: w <= 1040 };
  },

  _handleViewportMode() {
    const { compact } = this._syncViewportClasses();
    if (compact && !this._wasCompact) {
      this._wasCompact = true;
      this.sideOpen = false;
      this.xrayOpen = false;
      this.applySidebars(false);
    } else if (!compact && this._wasCompact) {
      this._wasCompact = false;
      this.sideOpen = localStorage.getItem("ax_side_open") !== "0";
      this.xrayOpen = localStorage.getItem("ax_xray_open") !== "0";
      this.applySidebars(false);
    }
    if (this.tourIdx >= 0) requestAnimationFrame(() => this._renderTourStep());
  },

  async applyZoom(val, save = true) {
    const z = Math.min(2, Math.max(0.5, Number(val) || 1));
    this.zoom = z;
    const sel = document.getElementById("zoomSelect");
    if (sel) sel.value = String(z);
    if (save) localStorage.setItem("ax_zoom", String(z));

    if (this._isTauri()) {
      try {
        await window.__TAURI_INTERNALS__.invoke("set_zoom", { zoom: z });
      } catch {}
      setTimeout(() => this._handleViewportMode(), 50);
    } else {
      this._handleViewportMode();
    }
  },

  _updateSideToggleBtn() {
    const btn = document.getElementById("sideToggleBtn");
    if (!btn) return;
    btn.classList.toggle("on", this.sideOpen);
    btn.setAttribute("aria-expanded", this.sideOpen ? "true" : "false");
    btn.title = this.sideOpen
      ? this.biPairText("收起体验清单", "Collapse experience list")
      : this.biPairText("展开体验清单", "Expand experience list");
  },

  _updateXrayToggleBtn() {
    const btn = document.getElementById("xrayToggleBtn");
    const expandBtn = document.getElementById("xrayExpandBtn");
    const expandTitle = this.biPairText("展开 X-Ray 面板", "Expand X-Ray panel");
    const collapseTitle = this.biPairText("收起 X-Ray 面板", "Collapse X-Ray panel");
    if (btn) {
      btn.classList.toggle("on", this.xrayOpen);
      btn.setAttribute("aria-expanded", this.xrayOpen ? "true" : "false");
      btn.title = this.xrayOpen ? collapseTitle : expandTitle;
    }
    if (expandBtn) {
      expandBtn.hidden = this.xrayOpen;
      expandBtn.setAttribute("aria-expanded", this.xrayOpen ? "true" : "false");
      expandBtn.title = expandTitle;
    }
  },

  applySidebars(animate = true) {
    const root = document.documentElement;
    const shell = document.getElementById("shell");
    if (!animate) root.classList.add("noPanelAnim");
    shell.classList.toggle("noSide", !this.sideOpen);
    shell.classList.toggle("noXray", !this.xrayOpen);
    this._updateSideToggleBtn();
    this._updateXrayToggleBtn();
    if (!animate) {
      void shell.offsetWidth;
      root.classList.remove("noPanelAnim");
    }
    if (animate && this.tourIdx >= 0) {
      setTimeout(() => this._renderTourStep(), 340);
    }
  },

  _bindSidebarTooltips() {
    const countEl = document.getElementById("doneCount");
    if (countEl) {
      countEl.addEventListener("mouseenter", () => {
        const done = this.completed.size;
        const total = SCENARIOS.length;
        this._showTooltip(
          countEl,
          this.biStack(
            `你已完成 ${done}/${total} 项体验`,
            `You have completed ${done}/${total} experiences`
          )
        );
      });
      countEl.addEventListener("mouseleave", () => this._hideTooltip());
    }

    const sideTipEl = document.getElementById("sideTip");
    const sideTipIc = sideTipEl?.querySelector(".side-tip-ic");
    if (sideTipEl) {
      sideTipEl.addEventListener("mouseenter", () => {
        if (!this.sideOpen) {
          this._showTooltip(sideTipEl, this.tStack("sideTip"));
        }
      });
      sideTipEl.addEventListener("mouseleave", () => this._hideTooltip());
    }
    if (sideTipIc && sideTipEl) {
      sideTipIc.addEventListener("mouseenter", () => {
        this._showTooltip(sideTipEl, this.tStack("sideTip"));
      });
      sideTipIc.addEventListener("mouseleave", () => {
        if (this.sideOpen) this._hideTooltip();
      });
    }
  },

  _renderI18n() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      if (I18N[k]) el.innerHTML = this.tPair(k);
    });
    document.querySelectorAll("[data-i18n-bi]").forEach(el => {
      const k = el.dataset.i18nBi;
      if (I18N[k]) el.innerHTML = this.tStack(k);
    });

    this._updateSideToggleBtn();
    this._updateXrayToggleBtn();
    const tipMap = {
      githubBtn:     ["查看 GitHub 仓库", "Open GitHub repository"],
      zoomCtl:       ["界面缩放", "UI Zoom"],
      themeBtn:      ["切换亮暗主题", "Toggle theme"],
      resetAllBtn:   ["清空学习进度", "Reset all progress"],
      resetBtn:      ["重置本场景", "Reset scenario"],
      sendBtn:       ["发送", "Send"]
    };
    Object.entries(tipMap).forEach(([id, [zh, en]]) => {
      const el = document.getElementById(id);
      if (el) el.title = this.biPairText(zh, en);
    });

    const sc = SCENARIOS[this.scnIdx];
    const inp = document.getElementById("composerInput");
    if (sc && inp) inp.placeholder = this.biObjText(sc.placeholder);
    this._updatePlayBtn();
    this._updateComposerChips();
  },

  _updatePlayBtn() {
    const btn = document.getElementById("playBtn");
    if (!btn) return;
    if (!this.playing) {
      btn.innerHTML = `<svg class="ic"><use href="#i-play"/></svg><span>${this.tPair("autoplay")}</span>`;
      btn.classList.remove("primary");
      btn.classList.add("ghost");
    } else if (this.paused) {
      btn.innerHTML = `<svg class="ic"><use href="#i-play"/></svg><span>${this.tPair("resume")}</span>`;
      btn.classList.add("primary");
      btn.classList.remove("ghost");
    } else {
      btn.innerHTML = `<svg class="ic"><use href="#i-pause"/></svg><span>${this.tPair("pause")}</span>`;
      btn.classList.add("primary");
      btn.classList.remove("ghost");
    }
  },

  _updateComposerChips() {
    const ctxTok = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
    const budget = XRay.state.context?.budget || this.sandbox.contextBudget || 1000000;
    const over = ctxTok > budget;
    const ctxEl = document.getElementById("ctxChip");
    if (ctxEl) {
      ctxEl.classList.toggle("over", over);
      ctxEl.innerHTML = budget !== 1000000 || over
        ? `<svg class="ic"><use href="#i-context"/></svg><b>${ctxTok.toLocaleString()}</b> / ${budget.toLocaleString()} tok`
        : `<svg class="ic"><use href="#i-context"/></svg><b>${ctxTok.toLocaleString()}</b> tokens`;
    }
    const stEl = document.getElementById("streamChip");
    if (stEl) stEl.textContent = this.sandbox.stream ? "stream on" : "stream off";
    const tlEl = document.getElementById("toolsChip");
    if (tlEl) tlEl.textContent = `tools ${this.sandbox.toolsEnabled}`;
  },

  /* ============================================================
     Sidebar
     ============================================================ */
  renderSidebar() {
    const list = document.getElementById("scnList");
    if (!list) return;
    list.innerHTML = SCENARIOS.map((sc, i) => {
      const done = this.completed.has(sc.id);
      const active = i === this.scnIdx;
      const num = String(i + 1).padStart(2, "0");
      const nameHtml = this.lang === "en"
        ? esc(sc.title.en)
        : this.lang === "zh"
          ? esc(sc.title.zh)
          : `${esc(sc.title.zh)}<span class="en">${esc(sc.title.en)}</span>`;
      return `<div class="scn-item${active ? " on" : ""}${done ? " done" : ""}" data-idx="${i}">
        <span class="pulse"></span>
        <span class="num">${num}</span>
        <div class="nm"><div class="nm-inner">${nameHtml}</div></div>
        <span class="ck-wrap" aria-label="completed"><svg class="ck"><use href="#i-check"/></svg></span>
      </div>`;
    }).join("");

    list.querySelectorAll(".scn-item").forEach(item => {
      const idx = Number(item.dataset.idx);
      item.addEventListener("click", () => this.selectScenario(idx));
      item.addEventListener("mouseenter", () => {
        const sc = SCENARIOS[idx];
        const bodyHtml = this.biStack(sc.hint.zh, sc.hint.en);
        if (!this.sideOpen) {
          const num = String(idx + 1).padStart(2, "0");
          const titleHtml = this.biStack(sc.title.zh, sc.title.en);
          this._showTooltip(item, `<div class="tt-head"><span class="tt-num">${num}</span><div class="tt-titles">${titleHtml}</div></div>${bodyHtml}`);
        } else {
          this._showTooltip(item, bodyHtml);
        }
      });
      item.addEventListener("mouseleave", () => this._hideTooltip());
    });

    const countEl = document.getElementById("doneCount");
    const barEl = document.getElementById("doneBar");
    if (countEl) {
      countEl.innerHTML = `<span class="sc-done">${this.completed.size}</span><span class="sc-sep"> / </span><span class="sc-tot">${SCENARIOS.length}</span>`;
    }
    if (barEl) barEl.style.width = `${(this.completed.size / SCENARIOS.length) * 100}%`;
  },

  /* ============================================================
     Scenario Header
     ============================================================ */
  _renderScenarioHeader() {
    const sc = SCENARIOS[this.scnIdx];
    if (!sc) return;
    document.getElementById("scnIcon").innerHTML = `<svg class="ic"><use href="#${sc.icon}"/></svg>`;

    const titleEl = document.getElementById("scnTitle");
    if (this.lang === "bi") {
      titleEl.innerHTML = `<span class="t-zh">${esc(sc.title.zh)}</span><span class="t-en">${esc(sc.title.en)}</span>`;
    } else if (this.lang === "zh") {
      titleEl.innerHTML = `<span class="t-zh">${esc(sc.title.zh)}</span>`;
    } else {
      titleEl.innerHTML = `<span class="t-en">${esc(sc.title.en)}</span>`;
    }

    const subEl = document.getElementById("scnSub");
    if (this.lang === "bi") {
      subEl.innerHTML = `<span class="sub-zh">${esc(sc.sub.zh)}</span><span class="sub-en">${esc(sc.sub.en)}</span>`;
    } else if (this.lang === "zh") {
      subEl.innerHTML = `<span class="sub-zh">${esc(sc.sub.zh)}</span>`;
    } else {
      subEl.innerHTML = `<span class="sub-en">${esc(sc.sub.en)}</span>`;
    }

    const badge = document.getElementById("hintBadge");
    if (badge) badge.textContent = String(sc.steps.length);
    const inp = document.getElementById("composerInput");
    if (inp) inp.placeholder = this.biObjText(sc.placeholder);
  },

  selectScenario(idx) {
    this.stopPlay();
    this._clearToolRestore();
    this.scnIdx = idx;
    this.stepIdx = -1;
    this.chatTimeline = [];
    this.branchSnapshots.clear();
    if (this._effViewport().w <= 1040 && this.sideOpen) {
      this.sideOpen = false;
      this.applySidebars(false);
    }
    XRay.reset();

    this.renderSidebar();
    this._renderScenarioHeader();
    this.renderStepDots();
    this._renderEmptyChat();
    this._updateComposerChips();
    this._updateOpenHintPopover();
  },

  _renderEmptyChat() {
    const chat = document.getElementById("chat");
    const sc = SCENARIOS[this.scnIdx];
    chat.innerHTML = `<div class="empty">
      <div class="big">${this.biStack(sc.title.zh, sc.title.en)}</div>
      <p>${this.biStack(I18N.emptyDesc.zh, I18N.emptyDesc.en)}</p>
      <p class="empty-hint">${this.biStack(sc.hint.zh, sc.hint.en)}</p>
      <button class="btn primary startbtn" id="emptyStartBtn">
        <svg class="ic"><use href="#i-play"/></svg>${this.tPair("startBtn")}
      </button>
    </div>`;
    document.getElementById("emptyStartBtn")?.addEventListener("click", () => this.playAll());
  },

  /* ============================================================
     Step Progress Bars + Rich Hover Tooltip + Single-Step Prefill
     ============================================================ */
  renderStepDots() {
    const sc = SCENARIOS[this.scnIdx];
    const dotsEl = document.getElementById("stepDots");
    const lblEl = document.getElementById("stepLabel");
    if (!sc || !dotsEl) return;

    dotsEl.innerHTML = sc.steps.map((st, i) => {
      const cls = i === this.stepIdx ? "dot cur" : i < this.stepIdx ? "dot done" : "dot";
      return `<button class="${cls}" data-step="${i}" aria-label="${esc(this.biObjText(st.label))}"><span class="dot-pill"></span></button>`;
    }).join("");

    dotsEl.querySelectorAll(".dot").forEach(btn => {
      const idx = Number(btn.dataset.step);
      btn.addEventListener("click", () => {
        this._hideStepTip();
        this.jumpAndPlaySingleStep(idx);
      });
      btn.addEventListener("mouseenter", () => this._showStepTip(btn, idx));
      btn.addEventListener("mouseleave", () => this._hideStepTip());
    });

    if (lblEl) {
      const curDisp = this.stepIdx < 0 ? 0 : this.stepIdx + 1;
      const zh = I18N.stepOf.zh.replaceAll("{a}", String(curDisp)).replaceAll("{b}", String(sc.steps.length));
      const en = I18N.stepOf.en.replaceAll("{a}", String(curDisp)).replaceAll("{b}", String(sc.steps.length));
      lblEl.innerHTML = this.lang === "bi" ? `${esc(zh)} · ${esc(en)}` : this.lang === "en" ? esc(en) : esc(zh);
    }
    this._layoutStepbar();
  },

  _layoutStepbar() {
    const bar = document.getElementById("stepbar");
    const dotsEl = document.getElementById("stepDots");
    const cueEl = bar?.querySelector(".step-cue");
    const lblEl = document.getElementById("stepLabel");
    if (!bar || !dotsEl || !cueEl || !lblEl) return;
    const n = dotsEl.children.length;
    if (!n) return;
    const cs = getComputedStyle(bar);
    const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const gap = parseFloat(cs.columnGap || cs.gap) || 10;
    const innerW = bar.clientWidth - padX;
    if (innerW <= 0) return;

    const dotMin = document.documentElement.classList.contains("bp-h620") ? 7 : 8;
    const dotsGap = 4;
    const minDotsW = n * dotMin + Math.max(0, n - 1) * dotsGap;
    const availDotsW = innerW - cueEl.offsetWidth - lblEl.offsetWidth - 2 * gap;
    const stacked = availDotsW < minDotsW;
    bar.classList.toggle("stacked", stacked);

    const rowDotsW = stacked ? innerW : availDotsW;
    const perDot = (rowDotsW - Math.max(0, n - 1) * dotsGap) / n;
    bar.classList.toggle("balls", perDot <= 12);
  },

  _showStepTip(anchorEl, idx) {
    const sc = SCENARIOS[this.scnIdx];
    const st = sc?.steps[idx];
    const tip = document.getElementById("stepTip");
    if (!st || !tip) return;

    const numText = this.lang === "en"
      ? `${I18N.stepPrefix.en} ${idx + 1}/${sc.steps.length}`
      : this.lang === "zh"
        ? `${I18N.stepPrefix.zh} ${idx + 1}/${sc.steps.length}`
        : `${idx + 1}/${sc.steps.length}`;
    const sum = st.summary || st.label;

    tip.innerHTML = `<div class="st-top">
        <span class="st-num">${esc(numText)}</span>
        <span class="st-title">${this.biStack(st.label.zh, st.label.en)}</span>
      </div>
      <div class="st-desc">${this.biStack(sum.zh, sum.en)}</div>
      <div class="st-hint">▶ ${this.biStack(I18N.clickDemo.zh, I18N.clickDemo.en)}</div>`;

    tip.classList.add("on");
    const rect = anchorEl.getBoundingClientRect();
    const { z, w: vw, h: vh } = this._effViewport();
    const tipW = Math.min(356, vw - 24);
    let left = (rect.left / z) - 14;
    if (left + tipW > vw - 12) left = vw - tipW - 12;
    if (left < 12) left = 12;
    const tipH = tip.offsetHeight || 160;
    const top = Math.min(vh - tipH - 12, (rect.bottom / z) + 8);
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(12, top)}px`;
  },

  _hideStepTip() {
    document.getElementById("stepTip")?.classList.remove("on");
  },

  stopPlay() {
    this.runId++;
    this.playing = false;
    this.paused = false;
    if (this._activeCountdownCancel) {
      const fn = this._activeCountdownCancel;
      this._activeCountdownCancel = null;
      fn();
    }
    this._activeInteractiveWait = null;
    this._waitBranchRestore = null;
    this._branchPlayPause = null;
    this._clearWaitSpotlights();
    this._updatePlayBtn();
  },

  async _waitIfPaused(id) {
    while (this.paused && this.runId === id) {
      await sleep(80);
    }
    return this.runId === id;
  },

  async _sleepStep(ms, id) {
    let left = ms;
    let last = performance.now();
    while (left > 0) {
      if (this.runId !== id) return false;
      if (this.paused) {
        await sleep(80);
        last = performance.now();
        continue;
      }
      await sleep(Math.min(80, left));
      const now = performance.now();
      if (!this.paused) left -= Math.max(0, now - last);
      last = now;
    }
    return this.runId === id;
  },

  async playAll() {
    const sc = SCENARIOS[this.scnIdx];
    if (!sc) return;
    this.stopPlay();
    const id = ++this.runId;
    this.playing = true;
    this.paused = false;
    this._updatePlayBtn();

    const chat = document.getElementById("chat");
    chat.innerHTML = "";
    this.chatTimeline = [];
    this.branchSnapshots.clear();
    XRay.reset();

    for (let i = 0; i < sc.steps.length; i++) {
      if (this.runId !== id) return;
      this.stepIdx = i;
      this.renderStepDots();
      const res = await this._runStep(sc.steps[i], { id });
      if (res === "overflow" || this.runId !== id) return;
      if (i < sc.steps.length - 1) {
        if (!(await this._sleepStep(1200, id))) return;
      }
    }

    this.markCompleted(sc.id);
    this.playing = false;
    this.paused = false;
    this._updatePlayBtn();
  },

  async jumpAndPlaySingleStep(targetIdx) {
    const sc = SCENARIOS[this.scnIdx];
    if (!sc || targetIdx < 0 || targetIdx >= sc.steps.length) return;

    this.stopPlay();
    this._clearToolRestore();
    const id = ++this.runId;
    this.playing = true;
    this.paused = false;
    this._updatePlayBtn();

    const chat = document.getElementById("chat");
    chat.innerHTML = "";
    this.chatTimeline = [];
    this.branchSnapshots.clear();
    XRay.reset();

    for (let i = 0; i < targetIdx; i++) {
      this.stepIdx = i;
      this._runStepSync(sc.steps[i]);
    }

    if (targetIdx > 0) {
      const entry = { kind: "sep", count: targetIdx, cur: targetIdx + 1 };
      this.chatTimeline.push(entry);
      chat.appendChild(this._makeSepEl(entry));
    }

    this.stepIdx = targetIdx;
    this.renderStepDots();
    const res = await this._runStep(sc.steps[targetIdx], { id });

    if (res === "overflow" || this.runId !== id) return;
    if (targetIdx === sc.steps.length - 1) {
      this.markCompleted(sc.id);
    }
    this.playing = false;
    this.paused = false;
    this._updatePlayBtn();
  },

  markCompleted(scnId) {
    if (!this.completed.has(scnId)) {
      this.completed.add(scnId);
      localStorage.setItem("ax_done", JSON.stringify([...this.completed]));
      this.renderSidebar();
    }
  },

  /* ============================================================
     Timeline Re-rendering (Dynamic Language Switch & Branch Switch)
     ============================================================ */
  _rerenderChat() {
    const chat = document.getElementById("chat");
    if (!chat) return;
    this._clearToolRestore();
    if (!this.chatTimeline.length) {
      this._renderEmptyChat();
      return;
    }
    const wasAtBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 36;
    const prevTop = chat.scrollTop;
    chat.innerHTML = "";

    for (const item of this.chatTimeline) {
      const el = this._renderTimelineItem(item);
      if (el) chat.appendChild(el);
    }

    if (wasAtBottom) {
      chat.scrollTop = chat.scrollHeight;
    } else {
      chat.scrollTop = prevTop;
    }
  },

  _renderTimelineItem(item) {
    if (item.kind === "sep") {
      return this._makeSepEl(item);
    }
    if (item.kind === "customUser") {
      return this._makeUserMsg(item.zh || item.text, item.en || item.text, true, item);
    }
    if (item.kind === "customReply") {
      const el = this._makeAssistantMsg(item.zh, item.en, item);
      el.querySelector(".body").innerHTML = this.biHTML(item.zh, item.en);
      return el;
    }
    if (item.kind === "httpErr") {
      return this._makeHttpErrorLine(item);
    }
    if (item.kind === "customError") {
      return this._makeErrorCard(item);
    }
    if (item.kind === "beat") {
      return this._buildBeatDomSync(item.b, item.state);
    }
    return null;
  },

  _makeSepEl(item) {
    const sep = document.createElement("div");
    sep.className = "httpline";
    sep.style.justifyContent = "center";
    sep.style.color = "var(--muted)";
    const zh = I18N.prefillSep.zh.replaceAll("{n}", String(item.count)).replaceAll("{cur}", String(item.cur));
    const en = I18N.prefillSep.en.replaceAll("{n}", String(item.count)).replaceAll("{cur}", String(item.cur));
    sep.innerHTML = this.biStack(zh, en);
    return sep;
  },

  _buildBeatDomSync(b, st = {}) {
    if (b.t === "user") {
      const el = this._makeUserMsg(b.zh, b.en, false, st._item);
      if (st._rebindTypeTarget) st._rebindTypeTarget(el.querySelector(".bubble"));
      return el;
    }
    if (b.t === "think") {
      return this._makeThinkEl(b.zh, b.en);
    }
    if (b.t === "say") {
      const el = this._makeAssistantMsg(b.zh, b.en, st._item);
      const body = el.querySelector(".body");
      if (st._rebindTypeTarget) {
        st._rebindTypeTarget(body);
      } else {
        body.innerHTML = this.biHTML(b.zh, b.en);
      }
      return el;
    }
    if (b.t === "tool") {
      return this._makeToolCard(b, { done: true, open: Boolean(st.open), focusJson: false, stateRef: st });
    }
    if (b.t === "note") {
      return this._makeNote(b);
    }
    if (b.t === "code") {
      return this._makeCodeCard(b);
    }
    if (b.t === "http") {
      return this._makeHttpLine(b);
    }
    if (b.t === "perm") {
      const el = this._makePermCard(b, { resolved: st.resolved !== false, stateRef: st });
      if (st._livePrompt && st.resolved === false) st._livePrompt.rebind(el);
      return el;
    }
    if (b.t === "wait") {
      const el = this._makeInteractCard(b, { stateRef: st });
      if (st._livePrompt && st.resolved === false) st._livePrompt.rebind(el);
      return el;
    }
    if (b.t === "sub") {
      return this._makeSubCard(b);
    }
    if (b.t === "compact") {
      return this._makeCompactCard(b, { done: true });
    }
    if (b.t === "mcp") {
      return this._makeMcpCard(b, { focusJson: false });
    }
    if (b.t === "mem") {
      return this._makeMemCard(b);
    }
    if (b.t === "done") {
      return this._makeDoneCard(b);
    }
    return null;
  },

  /* ============================================================
     Beat Renderers (Synchronous Prefill vs Live Animated Play)
     ============================================================ */
  _runStepSync(step) {
    for (const b of step.beats) {
      this._renderBeatSync(b);
    }
    this._updateComposerChips();
  },

  _renderBeatSync(b) {
    const chat = document.getElementById("chat");
    if (b.t === "xr") {
      XRay.applyPatch(b.patch, { silent: true });
      return;
    }
    if (b.t === "sse") {
      XRay.beginSSE({ silent: true });
      (b.frames || []).forEach(f => XRay.pushSSEFrame(f, { silent: true }));
      if (b.focus) XRay.applyPatch({ focus: b.focus }, { silent: true, silentTab: true });
      return;
    }
    if (b.t === "wait") {
      return;
    }
    const item = { kind: "beat", b, state: { open: false, resolved: true, resolvedChoice: b.choice || "allow" } };
    item.state._item = item;
    this.chatTimeline.push(item);
    const el = this._buildBeatDomSync(b, item.state);
    if (el) chat.appendChild(el);
  },

  _flashXrayTab() {
    const activeTab = document.querySelector("#xrayTabs .tab.on");
    if (!activeTab) return;
    activeTab.classList.remove("xray-tab-flash");
    void activeTab.offsetWidth;
    activeTab.classList.add("xray-tab-flash");
  },

  async _runStep(step, { id }) {
    const chat = document.getElementById("chat");
    for (const b of step.beats) {
      if (!(await this._waitIfPaused(id))) return;

      if (b.t === "xr") {
        const prevTab = XRay.tab;
        XRay.applyPatch(b.patch);
        this._updateComposerChips();
        const tabChanged = Boolean(b.patch?.tab && b.patch.tab !== prevTab);
        if (tabChanged) this._flashXrayTab();
        if (!(await this._sleepStep(tabChanged ? 1250 : 950, id))) return;
        continue;
      }

      if (b.t === "sse") {
        const curTot = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
        const curBud = XRay.state.context?.budget || this.sandbox.contextBudget || 1000000;
        if (curTot > curBud) {
          this._emitContextOverflowError(curTot, curBud);
          this.playing = false;
          this.paused = false;
          this._updatePlayBtn();
          return "overflow";
        }
        XRay.beginSSE();
        if (b.focus) XRay.focusKey = b.focus;
        const frames = b.frames || [];
        for (const f of frames) {
          if (!(await this._waitIfPaused(id))) return;
          XRay.pushSSEFrame(f);
          if (!(await this._sleepStep(Math.round((f.ms || 160) * 2.1), id))) return;
        }
        this._updateComposerChips();
        if (!(await this._sleepStep(750, id))) return;
        continue;
      }

      const st = {
        open: b.t === "tool",
        resolved: b.t !== "perm" && b.t !== "wait",
        resolvedChoice: b.choice || "allow",
        timedOut: false,
        seconds: b.seconds || 10
      };
      const item = { kind: "beat", b, state: st };
      st._item = item;
      this.chatTimeline.push(item);

      if (b.t === "user") {
        const el = this._makeUserMsg("", "", false, item);
        const bubble = el.querySelector(".bubble");
        chat.appendChild(el);
        this._scrollChat();
        await this._typewriteUser(bubble, b.zh, b.en, id, st);
        if (!(await this._sleepStep(650, id))) return;
      } else if (b.t === "think") {
        const el = this._makeThinkEl(b.zh, b.en);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(950, id))) return;
      } else if (b.t === "say") {
        const curTot = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
        const curBud = XRay.state.context?.budget || this.sandbox.contextBudget || 1000000;
        if (curTot > curBud) {
          this.chatTimeline.pop();
          this._emitContextOverflowError(curTot, curBud);
          this.playing = false;
          this.paused = false;
          this._updatePlayBtn();
          return "overflow";
        }
        const el = this._makeAssistantMsg(b.zh, b.en, item);
        const body = el.querySelector(".body");
        chat.appendChild(el);
        this._scrollChat();
        await this._typewrite(body, b.zh, b.en, id, st);
        if (!(await this._sleepStep(450, id))) return;
      } else if (b.t === "tool") {
        const curTot = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
        const curBud = XRay.state.context?.budget || this.sandbox.contextBudget || 1000000;
        if (curTot > curBud) {
          this.chatTimeline.pop();
          this._emitContextOverflowError(curTot, curBud);
          this.playing = false;
          this.paused = false;
          this._updatePlayBtn();
          return "overflow";
        }
        const card = this._makeToolCard(b, { done: false, open: true, focusJson: true, stateRef: st });
        chat.appendChild(card);
        this._scrollToEl(card);
        if (!(await this._sleepStep(Math.min(1800, Math.max(850, (b.ms || 400) * 1.15)), id))) return;
        this._finishToolCard(card, b);
        this._scrollToEl(card.querySelector(".kv.focus-hl") || card);
        if (!(await this._sleepStep(900, id))) return;
      } else if (b.t === "note") {
        const el = this._makeNote(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(850, id))) return;
      } else if (b.t === "code") {
        const el = this._makeCodeCard(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(950, id))) return;
      } else if (b.t === "http") {
        const el = this._makeHttpLine(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(700, id))) return;
      } else if (b.t === "perm") {
        const el = this._makePermCard(b, { resolved: false, stateRef: st });
        st._cardEl = el;
        chat.appendChild(el);
        this._scrollChat();
        const res = await this._waitPermWithRing(el, b, st, id);
        if (this.runId !== id) return;
        const curEl = st._cardEl || el;
        this._resolvePermCard(curEl, b, res.choice, st, res.timedOut);
        if (!(await this._sleepStep(850, id))) return;
      } else if (b.t === "wait") {
        const el = this._makeInteractCard(b, { stateRef: st });
        st._cardEl = el;
        chat.appendChild(el);
        this._scrollChat();
        const outcome = await this._waitInteractWithRing(el, b, st, id);
        if (this.runId !== id) return;
        const curEl = st._cardEl || el;
        this._resolveInteractCard(curEl, b, outcome, st);
        if (!(await this._sleepStep(outcome === "done" ? (this._waitBranchRestore ? 1800 : 1150) : 700, id))) return;
        this._restoreWaitBranchIfNeeded();
      } else if (b.t === "sub") {
        const el = this._makeSubCard(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(1050, id))) return;
      } else if (b.t === "compact") {
        const el = this._makeCompactCard(b, { done: false });
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(120, id))) return;
        const bar = el.querySelector(".bar i");
        if (bar) bar.style.width = `${Math.max(4, Math.round((b.to / b.from) * 100))}%`;
        if (!(await this._sleepStep(1100, id))) return;
      } else if (b.t === "mcp") {
        const el = this._makeMcpCard(b, { focusJson: true });
        chat.appendChild(el);
        this._scrollToEl(el);
        if (!(await this._sleepStep(1000, id))) return;
      } else if (b.t === "mem") {
        const el = this._makeMemCard(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(950, id))) return;
      } else if (b.t === "done") {
        this.markCompleted(SCENARIOS[this.scnIdx].id);
        const el = this._makeDoneCard(b);
        chat.appendChild(el);
        this._scrollChat();
        if (!(await this._sleepStep(400, id))) return;
      }
      this._updateComposerChips();
    }
  },

  async _typewriteDual(targetEl, zh, en, id, stepsCap = 44, stepMs = 42, stateRef = null) {
    const startLang = this.lang;
    const srcZh = zh || "";
    const srcEn = en || "";
    const showBoth = startLang === "bi" && srcZh && srcEn && srcZh !== srcEn;

    if (showBoth) {
      const zhTokens = srcZh.split(/(\s+|(?<=[\u4e00-\u9fa5，。！？：；、]))/).filter(Boolean);
      const enTokens = srcEn.split(/(\s+)/).filter(Boolean);
      const spanZh = document.createElement("span");
      spanZh.className = "bi-zh cursor";
      const spanEn = document.createElement("span");
      spanEn.className = "bi-en cursor";
      targetEl.innerHTML = "";
      targetEl.appendChild(spanZh);
      targetEl.appendChild(spanEn);
      if (stateRef) {
        stateRef._rebindTypeTarget = (newEl) => {
          targetEl = newEl;
          targetEl.innerHTML = "";
          targetEl.appendChild(spanZh);
          targetEl.appendChild(spanEn);
        };
      }

      const fmtPart = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
      const totalSteps = Math.max(1, Math.min(stepsCap, Math.max(zhTokens.length, enTokens.length)));
      for (let s = 1; s <= totalSteps; s++) {
        if (!(await this._waitIfPaused(id))) {
          if (stateRef) stateRef._rebindTypeTarget = null;
          return;
        }
        if (this.lang !== startLang) {
          if (stateRef) stateRef._rebindTypeTarget = null;
          return;
        }
        const frac = s / totalSteps;
        const zEnd = Math.min(zhTokens.length, Math.ceil(zhTokens.length * frac));
        const eEnd = Math.min(enTokens.length, Math.ceil(enTokens.length * frac));
        spanZh.innerHTML = fmtPart(zhTokens.slice(0, zEnd).join(""));
        spanEn.innerHTML = fmtPart(enTokens.slice(0, eEnd).join(""));
        this._scrollChat();
        if (!(await this._sleepStep(stepMs, id))) {
          if (stateRef) stateRef._rebindTypeTarget = null;
          return;
        }
      }
      if (stateRef) stateRef._rebindTypeTarget = null;
      spanZh.classList.remove("cursor");
      spanEn.classList.remove("cursor");
      targetEl.innerHTML = this.biHTML(zh, en);
      this._scrollChat();
      return;
    }

    const textMain = startLang === "en" ? (srcEn || srcZh) : srcZh;
    const words = textMain.split(/(\s+|(?<=[\u4e00-\u9fa5，。！？：；、]))/).filter(Boolean);
    const spanMain = document.createElement("span");
    spanMain.className = (startLang === "en" ? "bi-en" : "bi-zh") + " cursor";
    targetEl.innerHTML = "";
    targetEl.appendChild(spanMain);
    if (stateRef) {
      stateRef._rebindTypeTarget = (newEl) => {
        targetEl = newEl;
        targetEl.innerHTML = "";
        targetEl.appendChild(spanMain);
      };
    }

    let acc = "";
    const stepSize = Math.max(1, Math.ceil(words.length / stepsCap));
    for (let i = 0; i < words.length; i += stepSize) {
      if (!(await this._waitIfPaused(id))) {
        if (stateRef) stateRef._rebindTypeTarget = null;
        return;
      }
      if (this.lang !== startLang) {
        if (stateRef) stateRef._rebindTypeTarget = null;
        return;
      }
      acc += words.slice(i, i + stepSize).join("");
      spanMain.innerHTML = esc(acc).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
      this._scrollChat();
      if (!(await this._sleepStep(stepMs, id))) {
        if (stateRef) stateRef._rebindTypeTarget = null;
        return;
      }
    }
    if (stateRef) stateRef._rebindTypeTarget = null;
    spanMain.classList.remove("cursor");
    targetEl.innerHTML = this.biHTML(zh, en);
    this._scrollChat();
  },

  async _typewriteUser(bubbleEl, zh, en, id, stateRef = null) {
    return this._typewriteDual(bubbleEl, zh, en, id, 18, 44, stateRef);
  },

  async _typewrite(bodyEl, zh, en, id, stateRef = null) {
    return this._typewriteDual(bodyEl, zh, en, id, 44, 42, stateRef);
  },

  _scrollChat() {
    const chat = document.getElementById("chat");
    if (chat) chat.scrollTop = chat.scrollHeight;
  },

  _scrollToEl(el) {
    if (!el) return;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  },

  /* ============================================================
     DOM Factories for Console Beats
     ============================================================ */
  _makeUserMsg(zh, en, isCustom) {
    const wrap = document.createElement("div");
    wrap.className = `msg user${isCustom ? " custom" : ""}`;
    wrap.innerHTML = `<div class="who">you</div>
      <div class="bubble">
        ${this.biHTML(zh, en)}
      </div>`;
    return wrap;
  },

  _makeThinkEl(zh, en) {
    const el = document.createElement("div");
    el.className = "think";
    el.innerHTML = `<span class="lbl">${this.tPair("thinking")}</span>${this.biHTML(zh, en)}`;
    return el;
  },

  _makeAssistantMsg(zh = "", en = "", timelineItem = null) {
    const el = document.createElement("div");
    el.className = "msg assistant";
    el.innerHTML = `<div class="who"><svg class="ic"><use href="#i-robot"/></svg></div>
      <div class="body-wrap">
        <div class="ai-head">
          <span class="ai-tag">agent</span>
          <button class="fork" type="button"><svg class="ic" style="width:12px;height:12px"><use href="#i-fork"/></svg><span>${this.tPair("forkBtn")}</span></button>
        </div>
        <div class="body"></div>
      </div>`;
    el.querySelector(".fork").addEventListener("click", () => this.forkFromMessage(el, zh, en, timelineItem));
    return el;
  },

  _clearToolRestore() {
    if (this._toolScrollSyncRaf) {
      cancelAnimationFrame(this._toolScrollSyncRaf);
      this._toolScrollSyncRaf = 0;
    }
    this._toolRestore = null;
    this._ignoreChatScrollUntil = 0;
  },

  _bindChatScrollGuard(chat) {
    if (!chat || chat._scrollGuardBound) return;
    chat._scrollGuardBound = true;
    const dropOnInput = () => this._clearToolRestore();
    chat.addEventListener("wheel", dropOnInput, { passive: true });
    chat.addEventListener("touchstart", dropOnInput, { passive: true });
    chat.addEventListener("touchmove", dropOnInput, { passive: true });
    chat.addEventListener("mousedown", (e) => {
      if (e.target === chat) dropOnInput();
    });
    chat.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        dropOnInput();
      }
    });
    chat.addEventListener("scroll", () => {
      if (this._toolScrollSyncRaf) return;
      if (!this._toolRestore) return;
      const now = performance.now();
      if (now <= (this._ignoreChatScrollUntil || 0)) {
        const maxTop = Math.max(0, chat.scrollHeight - chat.clientHeight);
        const expected = Math.min(this._toolRestore.chatTop, maxTop);
        if (Math.abs(chat.scrollTop - expected) <= 4) return;
      }
      this._clearToolRestore();
    }, { passive: true });
  },

  _syncChatScrollDuringExpand(card, restore) {
    const chat = document.getElementById("chat");
    if (!chat || !restore) return;
    if (this._toolScrollSyncRaf) cancelAnimationFrame(this._toolScrollSyncRaf);
    const wrap = card.querySelector(".tool-body-wrap");
    const pres = [...card.querySelectorAll("pre")];
    const applyPres = () => {
      pres.forEach((p, idx) => {
        if (restore.preTops[idx] != null) p.scrollTop = restore.preTops[idx];
      });
    };
    applyPres();
    const start = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this._toolScrollSyncRaf = 0;
      if (wrap) wrap.removeEventListener("transitionend", onEnd);
      const maxTop = Math.max(0, chat.scrollHeight - chat.clientHeight);
      chat.scrollTo({ top: Math.min(restore.chatTop, maxTop), behavior: "instant" });
      applyPres();
      this._ignoreChatScrollUntil = performance.now() + 60;
    };
    const onEnd = (e) => {
      if (e.target === wrap && e.propertyName === "grid-template-rows") finish();
    };
    if (wrap) wrap.addEventListener("transitionend", onEnd);
    const tick = () => {
      if (done || !card.isConnected || !card.classList.contains("open")) {
        this._toolScrollSyncRaf = 0;
        if (wrap) wrap.removeEventListener("transitionend", onEnd);
        return;
      }
      const maxTop = Math.max(0, chat.scrollHeight - chat.clientHeight);
      chat.scrollTo({ top: Math.min(restore.chatTop, maxTop), behavior: "instant" });
      applyPres();
      if (performance.now() - start >= 340) {
        finish();
        return;
      }
      this._toolScrollSyncRaf = requestAnimationFrame(tick);
    };
    this._toolScrollSyncRaf = requestAnimationFrame(tick);
  },

  _makeToolCard(b, { done, open, focusJson, stateRef }) {
    const card = document.createElement("div");
    card.className = `tool${open ? " open" : ""}`;
    const iconId = b.kind === "bash" ? "i-terminal" : b.kind === "mcp" ? "i-mcp" : b.kind === "task" ? "i-subagent" : "i-file";
    const statusHtml = done
      ? `<svg class="okmark ic"><use href="#i-check"/></svg><span>${b.ms || 0} ms</span>`
      : `<span class="spin"></span><span>${this.tPair("running")}</span>`;

    const en = this.lang === "en";
    const argVal = en ? (b.argEn || b.arg || "") : (b.arg || "");
    const inputVal = en ? (b.inputEn || b.input || "{}") : (b.input || "{}");
    const outputVal = en ? (b.outputEn || b.output || "") : (b.output || "");
    const isOutJson = /^[\s]*[\{\[]/.test(outputVal);
    const hlIn = focusJson ? " focus-hl" : "";
    const hlOut = focusJson && isOutJson ? " focus-hl" : "";

    card.innerHTML = `<div class="tool-head">
        <div class="tool-ic"><svg class="ic"><use href="#${iconId}"/></svg></div>
        <span class="tool-name">${esc(b.name)}</span>
        <span class="tool-arg">${esc(argVal)}</span>
        <div class="tool-meta">${statusHtml}<svg class="chev ic"><use href="#i-chevron"/></svg></div>
      </div>
      <div class="tool-body-wrap">
        <div class="tool-body-inner">
          <div class="tool-body">
            <div class="kv${hlIn}"><span class="k">${this.tStack("inputLbl")}</span><pre>${esc(inputVal)}</pre></div>
            <div class="kv kv-out${hlOut}" style="${done ? "" : "display:none"}"><span class="k">${this.tStack("outputLbl")}</span><pre>${esc(outputVal)}</pre></div>
            ${b.note ? `<div class="note info" style="margin:9px 0 0"><svg class="ic"><use href="#i-info"/></svg><div>${this.biHTML(b.note.zh, b.note.en)}</div></div>` : ""}
          </div>
        </div>
      </div>`;

    card.querySelector(".tool-head").addEventListener("click", () => {
      const chat = document.getElementById("chat");
      const wasOpen = card.classList.contains("open");
      if (wasOpen) {
        const saved = {
          card,
          stateRef,
          chatTop: chat ? chat.scrollTop : 0,
          preTops: [...card.querySelectorAll("pre")].map(p => p.scrollTop)
        };
        this._clearToolRestore();
        this._toolRestore = saved;
        this._ignoreChatScrollUntil = performance.now() + 380;
        card.classList.remove("open");
        if (stateRef) stateRef.open = false;
      } else {
        const restore = (this._toolRestore && this._toolRestore.card === card) ? this._toolRestore : null;
        this._clearToolRestore();
        card.classList.add("open");
        if (stateRef) stateRef.open = true;
        if (restore) this._syncChatScrollDuringExpand(card, restore);
      }
    });
    return card;
  },

  _finishToolCard(card, b) {
    const meta = card.querySelector(".tool-meta");
    if (meta) meta.innerHTML = `<svg class="okmark ic"><use href="#i-check"/></svg><span>${b.ms || 0} ms</span><svg class="chev ic"><use href="#i-chevron"/></svg>`;
    const outKv = card.querySelector(".kv-out");
    if (outKv) outKv.style.display = "grid";
  },

  _makeNote(b) {
    const el = document.createElement("div");
    el.className = `note ${b.kind || "info"}`;
    const ic = b.kind === "warn" ? "i-warn" : b.kind === "key" ? "i-zap" : "i-bulb";
    el.innerHTML = `<svg class="ic"><use href="#${ic}"/></svg><div>${this.biHTML(b.zh, b.en)}</div>`;
    return el;
  },

  _makeCodeCard(b) {
    const el = document.createElement("div");
    el.className = "codecard";
    const [tZh, tEn] = (b.title || "").split("|");
    const codeStr = this.lang === "en" ? (b.codeEn || b.code || "") : (b.code || "");
    const lblCopy = this.biPairText(I18N.copy.zh, I18N.copy.en);
    const lblCopied = this.biPairText(I18N.copied.zh, I18N.copied.en);
    el.innerHTML = `<div class="code-head">
        <span class="lang">${esc(b.lang || "ts")}</span>
        <span class="ttl">${this.biInline(tZh, tEn)}</span>
        <button class="copybtn" type="button" title="${esc(lblCopy)}" aria-label="${esc(lblCopy)}">
          <span class="cp-ic">
            <svg class="ic ic-copy"><use href="#i-copy"/></svg>
            <svg class="ic ic-ok"><use href="#i-check"/></svg>
          </span>
        </button>
      </div>
      <pre>${highlightCode(codeStr)}</pre>`;
    const btn = el.querySelector(".copybtn");
    btn.addEventListener("click", async () => {
      const ok = await copyTextSafe(codeStr);
      if (ok) {
        clearTimeout(btn._cpTimer);
        btn.classList.add("copied");
        btn.title = lblCopied;
        btn.setAttribute("aria-label", lblCopied);
        btn._cpTimer = setTimeout(() => {
          btn.classList.remove("copied");
          btn.title = lblCopy;
          btn.setAttribute("aria-label", lblCopy);
        }, 2000);
      }
    });
    return el;
  },

  _makeHttpLine(b) {
    const el = document.createElement("div");
    el.className = "httpline";
    el.innerHTML = `<span class="method">${esc(b.method)}</span><span class="url">${esc(b.url)}</span><span class="status">${esc(b.status)}</span><span class="ms">${esc(b.ms)}</span>`;
    return el;
  },

  _ringHtml(seconds = 10, variant = "perm") {
    return `<div class="ring-cd${variant === "xray" ? " xray" : ""}" aria-live="polite">
      <svg class="ring-svg" viewBox="0 0 28 28" aria-hidden="true">
        <circle class="ring-track" cx="14" cy="14" r="11"/>
        <circle class="ring-prog" cx="14" cy="14" r="11"/>
      </svg>
      <span class="ring-num">${seconds}</span>
    </div>`;
  },

  _waitCountdownWithRing({ totalMs = 10000, id, variant = "perm", pauseOnModal = false, getEl }) {
    const circ = 2 * Math.PI * 11;
    let remainingMs = totalMs;
    let lastTs = performance.now();
    let settled = false;
    let rafId = 0;
    let resolver = null;

    const finish = (res) => {
      if (settled) return;
      settled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (this._activeCountdownCancel === cancelFn) {
        this._activeCountdownCancel = null;
      }
      if (resolver) resolver(res);
    };
    const cancelFn = () => finish(null);
    this._activeCountdownCancel = cancelFn;

    const updateDom = () => {
      const card = getEl ? getEl() : null;
      const ring = card?.querySelector(".ring-cd");
      if (!ring) return;
      const prog = ring.querySelector(".ring-prog");
      const num = ring.querySelector(".ring-num");
      const frac = Math.max(0, Math.min(1, remainingMs / totalMs));
      const sec = Math.max(0, Math.ceil(remainingMs / 1000));
      if (prog) prog.style.strokeDashoffset = (circ * (1 - frac)).toFixed(2);
      if (num) num.textContent = String(sec);
      if (variant === "perm") ring.classList.toggle("urgent", sec <= 3);
      const modalOpen = pauseOnModal && (document.getElementById("modalRoot")?.children.length > 0);
      ring.classList.toggle("paused", Boolean(this.paused || modalOpen));
    };

    const promise = new Promise((resolve) => {
      resolver = resolve;
      const tick = (now) => {
        if (settled) return;
        if (this.runId !== id) {
          finish(null);
          return;
        }
        const modalOpen = pauseOnModal && (document.getElementById("modalRoot")?.children.length > 0);
        if (this.paused || modalOpen) {
          lastTs = now;
        } else {
          const dt = Math.min(250, Math.max(0, now - lastTs));
          remainingMs = Math.max(0, remainingMs - dt);
          lastTs = now;
        }
        updateDom();
        if (remainingMs <= 0) {
          finish({ timedOut: true });
          return;
        }
        rafId = requestAnimationFrame(tick);
      };
      updateDom();
      rafId = requestAnimationFrame(tick);
    });

    return {
      promise,
      resolve: (val) => finish(val),
      syncDom: updateDom
    };
  },

  _makePermCard(b, { resolved, stateRef }) {
    const el = document.createElement("div");
    el.className = "perm";
    const sec = stateRef?.seconds || 10;
    el.innerHTML = `<div class="perm-title"><svg class="ic"><use href="#i-shield"/></svg><span>${this.tPair("permTitle")}</span><span class="tag" style="margin-left:auto">${this.biInline(b.risk.zh, b.risk.en)}</span></div>
      <div class="perm-cmd">${esc(b.cmd)}</div>
      <div class="perm-actions">
        <button class="btn primary" data-act="allow">${this.tPair("allowBtn")}</button>
        <button class="btn ghost" data-act="deny">${this.tPair("denyBtn")}</button>
        <div class="ring-wait-wrap">
          ${this._ringHtml(sec, "perm")}
          <span class="ring-hint">${this.tPair("permWaiting")}</span>
        </div>
      </div>`;
    el.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        if (stateRef?._livePrompt && !stateRef.resolved) {
          stateRef._livePrompt.resolve({ choice: btn.dataset.act, timedOut: false });
        } else {
          this._resolvePermCard(el, b, btn.dataset.act, stateRef, false);
        }
      });
    });
    if (resolved) {
      this._resolvePermCard(el, b, stateRef?.resolvedChoice || b.choice || "allow", stateRef, Boolean(stateRef?.timedOut));
    }
    return el;
  },

  _resolvePermCard(el, b, choice, stateRef, timedOut = false) {
    if (stateRef) {
      stateRef.resolved = true;
      stateRef.resolvedChoice = choice;
      stateRef.timedOut = Boolean(timedOut);
      stateRef._livePrompt = null;
    }
    const act = el?.querySelector(".perm-actions");
    if (!act) return;
    const isAllow = choice === "allow";
    const obj = isAllow ? b.allow : b.deny;
    act.innerHTML = `<span class="tag ${isAllow ? "grn" : "red"}">${this.biInline(obj.zh, obj.en)}</span>${
      timedOut ? `<span class="tag red">${this.tPair("permTimedOut")}</span>` : ""
    }`;
  },

  async _waitPermWithRing(el, b, stateRef, id) {
    const totalMs = (b.seconds || 10) * 1000;
    const live = {
      el,
      resolve: null,
      rebind: (newEl) => {
        live.el = newEl;
        stateRef._cardEl = newEl;
        cd.syncDom();
      }
    };
    stateRef._cardEl = el;
    stateRef._livePrompt = live;
    const cd = this._waitCountdownWithRing({
      totalMs,
      id,
      variant: "perm",
      pauseOnModal: false,
      getEl: () => live.el
    });
    live.resolve = (res) => cd.resolve(res);
    const res = await cd.promise;
    stateRef._livePrompt = null;
    if (!res) return { choice: "deny", timedOut: false };
    if (res.timedOut) return { choice: "deny", timedOut: true };
    return { choice: res.choice || "deny", timedOut: false };
  },

  _makeInteractCard(b, { stateRef }) {
    const el = document.createElement("div");
    el.className = "interact-card";
    const sec = stateRef?.seconds || 10;
    const titleKey = b.kind === "sandbox" ? "interactSandboxTitle" : "interactTitle";
    const icId = b.kind === "sandbox" ? "i-gear" : "i-spark";
    const needOpenXray = b.kind !== "sandbox" && !this.xrayOpen;
    el.innerHTML = `<div class="interact-head"><svg class="ic"><use href="#${icId}"/></svg><span>${this.tPair(titleKey)}</span></div>
      <div class="interact-desc">${this.biStack(b.zh, b.en)}</div>
      <div class="interact-actions">
        <div class="ring-wait-wrap">
          ${this._ringHtml(sec, "xray")}
          <span class="ring-hint">${this.tPair("interactWaiting")}</span>
        </div>
        ${needOpenXray ? `<button class="btn primary" data-open-xray>${this.tPair("interactOpenXray")}</button>` : ""}
        <button class="btn ghost" data-skip>${this.tPair("interactSkip")}</button>
      </div>`;
    el.querySelector("[data-open-xray]")?.addEventListener("click", () => {
      if (!this.xrayOpen) {
        if (this._effViewport().w <= 1040) this.sideOpen = false;
        this.xrayOpen = true;
        localStorage.setItem("ax_xray_open", "1");
        this.applySidebars(true);
      }
      el.querySelector("[data-open-xray]")?.remove();
    });
    el.querySelector("[data-skip]")?.addEventListener("click", () => {
      if (stateRef?._livePrompt && !stateRef.resolved) {
        stateRef._livePrompt.resolve("skip");
      }
    });
    if (stateRef?.resolved) {
      this._resolveInteractCard(el, b, stateRef.outcome || "timeout", stateRef);
    }
    return el;
  },

  _resolveInteractCard(el, b, outcome, stateRef) {
    if (stateRef) {
      stateRef.resolved = true;
      stateRef.outcome = outcome;
      stateRef._livePrompt = null;
    }
    const act = el?.querySelector(".interact-actions");
    if (!act) return;
    if (outcome === "done") {
      act.innerHTML = `<span class="tag grn">${this.tPair("interactDone")}</span>`;
    } else if (outcome === "skip") {
      act.innerHTML = `<span class="tag">${this.tPair("interactSkip")}</span>`;
    } else {
      act.innerHTML = `<span class="tag">${this.tPair("interactTimeout")}</span>`;
    }
  },

  _clearWaitSpotlights() {
    document.getElementById("xrayPanel")?.classList.remove("xray-wait-spotlight");
    document.getElementById("sandboxBtn")?.classList.remove("xray-wait-spotlight");
  },

  _applyWaitSpotlights(b) {
    this._clearWaitSpotlights();
    if (b.kind === "sandbox") {
      document.getElementById("sandboxBtn")?.classList.add("xray-wait-spotlight");
      document.getElementById("xrayPanel")?.classList.add("xray-wait-spotlight");
    } else {
      document.getElementById("xrayPanel")?.classList.add("xray-wait-spotlight");
    }
  },

  async _waitInteractWithRing(el, b, stateRef, id) {
    const totalMs = (b.seconds || 10) * 1000;
    this._applyWaitSpotlights(b);
    const live = {
      el,
      resolve: null,
      rebind: (newEl) => {
        live.el = newEl;
        stateRef._cardEl = newEl;
        cd.syncDom();
      }
    };
    stateRef._cardEl = el;
    stateRef._livePrompt = live;
    const cd = this._waitCountdownWithRing({
      totalMs,
      id,
      variant: "xray",
      pauseOnModal: b.kind === "sandbox",
      getEl: () => live.el
    });
    const expect = b.expect || b.kind || "xray";
    const complete = (outcome) => cd.resolve(outcome);
    live.resolve = complete;
    this._activeInteractiveWait = { expect, complete };
    const res = await cd.promise;
    if (this._activeInteractiveWait?.complete === complete) {
      this._activeInteractiveWait = null;
    }
    stateRef._livePrompt = null;
    this._clearWaitSpotlights();
    if (!res) return "skip";
    if (typeof res === "string") return res;
    if (res.timedOut) return "timeout";
    return "timeout";
  },

  _notifyInteractiveAction(kind, detail) {
    const w = this._activeInteractiveWait;
    if (!w) return;
    const exp = w.expect;
    let matched = false;
    if (exp === "xray-req") {
      matched = (kind === "field" && detail?.tab === "request") || kind === "reqview" || (kind === "copy" && detail === "req");
    } else if (exp === "xray-res") {
      matched = kind === "resview" || (kind === "field" && detail?.tab === "response") || (kind === "copy" && detail === "res");
    } else if (exp === "xray-tree") {
      matched = kind === "tree-node" || kind === "tree-nav";
    } else if (exp === "sandbox") {
      matched = (kind === "sandbox" && detail === "closed") || (kind === "tab" && detail === "context");
    } else {
      matched = true;
    }
    if (matched) w.complete("done");
  },

  _restoreWaitBranchIfNeeded() {
    const snap = this._waitBranchRestore;
    if (!snap) return;
    this._waitBranchRestore = null;
    this.chatTimeline = this._restoreTimelineStates(snap.timeline || []);
    for (const it of this.chatTimeline) {
      if (it.kind === "beat" && it.b?.t === "wait" && it.state && !it.state.resolved) {
        it.state.resolved = true;
        it.state.outcome = "done";
      }
    }
    const patch = {};
    if (snap.tree) patch.tree = snap.tree;
    if (snap.rawRequest) patch.request = snap.rawRequest;
    if (snap.context) patch.context = snap.context;
    if (snap.flow) patch.flow = snap.flow;
    XRay.applyPatch(patch, { silentTab: true });
    this._rerenderChat();
    this._updateComposerChips();
  },

  _makeSubCard(b) {
    const el = document.createElement("div");
    el.className = "sub";
    el.innerHTML = `<div style="display:flex;align-items:flex-start;gap:7px;font-weight:600;font-size:13.5px">
        <svg class="ic" style="color:var(--accent);margin-top:2px"><use href="#i-subagent"/></svg>
        <div>${this.biStack(b.task.zh, b.task.en)}</div>
      </div>
      <div class="sub-grid">
        <div class="sub-box parent">
          <h5>${this.tPair("subParent")}</h5>
          <div>${this.biStack(b.result.zh, b.result.en)}</div>
        </div>
        <div class="sub-box child">
          <h5>${this.tPair("subChild")}</h5>
          <div>${this.biStack(b.child.zh, b.child.en)}</div>
        </div>
      </div>
      <div class="sub-arrow">${this.biStack(I18N.subArrow.zh, I18N.subArrow.en)}</div>`;
    return el;
  },

  _makeCompactCard(b, { done }) {
    const el = document.createElement("div");
    el.className = "compact";
    const pct = Math.max(4, Math.round((b.to / b.from) * 100));
    el.innerHTML = `<div class="row">
        <span>${this.tPair("compactLbl")}</span>
        <span style="margin-left:auto"><span class="from">${(b.from / 1000).toFixed(0)}k</span> → <span class="to">${(b.to / 1000).toFixed(0)}k tok</span></span>
      </div>
      <div class="bar"><i style="width:${done ? pct : 100}%"></i></div>
      <p>${this.biStack(b.summary.zh, b.summary.en)}</p>`;
    return el;
  },

  _makeMcpCard(b, { focusJson }) {
    const el = document.createElement("div");
    el.className = `mcp${focusJson ? " focus-hl" : ""}`;
    el.innerHTML = (b.rows || []).map(r => {
      let pretty = r.json;
      try { pretty = JSON.stringify(JSON.parse(r.json), null, 2); } catch {}
      return `<div class="mcp-row">
        <span class="mcp-dir ${r.dir}">${r.dir === "req" ? this.tStack("mcpReq") : this.tStack("mcpRes")}</span>
        <div class="mcp-json">${esc(pretty)}</div>
      </div>`;
    }).join("");
    return el;
  },

  _makeMemCard(b) {
    const el = document.createElement("div");
    el.className = "mem";
    const lines = (this.lang === "en" && b.linesEn) ? b.linesEn : (b.lines || []);
    el.innerHTML = lines.map(l => `<div class="ln">
      <span class="p">${esc(l.p)}</span>
      <span class="${esc(l.cls || "")}">${esc(l.text || " ")}</span>
    </div>`).join("");
    return el;
  },

  _makeDoneCard(b) {
    const el = document.createElement("div");
    el.className = "done-card";
    const hasNext = this.scnIdx < SCENARIOS.length - 1;
    const statsHtml = Object.entries(b.stats || {}).map(([k, v]) => {
      const [zh, en] = k.split("|");
      return `<div><b>${esc(v)}</b><span>${this.biInline(zh, en)}</span></div>`;
    }).join("");
    el.innerHTML = `<h3>${this.biStack(I18N.doneTitle.zh, I18N.doneTitle.en)}</h3>
      <div class="stats">${statsHtml}</div>
      ${hasNext
        ? `<button class="btn primary" data-next>${this.tPair("doneNext")} <svg class="ic"><use href="#i-arrow"/></svg></button>`
        : `<p style="color:var(--green);font-weight:600">${this.biStack(I18N.doneAll.zh, I18N.doneAll.en)}</p>`
      }`;
    el.querySelector("[data-next]")?.addEventListener("click", () => {
      this.selectScenario(this.scnIdx + 1);
    });
    return el;
  },

  /* ============================================================
     Free-text Interactive Offline Chat + Dynamic Forking + Branch Switching
     ============================================================ */
  _cloneStateSnapshot() {
    return {
      timeline: JSON.parse(JSON.stringify(this.chatTimeline.map(({ state, ...rest }) => ({
        ...rest,
        state: state ? {
          open: Boolean(state.open),
          resolved: state.resolved !== false,
          resolvedChoice: state.resolvedChoice,
          timedOut: Boolean(state.timedOut),
          outcome: state.outcome || null
        } : undefined
      })))),
      rawRequest: this.stateRawCopy(XRay.state.rawRequest),
      context: this.stateRawCopy(XRay.state.context),
      flow: this.stateRawCopy(XRay.state.flow)
    };
  },

  stateRawCopy(v) {
    return v ? JSON.parse(JSON.stringify(v)) : null;
  },

  _restoreTimelineStates(items) {
    return items.map(it => {
      if (it.kind === "beat") {
        const st = {
          open: Boolean(it.state?.open),
          resolved: it.state?.resolved !== false,
          resolvedChoice: it.state?.resolvedChoice || it.b.choice || "allow",
          timedOut: Boolean(it.state?.timedOut),
          outcome: it.state?.outcome || null
        };
        const res = { kind: "beat", b: it.b, state: st };
        st._item = res;
        return res;
      }
      return { ...it };
    });
  },

  _makeHttpErrorLine(item) {
    const el = document.createElement("div");
    el.className = "httpline err";
    el.innerHTML = `<span class="method">${esc(item.method || "POST")}</span><span class="url">${esc(item.url || "/v1/messages")}</span><span class="status">${esc(item.status || "400 Bad Request")}</span><span class="ms">${esc(item.code || "context_length_exceeded")}</span>`;
    return el;
  },

  _makeErrorCard(item) {
    const el = document.createElement("div");
    el.className = "errcard";
    el.innerHTML = `<div class="errcard-head"><svg class="ic"><use href="#i-warn"/></svg><span>${this.biInline(item.titleZh, item.titleEn)}</span></div>
      <div class="errcard-body">${this.biStack(item.zh, item.en)}</div>
      <div class="errcard-meta">${esc(item.rawErr || "")}</div>`;
    return el;
  },

  _emitContextOverflowError(totalTok, budget) {
    const chat = document.getElementById("chat");
    const rawMsg = `prompt is too long: ${totalTok} tokens > ${budget} maximum`;
    XRay.applyPatch({
      flow: { active: ["client", "agent", "api"], edge: "e_agent_api", label: "POST /v1/messages → 400" }
    }, { silentTab: true });
    XRay.setErrorResponse({
      status: 400,
      type: "invalid_request_error",
      message: rawMsg
    });
    const httpItem = {
      kind: "httpErr",
      method: "POST",
      url: "/v1/messages",
      status: "400 Bad Request",
      code: "context_length_exceeded"
    };
    const errItem = {
      kind: "customError",
      titleZh: "上下文超限 · 请求被 API 拒绝 (400)",
      titleEn: "Context Overflow · Request Rejected (400)",
      zh: `模型 API 报错：当前总上下文约 ${totalTok.toLocaleString()} tokens，已超过窗口上限 ${budget.toLocaleString()} tokens。Agent 无法继续生成，请减少消息历史、精简 system/tools，或点「请求参数 / 重置」调高预算后重试。`,
      en: `Model API Error: total context (~${totalTok.toLocaleString()} tokens) exceeds the ${budget.toLocaleString()} token window. The agent cannot reply until you compact/reset history, trim system/tools overhead, or raise context_budget in Request params.`,
      rawErr: `invalid_request_error: ${rawMsg}`
    };
    this.chatTimeline.push(httpItem, errItem);
    chat.appendChild(this._makeHttpErrorLine(httpItem));
    chat.appendChild(this._makeErrorCard(errItem));
    this._scrollChat();
    this._updateComposerChips();
  },

  _getSuggestedQuestion() {
    const ph = SCENARIOS[this.scnIdx]?.placeholder;
    if (!ph) return null;
    if (typeof ph === "string") {
      return ph.replace(/^(?:试着问|Try asking)\s*[：:]\s*/i, "").trim() || null;
    }
    const cleanZh = (ph.zh || "").replace(/^试着问\s*[：:]\s*/, "").trim();
    const rawEn = (ph.en || cleanZh).replace(/^Try asking\s*[：:]\s*/i, "").trim();
    const cleanEn = rawEn ? rawEn.charAt(0).toUpperCase() + rawEn.slice(1) : cleanZh;
    if (!cleanZh && !cleanEn) return null;
    return { zh: cleanZh || cleanEn, en: cleanEn || cleanZh };
  },

  async sendUser(textOrObj) {
    this.stopPlay();
    const id = ++this.runId;
    const chat = document.getElementById("chat");
    if (chat.querySelector(".empty")) chat.innerHTML = "";

    const isBiObj = textOrObj && typeof textOrObj === "object";
    const uZh = isBiObj ? (textOrObj.zh || textOrObj.en || "") : String(textOrObj || "");
    const uEn = isBiObj ? (textOrObj.en || textOrObj.zh || "") : uZh;
    const textDisplay = this.lang === "en" ? uEn : uZh;

    const sc = SCENARIOS[this.scnIdx];
    const uItem = { kind: "customUser", zh: uZh, en: uEn, text: textDisplay };
    this.chatTimeline.push(uItem);
    const uEl = this._makeUserMsg(uZh, uEn, true, uItem);
    chat.appendChild(uEl);
    this._scrollChat();

    const baseMsgs = XRay.state.rawRequest?.messages || [];
    const curMsgs = [...baseMsgs, { role: "user", content: uZh, ...(uEn !== uZh ? { contentEn: uEn } : {}) }];
    const prevCtx = XRay.contextMessages();
    const prevUsed = XRay.state.context?.used || 0;
    const userTok = Math.max(4, Math.round(textDisplay.length / 3.2));
    const budget = XRay.state.context?.budget || this.sandbox.contextBudget || 1000000;
    const nextCtxWithUser = [
      ...prevCtx,
      { role: "user", text: uZh, textEn: uEn, tokens: userTok }
    ];
    const nextUsed = prevUsed + userTok;

    XRay.applyPatch({
      tab: "request",
      focus: "messages",
      request: { ...REQ_BASE, messages: curMsgs },
      context: { messages: nextCtxWithUser, used: nextUsed, budget },
      flow: { active: ["client", "agent", "api"], edge: "e_agent_api", label: "POST /v1/messages" }
    });
    this._updateComposerChips();
    await sleep(320);
    if (this.runId !== id) return;

    const totalInputTok = XRay.fixedOverhead() + nextUsed;
    if (totalInputTok > budget) {
      this._emitContextOverflowError(totalInputTok, budget);
      return;
    }
    if (XRay.state.errorResponse) XRay.state.errorResponse = null;

    let replyBeats = sc.defaultReply;
    const low = `${uZh} ${uEn}`.toLowerCase();
    for (const rule of (sc.freeText || [])) {
      if (rule.match.some(m => low.includes(m.toLowerCase()))) {
        replyBeats = rule.reply;
        break;
      }
    }

    const r = replyBeats[0] || { zh: "好问题。", en: "Good question." };
    const respText = this.biText(r);

    if (this.sandbox.stream) {
      XRay.beginSSE();
      const zhTxt = r.zh || respText;
      const enTxt = r.en || zhTxt;
      const zhChunks = zhTxt.match(/.{1,14}/g) || [zhTxt];
      const enChunks = enTxt.match(/.{1,18}/g) || [enTxt];
      const maxLen = Math.max(zhChunks.length, enChunks.length);
      await XRay.pushSSEFrame({ ev: "message_start", ms: 90, dt: JSON.stringify({ message: { id: "msg_custom", model: this.sandbox.model, usage: { input_tokens: totalInputTok } } }) });
      await sleep(110);
      await XRay.pushSSEFrame({ ev: "content_block_start", ms: 100, dt: JSON.stringify({ index: 0, content_block: { type: "text", text: "" } }) });
      for (let i = 0; i < maxLen; i++) {
        if (this.runId !== id) return;
        await sleep(70);
        await XRay.pushSSEFrame({
          ev: "content_block_delta",
          ms: 70,
          dt: JSON.stringify({ index: 0, delta: { type: "text_delta", text: zhChunks[i] || "" } }),
          dtEn: JSON.stringify({ index: 0, delta: { type: "text_delta", text: enChunks[i] || "" } })
        });
      }
      await XRay.pushSSEFrame({ ev: "content_block_stop", ms: 80, dt: "{\"index\":0}" });
      await XRay.pushSSEFrame({ ev: "message_delta", ms: 90, dt: JSON.stringify({ delta: { stop_reason: "end_turn" }, usage: { output_tokens: Math.max(8, Math.round(respText.length / 2.2)) } }) });
      await XRay.pushSSEFrame({ ev: "message_stop", ms: 60, dt: "{}" });
    }

    const rItem = { kind: "customReply", zh: r.zh, en: r.en };
    this.chatTimeline.push(rItem);
    const aEl = this._makeAssistantMsg(r.zh, r.en, rItem);
    chat.appendChild(aEl);
    await this._typewrite(aEl.querySelector(".body"), r.zh, r.en, id);

    const asstTok = Math.max(8, Math.round(respText.length / 2.5));
    const nextCtx = [
      ...nextCtxWithUser,
      { role: "assistant", text: r.zh.slice(0, 60) + (r.zh.length > 60 ? "..." : ""), textEn: (r.en || r.zh).slice(0, 60) + ((r.en || r.zh).length > 60 ? "..." : ""), tokens: asstTok }
    ];
    const used = nextUsed + asstTok;
    XRay.applyPatch({ context: { messages: nextCtx, used, budget } }, { silentTab: true });
    this._updateComposerChips();

    const curNid = XRay.state.tree?.current;
    if (curNid && this.branchSnapshots.has(curNid)) {
      this.branchSnapshots.set(curNid, this._cloneStateSnapshot());
    }
  },

  forkFromMessage(msgEl, zh, en, timelineItem) {
    this.stopPlay();
    const chat = document.getElementById("chat");
    const children = [...chat.children];
    const idx = children.indexOf(msgEl);

    const existing = XRay.state.tree?.nodes?.length ? JSON.parse(JSON.stringify(XRay.state.tree)) : {
      nodes: [
        { id: "root", label: "主线起点|Main root", sub: "session · #0", x: 0, y: 0, parent: null }
      ],
      current: "root"
    };
    const prevNodeId = existing.current || existing.nodes[0].id;
    if (!this.branchSnapshots.has(prevNodeId)) {
      this.branchSnapshots.set(prevNodeId, this._cloneStateSnapshot());
    }

    if (idx >= 0) {
      for (let i = children.length - 1; i > idx; i--) {
        children[i].remove();
      }
    }
    const tIdx = timelineItem ? this.chatTimeline.indexOf(timelineItem) : -1;
    if (tIdx >= 0) {
      this.chatTimeline = this.chatTimeline.slice(0, tIdx + 1);
    }

    const bId = `f${this.customIdSeq++}`;
    const nodes = [...existing.nodes];
    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    let parentDepth = 0;
    let cur = prevNodeId;
    while (cur && byId[cur] && byId[cur].parent && byId[byId[cur].parent]) {
      parentDepth++;
      cur = byId[cur].parent;
      if (parentDepth > 32) break;
    }
    const sibCount = nodes.filter(n => n.parent === prevNodeId).length;
    nodes.push({
      id: bId,
      label: `${(zh || "").slice(0, 14)}|${(en || zh || "").slice(0, 16)}`,
      sub: `fork · #${nodes.length + 1}`,
      x: sibCount,
      y: parentDepth + 1,
      parent: prevNodeId
    });
    XRay.applyPatch({ tab: "tree", tree: { nodes, current: bId } });
    this.branchSnapshots.set(bId, this._cloneStateSnapshot());
    this.showToast(this.biPairText(I18N.forkedTip.zh, I18N.forkedTip.en));
    document.getElementById("composerInput")?.focus();
  },

  _restoreBranchPlayPause() {
    const bp = this._branchPlayPause;
    if (!bp) return;
    this._branchPlayPause = null;
    this.chatTimeline = [...(bp.rawTimeline || [])];
    const patch = {};
    if (bp.tree) patch.tree = bp.tree;
    if (bp.snapshot?.rawRequest) patch.request = bp.snapshot.rawRequest;
    if (bp.snapshot?.context) patch.context = bp.snapshot.context;
    if (bp.snapshot?.flow) patch.flow = bp.snapshot.flow;
    XRay.applyPatch(patch, { silentTab: true });
    this._rerenderChat();
    this._updateComposerChips();
  },

  _applyTreeBranchView(nid, tr) {
    const sc = SCENARIOS[this.scnIdx];
    if (this.branchSnapshots.has(nid)) {
      const snap = this.branchSnapshots.get(nid);
      this.chatTimeline = this._restoreTimelineStates(snap.timeline || []);
      const patch = { tree: { ...tr, current: nid } };
      if (snap.rawRequest) patch.request = snap.rawRequest;
      if (snap.context) patch.context = snap.context;
      if (snap.flow) patch.flow = snap.flow;
      XRay.applyPatch(patch, { silentTab: true });
      this._rerenderChat();
      this._updateComposerChips();
    } else if (sc?.treePaths?.[nid]) {
      const tp = sc.treePaths[nid];
      this.chatTimeline = tp.beats.map(b => {
        const st = { open: b.t === "tool", resolvedChoice: b.choice || "allow" };
        const it = { kind: "beat", b, state: st };
        st._item = it;
        return it;
      });
      const used = (tp.ctxMessages || []).reduce((s, m) => s + (m.tokens || 12), 0);
      XRay.applyPatch({
        request: { ...REQ_BASE, messages: tp.reqMessages || [] },
        context: { messages: tp.ctxMessages || [], used, budget: this.sandbox.contextBudget || 1000000 },
        tree: { ...tr, current: nid }
      }, { silentTab: true });
      this._rerenderChat();
      this._updateComposerChips();
    } else {
      const byId = Object.fromEntries(tr.nodes.map(n => [n.id, n]));
      const pathNodes = [];
      let cur = nid;
      while (cur && byId[cur]) {
        pathNodes.unshift(byId[cur]);
        cur = byId[cur].parent;
      }
      this.chatTimeline = pathNodes.map(n => {
        const [zhL, enL] = String(n.label || "").split("|");
        const isUser = String(n.sub || "").includes("user");
        const beat = isUser
          ? { t: "user", zh: zhL, en: enL || zhL }
          : { t: "say", zh: zhL, en: enL || zhL };
        const st = { open: false };
        const it = { kind: "beat", b: beat, state: st };
        st._item = it;
        return it;
      });
      XRay.applyPatch({
        request: {
          ...REQ_BASE,
          messages: pathNodes.map(n => {
            const [zhL, enL] = String(n.label || "").split("|");
            return { role: String(n.sub || "").includes("user") ? "user" : "assistant", content: zhL, contentEn: enL || zhL };
          })
        },
        tree: { ...tr, current: nid }
      }, { silentTab: true });
      this._rerenderChat();
      this._updateComposerChips();
    }
  },

  handleTreeSelect(nid) {
    const tr = XRay.state.tree;
    if (!tr || !tr.nodes) return;

    if (this.playing) {
      const curNid = tr.current;
      if (!this._branchPlayPause) {
        if (nid === curNid) return;
        this._branchPlayPause = {
          originNodeId: curNid,
          rawTimeline: [...this.chatTimeline],
          snapshot: this._cloneStateSnapshot(),
          tree: JSON.parse(JSON.stringify(tr))
        };
        this.paused = true;
        this._updatePlayBtn();
        this._applyTreeBranchView(nid, tr);
        this.showToast(this.biPairText(
          `已离开原分支 #${curNid} · 演示已暂停，切回 #${curNid} 后继续`,
          `Left #${curNid} · Demo paused; click #${curNid} to resume`
        ));
        return;
      }

      if (nid === this._branchPlayPause.originNodeId) {
        this._restoreBranchPlayPause();
        this.paused = false;
        this._updatePlayBtn();
        if (this._activeInteractiveWait?.expect === "xray-tree") {
          this._notifyInteractiveAction("tree-node", nid);
        }
        this.showToast(this.biPairText(
          `已回到原分支 #${nid} · 继续自动演示`,
          `Returned to #${nid} · Resuming demo`
        ));
        return;
      }

      this.paused = true;
      this._updatePlayBtn();
      this._applyTreeBranchView(nid, tr);
      this.showToast(this.biPairText(
        `演示暂停中 · 切回原分支 #${this._branchPlayPause.originNodeId} 后继续`,
        `Paused · Return to #${this._branchPlayPause.originNodeId} to resume`
      ));
      return;
    }

    this.stopPlay();
    this._applyTreeBranchView(nid, tr);
    this.showToast(this.biPairText(
      `已将对话分支切换到 #${nid}`,
      `Switched conversation to branch #${nid}`
    ));
  },

  /* ============================================================
     Smooth Closing Transition Helper
     ============================================================ */
  _closeWithAnimation(els, cls, onDone) {
    const targets = (Array.isArray(els) ? els : [els]).filter(Boolean);
    if (!targets.length) { onDone(); return; }
    if (targets[0].dataset.closing === "1") return;
    targets.forEach(el => {
      el.dataset.closing = "1";
      el.classList.add(cls);
    });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };
    targets[0].addEventListener("animationend", finish, { once: true });
    setTimeout(finish, 240);
  },

  /* ============================================================
     Guided Spotlight Tour (Step 1 Language Selector + Bilingual Start)
     ============================================================ */
  startTour() {
    this.tourIdx = 0;
    this._renderTourStep();
  },

  _closeTour() {
    const root = document.getElementById("tourRoot");
    const layer = root?.querySelector(".tour-layer");
    this.tourIdx = -1;
    localStorage.setItem("ax_tour_seen", "1");
    const finish = () => {
      if (root) root.innerHTML = "";
      if (this._effViewport().w <= 1040) {
        this.sideOpen = false;
        this.xrayOpen = false;
        this.applySidebars(false);
      }
    };
    if (layer) {
      this._closeWithAnimation(layer, "closing", finish);
    } else {
      finish();
    }
  },

  _renderTourStep() {
    const root = document.getElementById("tourRoot");
    if (!root) return;
    if (this.tourIdx < 0 || this.tourIdx >= TOUR_STEPS.length) {
      this._closeTour();
      return;
    }

    const st = TOUR_STEPS[this.tourIdx];
    const compact = this._effViewport().w <= 1040;
    if (compact) {
      if (st.target === "#scnList") {
        this.sideOpen = true; this.xrayOpen = false; this.applySidebars(false);
      } else if (st.target === "#xrayPanel") {
        this.sideOpen = false; this.xrayOpen = true; this.applySidebars(false);
      } else {
        this.sideOpen = false; this.xrayOpen = false; this.applySidebars(false);
      }
    } else {
      if (!this.sideOpen) { this.sideOpen = true; this.applySidebars(false); }
      if (!this.xrayOpen) { this.xrayOpen = true; this.applySidebars(false); }
    }

    const target = document.querySelector(st.target);
    if (!target) {
      this._closeTour();
      return;
    }

    const { z, w: vw, h: vh } = this._effViewport();
    const r = target.getBoundingClientRect();
    const sx = Math.max(4, (r.left / z) - 4);
    const sy = Math.max(4, (r.top / z) - 4);
    const sw = Math.min(vw - sx - 4, (r.width / z) + 8);
    const sh = Math.min(vh - sy - 4, (r.height / z) + 8);

    const dots = TOUR_STEPS.map((_, i) => `<i class="${i === this.tourIdx ? "on" : ""}"></i>`).join("");
    const forceBi = Boolean(st.forceBilingual);
    const isLast = this.tourIdx === TOUR_STEPS.length - 1;

    const masksHtml = st.allowTargetClick
      ? `<div class="tour-mask" style="left:0;top:0;right:0;height:${Math.max(0, sy)}px"></div>
         <div class="tour-mask" style="left:0;top:${sy + sh}px;right:0;bottom:0"></div>
         <div class="tour-mask" style="left:0;top:${sy}px;width:${Math.max(0, sx)}px;height:${sh}px"></div>
         <div class="tour-mask" style="left:${sx + sw}px;top:${sy}px;right:0;height:${sh}px"></div>`
      : "";

    const langPickerHtml = st.id === "lang"
      ? `<div class="tour-lang-picks">
          <button type="button" class="tour-lang-btn${this.lang === "bi" ? " on" : ""}" data-tour-lang="bi">中英 Bilingual</button>
          <button type="button" class="tour-lang-btn${this.lang === "zh" ? " on" : ""}" data-tour-lang="zh">纯中文</button>
          <button type="button" class="tour-lang-btn${this.lang === "en" ? " on" : ""}" data-tour-lang="en">English Only</button>
        </div>`
      : "";

    root.innerHTML = `<div class="tour-layer${st.allowTargetClick ? " allow-target" : ""}">
      ${masksHtml}
      <div class="tour-spot" style="left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px"></div>
      <div class="tour-card" style="transition:none;left:12px;top:12px">
        <div class="tour-top">
          <span class="tour-badge">${this.biInline(st.badge.zh, st.badge.en, forceBi)}</span>
          <button class="tour-skip" id="tourSkipBtn">${this.biInline("跳过", "Skip", forceBi)}</button>
        </div>
        <h3>${this.biStack(st.title.zh, st.title.en, forceBi)}</h3>
        <p>${this.biStack(st.desc.zh, st.desc.en, forceBi)}</p>
        ${langPickerHtml}
        <div class="tour-actions">
          <div class="tour-dots">${dots}</div>
          <div style="display:flex;gap:7px;flex-shrink:0">
            ${this.tourIdx > 0 ? `<button class="btn ghost" id="tourPrevBtn">${this.biInline("上一步", "Back", forceBi)}</button>` : ""}
            <button class="btn primary" id="tourNextBtn">${isLast ? this.biInline("开始探索", "Finish", forceBi) : this.biInline("下一步", "Next", forceBi)}</button>
          </div>
        </div>
      </div>
    </div>`;

    const card = root.querySelector(".tour-card");
    if (card) {
      const cardW = Math.min(card.offsetWidth || 400, vw - 24);
      const cardH = Math.min(card.offsetHeight || (st.allowTargetClick ? 290 : 240), vh - 24);
      let cx = sx;
      let cy = sy + sh + 12;
      if (compact) {
        cx = Math.max(12, (vw - cardW) / 2);
        cy = st.pos === "top" || sy > vh * 0.5 ? 60 : Math.min(vh - cardH - 12, sy + sh + 14);
      } else if (st.pos === "right") {
        cx = sx + sw + 16;
        cy = Math.min(vh - cardH - 16, Math.max(70, sy + 18));
      } else if (st.pos === "left") {
        cx = sx - cardW - 16;
        cy = Math.min(vh - cardH - 16, Math.max(70, sy + 24));
      } else if (st.pos === "top") {
        cx = Math.min(vw - cardW - 16, Math.max(16, sx));
        cy = sy - cardH - 14;
      } else {
        cx = Math.min(vw - cardW - 16, Math.max(16, sx));
        cy = sy + sh + 14;
      }
      cx = Math.min(vw - cardW - 12, Math.max(12, cx));
      cy = Math.min(vh - cardH - 12, Math.max(12, cy));
      card.style.left = `${cx}px`;
      card.style.top = `${cy}px`;
      card.offsetWidth;
      requestAnimationFrame(() => { if (card.isConnected) card.style.transition = ""; });
    }

    root.querySelectorAll("[data-tour-lang]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.setLanguage(btn.dataset.tourLang);
      });
    });

    document.getElementById("tourSkipBtn").addEventListener("click", () => this._closeTour());
    document.getElementById("tourPrevBtn")?.addEventListener("click", () => {
      this.tourIdx--;
      this._renderTourStep();
    });
    document.getElementById("tourNextBtn").addEventListener("click", () => {
      if (isLast) {
        this._closeTour();
      } else {
        this.tourIdx++;
        this._renderTourStep();
      }
    });
  },

  /* ============================================================
     Confirm Reset Modal + Hint Popover + Sandbox Drawer (Smooth Close)
     ============================================================ */
  openResetConfirm(opts = {}) {
    const root = document.getElementById("modalRoot");
    const noAnimStyle = opts.instant ? ' style="animation:none"' : "";
    root.innerHTML = `<div class="modal-backdrop" id="confirmBackdrop"${noAnimStyle}>
      <div class="modal confirm" role="dialog" aria-modal="true"${noAnimStyle}>
        <div class="modal-head">
          <div class="modal-warn-ic"><svg class="ic"><use href="#i-warn"/></svg></div>
          <h2>${this.tStack("confirmTtl")}</h2>
        </div>
        <p>${this.tStack("confirmMsg")}</p>
        <div class="modal-actions">
          <button class="btn ghost" id="confirmCancel">${this.tPair("confirmNo")}</button>
          <button class="btn danger" id="confirmOk">${this.tPair("confirmYes")}</button>
        </div>
      </div>
    </div>`;
    const backdrop = document.getElementById("confirmBackdrop");
    const close = (after) => {
      this._closeWithAnimation(backdrop, "closing", () => {
        root.innerHTML = "";
        if (after) after();
      });
    };
    document.getElementById("confirmCancel").addEventListener("click", () => close());
    backdrop.addEventListener("click", (e) => {
      if (e.target.id === "confirmBackdrop") close();
    });
    document.getElementById("confirmOk").addEventListener("click", () => {
      close(() => {
        this.completed.clear();
        localStorage.removeItem("ax_done");
        this.selectScenario(0);
        this.showToast(this.biPairText(I18N.clearedAll.zh, I18N.clearedAll.en));
      });
    });
  },

  _renderHintPopoverContent(pop) {
    if (!pop) return;
    const sc = SCENARIOS[this.scnIdx];
    const isBi = this.lang === "bi";
    const isEn = this.lang === "en";
    pop.classList.toggle("is-bi", isBi);

    const header = `<h4><svg class="ic"><use href="#i-bulb"/></svg>${this.tPair("howTo")} · ${this.biInline(sc.title.zh, sc.title.en)}</h4>`;

    if (isBi) {
      const renderList = (langKey) => `<ol>${sc.steps.map(s => {
        const sum = s.summary || s.label;
        return `<li><b>${this._fmt(s.label[langKey])}</b><span>${this._fmt(sum[langKey])}</span></li>`;
      }).join("")}</ol>`;
      pop.innerHTML = `${header}
        <div class="pop-cols">
          <div class="pop-col pop-col-zh">${renderList("zh")}<div class="tip2">${this._fmt(sc.hint.zh)}</div></div>
          <div class="pop-col pop-col-en">${renderList("en")}<div class="tip2">${this._fmt(sc.hint.en)}</div></div>
        </div>`;
      return;
    }

    pop.innerHTML = `${header}
      <ol>
        ${sc.steps.map(s => {
          const sum = s.summary || s.label;
          const lbl = isEn ? s.label.en : s.label.zh;
          const desc = isEn ? sum.en : sum.zh;
          return `<li><b>${this._fmt(lbl)}</b><span>${this._fmt(desc)}</span></li>`;
        }).join("")}
      </ol>
      <div class="tip2">${this._fmt(isEn ? sc.hint.en : sc.hint.zh)}</div>`;
  },

  _positionHintPopover(pop) {
    const btn = document.getElementById("hintBtn");
    if (!btn || !pop || !pop.isConnected || pop.classList.contains("closing")) return;
    const rect = btn.getBoundingClientRect();
    const { z, w: vw, h: vh } = this._effViewport();
    const top = Math.max(8, (rect.bottom / z) + 8);
    pop.style.maxHeight = `${Math.max(120, vh - top - 12)}px`;
    const popW = pop.offsetWidth || Math.min(this.lang === "bi" ? 650 : 390, vw - 24);
    const left = Math.max(12, Math.min(vw - popW - 12, (rect.right / z) - popW));
    pop.style.top = `${top}px`;
    pop.style.left = `${left}px`;
  },

  _updateOpenHintPopover() {
    const pop = document.querySelector(".popover:not(.closing)");
    if (!pop) return;
    this._renderHintPopoverContent(pop);
    this._positionHintPopover(pop);
  },

  _stopHintPopTracker() {
    if (this._popTrackRaf) {
      cancelAnimationFrame(this._popTrackRaf);
      this._popTrackRaf = 0;
    }
    if (this._popResizeObs) {
      this._popResizeObs.disconnect();
      this._popResizeObs = null;
    }
    if (this._popOnReposition) {
      window.removeEventListener("resize", this._popOnReposition);
      window.removeEventListener("scroll", this._popOnReposition, true);
      this._popOnReposition = null;
    }
    if (this._popOnKey) {
      document.removeEventListener("keydown", this._popOnKey);
      this._popOnKey = null;
    }
    if (this._popCloser) {
      document.removeEventListener("click", this._popCloser);
      this._popCloser = null;
    }
  },

  _startHintPopTracker(pop) {
    this._stopHintPopTracker();
    const btn = document.getElementById("hintBtn");
    let lastKey = "";
    const sync = () => {
      if (!pop.isConnected || pop.classList.contains("closing") || !btn) {
        this._stopHintPopTracker();
        return;
      }
      const rect = btn.getBoundingClientRect();
      const { z, w: vw, h: vh } = this._effViewport();
      const key = `${rect.bottom.toFixed(1)},${rect.right.toFixed(1)},${vw.toFixed(1)},${vh.toFixed(1)},${pop.offsetWidth},${pop.offsetHeight}`;
      if (key !== lastKey) {
        lastKey = key;
        this._positionHintPopover(pop);
      }
    };
    this._popOnReposition = sync;
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, { capture: true, passive: true });
    if (typeof ResizeObserver === "function") {
      this._popResizeObs = new ResizeObserver(sync);
      [document.documentElement, document.querySelector(".console"), document.querySelector(".scn-head"), btn, pop].forEach(el => {
        if (el) this._popResizeObs.observe(el);
      });
    }
    this._popOnKey = (e) => {
      if (e.key === "Escape") this._closeHintPopover(pop);
    };
    document.addEventListener("keydown", this._popOnKey);
    const closer = (e) => {
      if (
        !pop.contains(e.target) &&
        !btn.contains(e.target) &&
        !e.target.closest("#sideToggleBtn, #xrayToggleBtn, #xrayExpandBtn, #zoomCtl, #langSeg, #themeBtn")
      ) {
        this._closeHintPopover(pop);
      }
    };
    this._popCloser = closer;
    setTimeout(() => {
      if (this._popCloser === closer) document.addEventListener("click", closer);
    }, 0);

    const loop = () => {
      if (!pop.isConnected || pop.classList.contains("closing")) {
        this._popTrackRaf = 0;
        return;
      }
      sync();
      this._popTrackRaf = requestAnimationFrame(loop);
    };
    this._popTrackRaf = requestAnimationFrame(loop);
  },

  _closeHintPopover(pop) {
    this._stopHintPopTracker();
    if (!pop || !pop.isConnected) return;
    this._closeWithAnimation(pop, "closing", () => pop.remove());
  },

  _toggleHintPopover() {
    const existing = document.querySelector(".popover:not(.closing)");
    if (existing) {
      this._closeHintPopover(existing);
      return;
    }
    document.querySelectorAll(".popover.closing").forEach(el => el.remove());
    const pop = document.createElement("div");
    pop.className = "popover";
    this._renderHintPopoverContent(pop);
    document.body.appendChild(pop);
    this._positionHintPopover(pop);
    this._startHintPopTracker(pop);
  },

  openSandbox(opts = {}) {
    const root = document.getElementById("modalRoot");
    const sb = this.sandbox;
    const noAnimStyle = opts.instant ? ' style="animation:none"' : "";
    root.innerHTML = `<div class="sheet-backdrop" id="sbBack"${noAnimStyle}></div>
      <div class="sheet" id="sbSheet"${noAnimStyle}>
        <h3>${this.biStack("请求参数沙盒", "Request Sandbox")}</h3>
        <div class="sub">${this.biStack(
          "实时修改 API 参数，观察右侧「请求 JSON」与「固定 token 开销」如何随之变化。",
          "Modify API parameters live and inspect how the Request JSON and fixed token overhead update in X-Ray."
        )}</div>
        <div class="field">
          <label><span>model</span><b id="sbModelVal">${esc(sb.model)}</b></label>
          <select id="sbModel">
            <option value="claude-fable-5-2" ${sb.model === "claude-fable-5-2" ? "selected" : ""}>claude-fable-5-2</option>
            <option value="claude-opus-5-5" ${sb.model === "claude-opus-5-5" ? "selected" : ""}>claude-opus-5-5</option>
            <option value="claude-sonnet-5-5" ${sb.model === "claude-sonnet-5-5" ? "selected" : ""}>claude-sonnet-5-5</option>
            <option value="claude-haiku-5-5" ${sb.model === "claude-haiku-5-5" ? "selected" : ""}>claude-haiku-5-5</option>
          </select>
        </div>
        <div class="field">
          <label><span>temperature</span><b id="sbTempVal">${sb.temperature}</b></label>
          <input type="range" id="sbTemp" min="0" max="1" step="0.1" value="${sb.temperature}">
        </div>
        <div class="field">
          <label><span>tools ${this.biInline("数量", "count")}</span><b id="sbToolsVal">${sb.toolsEnabled} / 6</b></label>
          <input type="range" id="sbTools" min="0" max="6" step="1" value="${sb.toolsEnabled}">
        </div>
        <div class="field">
          <label><span>context_budget</span><b id="sbBudgetVal">${(sb.contextBudget || 1000000).toLocaleString()} tok</b></label>
          <select id="sbBudget">
            <option value="1000000" ${(sb.contextBudget || 1000000) === 1000000 ? "selected" : ""}>1,000,000 (1M ${this.biInline("标准", "Standard")})</option>
            <option value="4000" ${sb.contextBudget === 4000 ? "selected" : ""}>4,000 (${this.biInline("紧凑", "Tight")})</option>
            <option value="1000" ${sb.contextBudget === 1000 ? "selected" : ""}>1,000 (${this.biInline("极小", "Tiny")})</option>
            <option value="250" ${sb.contextBudget === 250 ? "selected" : ""}>250 (${this.biInline("超限测试", "Overflow test")})</option>
          </select>
        </div>
        <div class="field">
          <div class="switch ${sb.stream ? "on" : ""}" id="sbStream">
            <span>stream (SSE)</span><span class="tg"></span>
          </div>
        </div>
        <div class="field">
          <label><span>system prompt</span></label>
          <textarea id="sbSystem">${esc(sb.system)}</textarea>
        </div>
        <div class="sheet-actions">
          <button class="btn ghost" id="sbReset">${this.biInline("恢复默认", "Defaults")}</button>
          <button class="btn primary" id="sbDone">${this.biInline("应用并关闭", "Apply & Close")}</button>
        </div>
        <div class="sheet-note" id="sbNote">${this.biStack(
          `当前固定开销（system + tools）约 ${XRay.fixedOverhead()} tokens；窗口上限 ${(sb.contextBudget || 1000000).toLocaleString()} tokens。`,
          `Fixed overhead (system + tools) is ~${XRay.fixedOverhead()} tokens; context budget is ${(sb.contextBudget || 1000000).toLocaleString()} tokens.`
        )}</div>
      </div>`;

    const sync = () => {
      this.sandbox = {
        model: document.getElementById("sbModel").value,
        maxTokens: 8192,
        temperature: Number(document.getElementById("sbTemp").value),
        toolsEnabled: Number(document.getElementById("sbTools").value),
        stream: document.getElementById("sbStream").classList.contains("on"),
        system: document.getElementById("sbSystem").value,
        contextBudget: Number(document.getElementById("sbBudget").value) || 1000000
      };
      document.getElementById("sbModelVal").textContent = this.sandbox.model;
      document.getElementById("sbTempVal").textContent = String(this.sandbox.temperature);
      document.getElementById("sbToolsVal").textContent = `${this.sandbox.toolsEnabled} / 6`;
      document.getElementById("sbBudgetVal").textContent = `${this.sandbox.contextBudget.toLocaleString()} tok`;
      XRay.setSandbox(this.sandbox);
      this._updateComposerChips();
      const noteEl = document.getElementById("sbNote");
      if (noteEl) {
        const curTot = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
        noteEl.innerHTML = this.biStack(
          `当前固定开销约 ${XRay.fixedOverhead()} tokens（总计 ${curTot.toLocaleString()} / ${this.sandbox.contextBudget.toLocaleString()} tokens）。`,
          `Fixed overhead is ~${XRay.fixedOverhead()} tokens (total ${curTot.toLocaleString()} / ${this.sandbox.contextBudget.toLocaleString()} tokens).`
        );
      }
    };

    document.getElementById("sbModel").addEventListener("change", sync);
    document.getElementById("sbTemp").addEventListener("input", sync);
    document.getElementById("sbTools").addEventListener("input", sync);
    document.getElementById("sbBudget").addEventListener("change", sync);
    document.getElementById("sbSystem").addEventListener("input", sync);
    document.getElementById("sbStream").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("on");
      sync();
    });
    document.getElementById("sbReset").addEventListener("click", () => {
      this.sandbox = { model: "claude-sonnet-5-5", maxTokens: 8192, temperature: 0.2, toolsEnabled: 6, stream: true, system: REQ_BASE.system, contextBudget: 1000000 };
      XRay.setSandbox(this.sandbox);
      this._updateComposerChips();
      this.openSandbox({ instant: true });
    });

    const back = document.getElementById("sbBack");
    const sheet = document.getElementById("sbSheet");
    const close = () => {
      sync();
      back.style.animation = "";
      sheet.style.animation = "";
      this._closeWithAnimation([sheet, back], "closing", () => {
        root.innerHTML = "";
        this._notifyInteractiveAction("sandbox", "closed");
      });
    };
    document.getElementById("sbDone").addEventListener("click", close);
    back.addEventListener("click", close);
  },

  _showTooltip(anchorEl, html) {
    const tip = document.getElementById("tooltip");
    if (!tip || !html) return;
    tip.innerHTML = html;
    tip.classList.add("on");
    const rect = anchorEl.getBoundingClientRect();
    const { z, w: vw, h: vh } = this._effViewport();
    const tipW = tip.offsetWidth || 300;
    const tipH = tip.offsetHeight || 90;
    tip.style.left = `${Math.max(10, Math.min(vw - tipW - 12, (rect.right / z) + 10))}px`;
    tip.style.top = `${Math.max(10, Math.min(vh - tipH - 12, rect.top / z))}px`;
  },

  _hideTooltip() {
    document.getElementById("tooltip")?.classList.remove("on");
  },

  showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("on");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove("on"), 2400);
  }
};

App._syncViewportClasses();
document.addEventListener("DOMContentLoaded", () => App.init());
