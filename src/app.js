/* ============================================================
   Agent X-Ray — Main Interactive Console & Learning State Machine
   ============================================================ */

const I18N = {
  appSub:     { zh: "AI Agent 透视镜", en: "Interactive Internals" },
  tour:       { zh: "新手教学", en: "Guide Tour" },
  listTitle:  { zh: "体验清单", en: "EXPERIENCES" },
  sideTip:    { zh: "点击任意体验跳转；悬停可预览提示；完成过的会有 ✓。", en: "Click any experience to jump; hover for hints; completed items get ✓." },
  howTo:      { zh: "怎么玩", en: "Guide" },
  autoplay:   { zh: "自动演示", en: "Auto play" },
  pause:      { zh: "暂停", en: "Pause" },
  resume:     { zh: "继续", en: "Resume" },
  stepJump:   { zh: "单步演示", en: "Step Jump" },
  params:     { zh: "请求参数", en: "Request params" },
  offline:    { zh: "离线模拟", en: "Offline sim" },
  emptyTitle: { zh: "准备好了，随时开始", en: "Ready when you are" },
  emptyDesc:  { zh: "点右上「自动演示」看全流程，或直接点击上方「单步演示」横条只看某一步；也可以在底部输入你的问题。", en: "Press “Auto play” for the full trace, click any “Step Jump” bar above to demo a single step, or ask a question below." },
  startBtn:   { zh: "开始自动演示", en: "Start Auto Play" },
  stepPrefix: { zh: "步骤", en: "Step" },
  clickDemo:  { zh: "点击仅演示这一步（自动保留前序上下文）", en: "Click to play only this step (prior context preserved)" },
  thinking:   { zh: "思考中", en: "Thinking" },
  forkBtn:    { zh: "从这里分叉", en: "Fork here" },
  copy:       { zh: "复制", en: "Copy" },
  copied:     { zh: "已复制", en: "Copied" },
  inputLbl:   { zh: "输入 JSON", en: "input JSON" },
  outputLbl:  { zh: "输出结果", en: "output" },
  mcpReq:     { zh: "发送 →", en: "RPC →" },
  mcpRes:     { zh: "← 返回", en: "← RPC" },
  permTitle:  { zh: "权限审批 / Hook 安检", en: "Permission / Hook Check" },
  allowBtn:   { zh: "允许执行", en: "Allow" },
  denyBtn:    { zh: "拒绝拦截", en: "Deny" },
  subParent:  { zh: "主 Agent 上下文", en: "Main Agent Context" },
  subChild:   { zh: "子代理独立上下文", en: "Isolated Subagent" },
  subArrow:   { zh: "↑ 仅把精炼结论带回主上下文", en: "↑ Only the concise summary returns" },
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
  forkedTip:  { zh: "已从该消息分叉出新分支，可在右侧「分支」树切换回原路径", en: "Forked a new branch — switch back anytime in the Branch tree" },
  prefillSep: { zh: "已静音保留前 {n} 步上下文 · 正在单独演示第 {cur} 步", en: "Prefilled {n} prior step(s) silently · Playing Step {cur}" },
  stepOf:     { zh: "第 {a} / {b} 步", en: "Step {a} / {b}" }
};

const TOUR_STEPS = [
  {
    target: "#scnList",
    pos: "right",
    badge: { zh: "第 1 / 6 步 · 课程清单", en: "1 / 6 · Curriculum" },
    title: { zh: "12 个由浅入深的交互体验", en: "12 Progressive Interactive Experiences" },
    desc:  { zh: "从最基础的 while 主循环，到 MCP、Skills、子代理与完整综合实战。悬停可预览要点，完成后会亮起高对比度绿色 ✓。", en: "From the basic while-loop up to MCP, Skills, Subagents and the Capstone trace. Hover items for tips; completed lessons show a crisp green ✓." }
  },
  {
    target: "#stepbar",
    pos: "bottom",
    badge: { zh: "第 2 / 6 步 · 单步演示", en: "2 / 6 · Step Jump" },
    title: { zh: "悬停看简介 · 点击只演这一步", en: "Hover for Preview · Click for Single Step" },
    desc:  { zh: "把鼠标放在任意横条上会放大并弹出这一步的要点；点击横条会瞬间保留前面步骤的上下文，仅动画演示你选中的这一步。", en: "Hover any step bar to enlarge it and preview its summary. Clicking instantly prefills prior steps and animates only that step." }
  },
  {
    target: "#chat",
    pos: "right",
    badge: { zh: "第 3 / 6 步 · 模拟控制台", en: "3 / 6 · Live Console" },
    title: { zh: "工具 JSON 自动展开与高亮", en: "Auto-Focused Tool JSON Cards" },
    desc:  { zh: "演示到工具调用、MCP JSON-RPC 或权限拦截时，卡片会自动展开并高亮关键 JSON；悬停任意用户消息还能「从这里分叉」。", en: "Tool calls, MCP JSON-RPC and permission gates auto-expand and highlight key JSON. Hover any user message to fork a branch." }
  },
  {
    target: "#xrayPanel",
    pos: "left",
    badge: { zh: "第 4 / 6 步 · X-Ray 透视镜", en: "4 / 6 · X-Ray Inspector" },
    title: { zh: "卡片 / 完整 JSON 独立切换 + 实时流管道", en: "Cards / Full JSON Switchers & Live SSE Pipe" },
    desc:  { zh: "右侧 5 个标签页同步揭秘底层状态：「请求」和「响应」各自支持切换「卡片」与「完整 JSON」，遇到 SSE 步骤还能看到逐帧到达和实时拼装！", en: "All 5 inspector tabs reveal live internals: Request & Response each toggle Cards vs Full JSON independently, and SSE beats animate chunk-by-chunk assembly." }
  },
  {
    target: "#sandboxBtn",
    pos: "top",
    badge: { zh: "第 5 / 6 步 · 请求沙盒", en: "5 / 6 · Request Sandbox" },
    title: { zh: "亲手改模型参数与系统提示", en: "Edit Model Params & Ask Questions" },
    desc:  { zh: "点击「请求参数」可实时开关工具、调节 temperature 或改 system prompt，观察 token 开销变化；也能在底部输入问题做离线问答。", en: "Click “Request params” to toggle tools, tune temperature or edit system prompt and watch token overhead shift. Or ask questions in the composer." }
  },
  {
    target: "#zoomSelect",
    pos: "bottom",
    badge: { zh: "第 6 / 6 步 · 缩放与侧栏", en: "6 / 6 · Zoom & Layout" },
    title: { zh: "50%~200% 缩放 & 固定侧栏开关", en: "50%–200% Zoom & Fixed Sidebar Toggles" },
    desc:  { zh: "可在此随时调整整体界面缩放比例，点击右上「新手教学」随时重看本指引；顶栏最左和最右的按钮可平滑收起或展开两侧面板。", en: "Scale the entire UI from 50% to 200% here, replay this guide anytime, or collapse either sidebar smoothly from the far-left and far-right topbar buttons." }
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
  customBranches: [],
  customIdSeq: 1,
  tourIdx: -1,
  sandbox: {
    model: "claude-sonnet-4-5",
    maxTokens: 8192,
    temperature: 0.2,
    toolsEnabled: 6,
    stream: true,
    system: REQ_BASE.system
  },

  init() {
    document.documentElement.dataset.theme = this.theme;
    document.documentElement.dataset.lang = this.lang;
    this.applyZoom(this.zoom, false);
    this.applySidebars(false);

    XRay.init({
      onBranchSelect: (nid) => this.handleTreeSelect(nid)
    });
    XRay.setLang(this.lang);
    XRay.setSandbox(this.sandbox);

    this._bindTopbar();
    this._bindConsole();
    this._renderI18n();
    this.renderSidebar();
    this.selectScenario(0);

    // Auto-start guided tour on first install
    if (!localStorage.getItem("ax_tour_seen")) {
      setTimeout(() => this.startTour(), 420);
    }
  },

  t(key) {
    const entry = I18N[key];
    if (!entry) return key;
    return this.lang === "en" ? entry.en : entry.zh;
  },

  biText(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return this.lang === "en" ? (obj.en || obj.zh || "") : (obj.zh || obj.en || "");
  },

  biHTML(zh, en) {
    const cleanZh = zh || "";
    const cleanEn = en || "";
    const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
    if (this.lang === "zh") return `<span class="bi-zh">${fmt(cleanZh)}</span>`;
    if (this.lang === "en") return `<span class="bi-en">${fmt(cleanEn || cleanZh)}</span>`;
    if (cleanZh && cleanEn && cleanZh === cleanEn) {
      return `<span class="bi-zh">${fmt(cleanZh)}</span>`;
    }
    return `<span class="bi-zh">${fmt(cleanZh)}</span>${cleanEn ? `<span class="bi-en">${fmt(cleanEn)}</span>` : ""}`;
  },

  _bindTopbar() {
    document.getElementById("sideToggleBtn").addEventListener("click", () => {
      const compact = window.innerWidth <= 1040;
      this.sideOpen = !this.sideOpen;
      if (compact) {
        if (this.sideOpen) this.xrayOpen = false;
      } else {
        localStorage.setItem("ax_side_open", this.sideOpen ? "1" : "0");
      }
      this.applySidebars(true);
    });
    document.getElementById("xrayToggleBtn").addEventListener("click", () => {
      const compact = window.innerWidth <= 1040;
      this.xrayOpen = !this.xrayOpen;
      if (compact) {
        if (this.xrayOpen) this.sideOpen = false;
      } else {
        localStorage.setItem("ax_xray_open", this.xrayOpen ? "1" : "0");
      }
      this.applySidebars(true);
    });

    this._wasCompact = window.innerWidth <= 1040;
    window.addEventListener("resize", () => this._handleViewportMode());

    const zoomSel = document.getElementById("zoomSelect");
    zoomSel.value = String(this.zoom);
    zoomSel.addEventListener("change", () => {
      this.applyZoom(Number(zoomSel.value), true);
    });

    document.getElementById("tourBtn").addEventListener("click", () => this.startTour());

    document.querySelectorAll("#langSeg button").forEach(btn => {
      btn.classList.toggle("on", btn.dataset.lang === this.lang);
      btn.addEventListener("click", () => {
        this.lang = btn.dataset.lang;
        localStorage.setItem("ax_lang", this.lang);
        document.documentElement.dataset.lang = this.lang;
        document.querySelectorAll("#langSeg button").forEach(b => b.classList.toggle("on", b.dataset.lang === this.lang));
        XRay.setLang(this.lang);
        this._renderI18n();
        this.renderSidebar();
        this._renderScenarioHeader();
        this.renderStepDots();
        if (this.tourIdx >= 0) this._renderTourStep();
      });
    });

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
        this.paused = !this.paused;
        this._updatePlayBtn();
      } else {
        this.playAll();
      }
    });

    document.getElementById("resetBtn").addEventListener("click", () => {
      this.selectScenario(this.scnIdx);
      this.showToast(this.t("resetScn"));
    });

    document.getElementById("hintBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      this._toggleHintPopover();
    });

    document.getElementById("sandboxBtn").addEventListener("click", () => this.openSandbox());

    const input = document.getElementById("composerInput");
    const send = document.getElementById("sendBtn");
    const fire = () => {
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      input.style.overflowY = "hidden";
      input.style.height = "auto";
      this.sendUser(val);
    };
    send.addEventListener("click", fire);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        fire();
      }
    });
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.overflowX = "hidden";
      input.style.overflowY = input.scrollHeight > 115 ? "auto" : "hidden";
      input.style.height = Math.min(115, input.scrollHeight) + "px";
    });
  },

  _coordScale() {
    return window.__TAURI_INTERNALS__ ? 1 : (this.zoom || 1);
  },

  _handleViewportMode() {
    const compact = window.innerWidth <= 1040;
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

    if (window.__TAURI_INTERNALS__?.invoke) {
      document.body.style.zoom = "";
      try {
        await window.__TAURI_INTERNALS__.invoke("set_zoom", { zoom: z });
      } catch {
        document.body.style.zoom = String(z);
      }
    } else {
      document.body.style.zoom = String(z);
    }
    setTimeout(() => this._handleViewportMode(), 50);
  },

  applySidebars(animate = true) {
    const shell = document.getElementById("shell");
    shell.classList.toggle("noSide", !this.sideOpen);
    shell.classList.toggle("noXray", !this.xrayOpen);
    document.getElementById("sideToggleBtn").classList.toggle("on", this.sideOpen);
    document.getElementById("xrayToggleBtn").classList.toggle("on", this.xrayOpen);
    if (animate && this.tourIdx >= 0) {
      setTimeout(() => this._renderTourStep(), 340);
    }
  },

  _renderI18n() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      if (I18N[k]) el.textContent = this.t(k);
    });
    const sc = SCENARIOS[this.scnIdx];
    const inp = document.getElementById("composerInput");
    if (sc && inp) inp.placeholder = this.biText(sc.placeholder);
    this._updatePlayBtn();
    this._updateComposerChips();
  },

  _updatePlayBtn() {
    const btn = document.getElementById("playBtn");
    if (!btn) return;
    if (!this.playing) {
      btn.innerHTML = `<svg class="ic"><use href="#i-play"/></svg><span>${esc(this.t("autoplay"))}</span>`;
      btn.classList.remove("primary");
      btn.classList.add("ghost");
    } else if (this.paused) {
      btn.innerHTML = `<svg class="ic"><use href="#i-play"/></svg><span>${esc(this.t("resume"))}</span>`;
      btn.classList.add("primary");
      btn.classList.remove("ghost");
    } else {
      btn.innerHTML = `<svg class="ic"><use href="#i-pause"/></svg><span>${esc(this.t("pause"))}</span>`;
      btn.classList.add("primary");
      btn.classList.remove("ghost");
    }
  },

  _updateComposerChips() {
    const ctxTok = XRay.fixedOverhead() + (XRay.state.context?.used || 0);
    const ctxEl = document.getElementById("ctxChip");
    if (ctxEl) ctxEl.innerHTML = `<svg class="ic"><use href="#i-context"/></svg><b>${ctxTok.toLocaleString()}</b> tokens`;
    const stEl = document.getElementById("streamChip");
    if (stEl) stEl.textContent = this.sandbox.stream ? "stream on" : "stream off";
    const tlEl = document.getElementById("toolsChip");
    if (tlEl) tlEl.textContent = `tools ${this.sandbox.toolsEnabled}`;
  },

  /* ============================================================
     Sidebar (with crisp high-contrast .ck-wrap checkmarks)
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
        <div class="nm">${nameHtml}</div>
        <span class="ck-wrap" aria-label="completed"><svg class="ck"><use href="#i-check"/></svg></span>
      </div>`;
    }).join("");

    list.querySelectorAll(".scn-item").forEach(item => {
      const idx = Number(item.dataset.idx);
      item.addEventListener("click", () => this.selectScenario(idx));
      item.addEventListener("mouseenter", () => {
        const sc = SCENARIOS[idx];
        this._showTooltip(item, this.biText(sc.hint));
      });
      item.addEventListener("mouseleave", () => this._hideTooltip());
    });

    const countEl = document.getElementById("doneCount");
    const barEl = document.getElementById("doneBar");
    if (countEl) countEl.textContent = `${this.completed.size} / ${SCENARIOS.length}`;
    if (barEl) barEl.style.width = `${(this.completed.size / SCENARIOS.length) * 100}%`;
  },

  /* ============================================================
     Scenario Header (2-line bilingual title + full-width subtitle)
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
      titleEl.innerHTML = `<span class="t-zh">${esc(sc.title.en)}</span>`;
    }

    const subEl = document.getElementById("scnSub");
    if (this.lang === "bi") {
      subEl.innerHTML = `<span class="sub-zh">${esc(sc.sub.zh)}</span><span class="sub-en">${esc(sc.sub.en)}</span>`;
    } else if (this.lang === "zh") {
      subEl.innerHTML = `<span class="sub-zh">${esc(sc.sub.zh)}</span>`;
    } else {
      subEl.innerHTML = `<span class="sub-zh">${esc(sc.sub.en)}</span>`;
    }

    const badge = document.getElementById("hintBadge");
    if (badge) badge.textContent = String(sc.steps.length);
    const inp = document.getElementById("composerInput");
    if (inp) inp.placeholder = this.biText(sc.placeholder);
  },

  selectScenario(idx) {
    this.stopPlay();
    this.scnIdx = idx;
    this.stepIdx = -1;
    this.customBranches = [];
    if (window.innerWidth <= 1040 && this.sideOpen) {
      this.sideOpen = false;
      this.applySidebars(false);
    }
    XRay.reset();

    this.renderSidebar();
    this._renderScenarioHeader();
    this.renderStepDots();
    this._renderEmptyChat();
    this._updateComposerChips();
  },

  _renderEmptyChat() {
    const chat = document.getElementById("chat");
    const sc = SCENARIOS[this.scnIdx];
    chat.innerHTML = `<div class="empty">
      <div class="big">${esc(this.biText(sc.title))}</div>
      <p>${esc(this.t("emptyDesc"))}</p>
      <p class="empty-hint">${esc(this.biText(sc.hint))}</p>
      <button class="btn primary startbtn" id="emptyStartBtn">
        <svg class="ic"><use href="#i-play"/></svg>${esc(this.t("startBtn"))}
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
      return `<button class="${cls}" data-step="${i}" aria-label="${esc(this.biText(st.label))}"></button>`;
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
      lblEl.textContent = this.t("stepOf")
        .replaceAll("{a}", String(curDisp))
        .replaceAll("{b}", String(sc.steps.length));
    }
  },

  _showStepTip(anchorEl, idx) {
    const sc = SCENARIOS[this.scnIdx];
    const st = sc?.steps[idx];
    const tip = document.getElementById("stepTip");
    if (!st || !tip) return;

    const title = this.biText(st.label);
    const desc = this.biText(st.summary || st.label);
    tip.innerHTML = `<div class="st-top">
        <span class="st-num">${esc(this.t("stepPrefix"))} ${idx + 1}/${sc.steps.length}</span>
        <span class="st-title">${esc(title)}</span>
      </div>
      <div class="st-desc">${esc(desc)}</div>
      <div class="st-hint">▶ ${esc(this.t("clickDemo"))}</div>`;

    tip.classList.add("on");
    const rect = anchorEl.getBoundingClientRect();
    const z = this._coordScale();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    const tipW = Math.min(340, vw - 24);
    let left = (rect.left / z) - 14;
    if (left + tipW > vw - 12) left = vw - tipW - 12;
    if (left < 12) left = 12;
    const top = Math.min(vh - 150, (rect.bottom / z) + 10);
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
    this._updatePlayBtn();
  },

  async _waitIfPaused(id) {
    while (this.paused && this.runId === id) {
      await sleep(80);
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
    XRay.reset();

    for (let i = 0; i < sc.steps.length; i++) {
      if (this.runId !== id) return;
      this.stepIdx = i;
      this.renderStepDots();
      await this._runStep(sc.steps[i], { instant: false, id });
      if (this.runId !== id) return;
      await sleep(220);
    }

    this.markCompleted(sc.id);
    this.playing = false;
    this.paused = false;
    this._updatePlayBtn();
  },

  // Requirement #2: prefill_prev — silently render steps 0..targetIdx-1, animate ONLY targetIdx
  async jumpAndPlaySingleStep(targetIdx) {
    const sc = SCENARIOS[this.scnIdx];
    if (!sc || targetIdx < 0 || targetIdx >= sc.steps.length) return;

    this.stopPlay();
    const id = ++this.runId;
    this.playing = true;
    this.paused = false;
    this._updatePlayBtn();

    const chat = document.getElementById("chat");
    chat.innerHTML = "";
    XRay.reset();

    // 1) Instantly prefill prior steps 0 .. targetIdx - 1 with zero animations
    for (let i = 0; i < targetIdx; i++) {
      this.stepIdx = i;
      await this._runStepSync(sc.steps[i]);
    }

    if (targetIdx > 0) {
      const sep = document.createElement("div");
      sep.className = "httpline";
      sep.style.justifyContent = "center";
      sep.style.color = "var(--accent)";
      sep.textContent = this.t("prefillSep")
        .replaceAll("{n}", String(targetIdx))
        .replaceAll("{cur}", String(targetIdx + 1));
      chat.appendChild(sep);
    }

    // 2) Animate ONLY the selected step N
    this.stepIdx = targetIdx;
    this.renderStepDots();
    await this._runStep(sc.steps[targetIdx], { instant: false, id });

    if (this.runId !== id) return;
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
    if (b.t === "user") {
      chat.appendChild(this._makeUserMsg(b.zh, b.en, false));
    } else if (b.t === "think") {
      chat.appendChild(this._makeThinkEl(b.zh, b.en));
    } else if (b.t === "say") {
      const el = this._makeAssistantMsg();
      el.querySelector(".body").innerHTML = this.biHTML(b.zh, b.en);
      chat.appendChild(el);
    } else if (b.t === "tool") {
      chat.appendChild(this._makeToolCard(b, { done: true, open: false, focusJson: false }));
    } else if (b.t === "note") {
      chat.appendChild(this._makeNote(b));
    } else if (b.t === "code") {
      chat.appendChild(this._makeCodeCard(b));
    } else if (b.t === "http") {
      chat.appendChild(this._makeHttpLine(b));
    } else if (b.t === "perm") {
      chat.appendChild(this._makePermCard(b, { resolved: true }));
    } else if (b.t === "sub") {
      chat.appendChild(this._makeSubCard(b));
    } else if (b.t === "compact") {
      chat.appendChild(this._makeCompactCard(b, { done: true }));
    } else if (b.t === "mcp") {
      chat.appendChild(this._makeMcpCard(b, { focusJson: false }));
    } else if (b.t === "mem") {
      chat.appendChild(this._makeMemCard(b));
    } else if (b.t === "done") {
      chat.appendChild(this._makeDoneCard(b));
    }
  },

  async _runStep(step, { id }) {
    const chat = document.getElementById("chat");
    for (const b of step.beats) {
      if (!(await this._waitIfPaused(id))) return;

      if (b.t === "xr") {
        XRay.applyPatch(b.patch);
        this._updateComposerChips();
        await sleep(160);
        continue;
      }

      if (b.t === "sse") {
        XRay.beginSSE();
        if (b.focus) XRay.focusKey = b.focus;
        const frames = b.frames || [];
        for (const f of frames) {
          if (!(await this._waitIfPaused(id))) return;
          XRay.pushSSEFrame(f);
          await sleep(f.ms || 160);
        }
        this._updateComposerChips();
        continue;
      }

      if (b.t === "user") {
        const el = this._makeUserMsg(b.zh, b.en, false);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(260);
      } else if (b.t === "think") {
        const el = this._makeThinkEl(b.zh, b.en);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(320);
      } else if (b.t === "say") {
        const el = this._makeAssistantMsg();
        const body = el.querySelector(".body");
        chat.appendChild(el);
        this._scrollChat();
        await this._typewrite(body, b.zh, b.en, id);
      } else if (b.t === "tool") {
        const card = this._makeToolCard(b, { done: false, open: true, focusJson: true });
        chat.appendChild(card);
        this._scrollToEl(card);
        await sleep(Math.min(950, Math.max(360, (b.ms || 300) * 0.6)));
        if (this.runId !== id) return;
        this._finishToolCard(card, b);
        this._scrollToEl(card.querySelector(".kv.focus-hl") || card);
        await sleep(260);
      } else if (b.t === "note") {
        const el = this._makeNote(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(260);
      } else if (b.t === "code") {
        const el = this._makeCodeCard(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(260);
      } else if (b.t === "http") {
        const el = this._makeHttpLine(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(260);
      } else if (b.t === "perm") {
        const el = this._makePermCard(b, { resolved: false });
        chat.appendChild(el);
        this._scrollChat();
        await sleep(550);
        if (this.runId !== id) return;
        this._resolvePermCard(el, b, b.choice || "allow");
        await sleep(260);
      } else if (b.t === "sub") {
        const el = this._makeSubCard(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(360);
      } else if (b.t === "compact") {
        const el = this._makeCompactCard(b, { done: false });
        chat.appendChild(el);
        this._scrollChat();
        await sleep(80);
        const bar = el.querySelector(".bar i");
        if (bar) bar.style.width = `${Math.max(4, Math.round((b.to / b.from) * 100))}%`;
        await sleep(420);
      } else if (b.t === "mcp") {
        const el = this._makeMcpCard(b, { focusJson: true });
        chat.appendChild(el);
        this._scrollToEl(el);
        await sleep(360);
      } else if (b.t === "mem") {
        const el = this._makeMemCard(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(320);
      } else if (b.t === "done") {
        this.markCompleted(SCENARIOS[this.scnIdx].id);
        const el = this._makeDoneCard(b);
        chat.appendChild(el);
        this._scrollChat();
        await sleep(200);
      }
      this._updateComposerChips();
    }
  },

  async _typewrite(bodyEl, zh, en, id) {
    const srcZh = zh || "";
    const srcEn = en || "";
    const showBoth = this.lang === "bi" && srcZh && srcEn && srcZh !== srcEn;
    const textMain = this.lang === "en" ? (srcEn || srcZh) : srcZh;
    const words = textMain.split(/(\s+|(?<=[\u4e00-\u9fa5，。！？：；、]))/);

    const spanMain = document.createElement("span");
    spanMain.className = (this.lang === "en" ? "bi-en" : "bi-zh") + " cursor";
    bodyEl.innerHTML = "";
    bodyEl.appendChild(spanMain);

    let acc = "";
    const stepSize = Math.max(1, Math.ceil(words.length / 26));
    for (let i = 0; i < words.length; i += stepSize) {
      if (!(await this._waitIfPaused(id))) return;
      acc += words.slice(i, i + stepSize).join("");
      spanMain.innerHTML = esc(acc).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>");
      this._scrollChat();
      await sleep(22);
    }
    spanMain.classList.remove("cursor");

    if (showBoth) {
      const spanEn = document.createElement("span");
      spanEn.className = "bi-en";
      spanEn.innerHTML = esc(srcEn).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
      bodyEl.appendChild(spanEn);
    }
    bodyEl.innerHTML = this.biHTML(zh, en);
    this._scrollChat();
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
        <button class="fork"><svg class="ic" style="width:12px;height:12px"><use href="#i-fork"/></svg>${esc(this.t("forkBtn"))}</button>
      </div>`;
    wrap.querySelector(".fork").addEventListener("click", () => this.forkFromMessage(wrap, zh, en));
    return wrap;
  },

  _makeThinkEl(zh, en) {
    const el = document.createElement("div");
    el.className = "think";
    el.innerHTML = `<span class="lbl">${esc(this.t("thinking"))}</span>${this.biHTML(zh, en)}`;
    return el;
  },

  _makeAssistantMsg() {
    const el = document.createElement("div");
    el.className = "msg assistant";
    el.innerHTML = `<div class="who"><svg class="ic"><use href="#i-robot"/></svg></div><div class="body"></div>`;
    return el;
  },

  _makeToolCard(b, { done, open, focusJson }) {
    const card = document.createElement("div");
    card.className = `tool${open ? " open" : ""}`;
    const iconId = b.kind === "bash" ? "i-terminal" : b.kind === "mcp" ? "i-mcp" : b.kind === "task" ? "i-subagent" : "i-file";
    const statusHtml = done
      ? `<svg class="okmark ic"><use href="#i-check"/></svg><span>${b.ms || 0} ms</span>`
      : `<span class="spin"></span><span>running…</span>`;
    const isOutJson = /^[\s]*[\{\[]/.test(b.output || "");
    const hlIn = focusJson ? " focus-hl" : "";
    const hlOut = focusJson && isOutJson ? " focus-hl" : "";

    card.innerHTML = `<div class="tool-head">
        <div class="tool-ic"><svg class="ic"><use href="#${iconId}"/></svg></div>
        <span class="tool-name">${esc(b.name)}</span>
        <span class="tool-arg">${esc(b.arg || "")}</span>
        <div class="tool-meta">${statusHtml}<svg class="chev ic"><use href="#i-chevron"/></svg></div>
      </div>
      <div class="tool-body">
        <div class="kv${hlIn}"><span class="k">${esc(this.t("inputLbl"))}</span><pre>${esc(b.input || "{}")}</pre></div>
        <div class="kv kv-out${hlOut}" style="${done ? "" : "display:none"}"><span class="k">${esc(this.t("outputLbl"))}</span><pre>${esc(b.output || "")}</pre></div>
        ${b.note ? `<div class="note info" style="margin:9px 0 0"><svg class="ic"><use href="#i-info"/></svg><div>${this.biHTML(b.note.zh, b.note.en)}</div></div>` : ""}
      </div>`;

    card.querySelector(".tool-head").addEventListener("click", () => card.classList.toggle("open"));
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
    const title = this.lang === "en" ? (tEn || tZh) : tZh;
    el.innerHTML = `<div class="code-head">
        <span class="lang">${esc(b.lang || "ts")}</span>
        <span class="ttl">${esc(title)}</span>
        <button><svg class="ic" style="width:12px;height:12px"><use href="#i-copy"/></svg><span>${esc(this.t("copy"))}</span></button>
      </div>
      <pre>${highlightCode(b.code || "")}</pre>`;
    const btn = el.querySelector("button");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard?.writeText(b.code || "");
        btn.querySelector("span").textContent = this.t("copied");
        setTimeout(() => { btn.querySelector("span").textContent = this.t("copy"); }, 1200);
      } catch {}
    });
    return el;
  },

  _makeHttpLine(b) {
    const el = document.createElement("div");
    el.className = "httpline";
    el.innerHTML = `<span class="method">${esc(b.method)}</span><span class="url">${esc(b.url)}</span><span class="status">${esc(b.status)}</span><span class="ms">${esc(b.ms)}</span>`;
    return el;
  },

  _makePermCard(b, { resolved }) {
    const el = document.createElement("div");
    el.className = "perm";
    el.innerHTML = `<div class="perm-title"><svg class="ic"><use href="#i-shield"/></svg><span>${esc(this.t("permTitle"))}</span><span class="tag" style="margin-left:auto">${esc(this.biText(b.risk))}</span></div>
      <div class="perm-cmd">${esc(b.cmd)}</div>
      <div class="perm-actions">
        <button class="btn primary" data-act="allow">${esc(this.t("allowBtn"))}</button>
        <button class="btn ghost" data-act="deny">${esc(this.t("denyBtn"))}</button>
      </div>`;
    el.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => this._resolvePermCard(el, b, btn.dataset.act));
    });
    if (resolved) this._resolvePermCard(el, b, b.choice || "allow");
    return el;
  },

  _resolvePermCard(el, b, choice) {
    const act = el.querySelector(".perm-actions");
    if (!act) return;
    const isAllow = choice === "allow";
    const msg = isAllow ? this.biText(b.allow) : this.biText(b.deny);
    act.innerHTML = `<span class="tag ${isAllow ? "grn" : "red"}">${esc(msg)}</span>`;
  },

  _makeSubCard(b) {
    const el = document.createElement("div");
    el.className = "sub";
    el.innerHTML = `<div style="display:flex;align-items:center;gap:7px;font-weight:600;font-size:13.5px">
        <svg class="ic" style="color:var(--accent)"><use href="#i-subagent"/></svg>
        <span>${esc(this.biText(b.task))}</span>
      </div>
      <div class="sub-grid">
        <div class="sub-box parent">
          <h5>${esc(this.t("subParent"))}</h5>
          <div>${esc(this.biText(b.result))}</div>
        </div>
        <div class="sub-box child">
          <h5>${esc(this.t("subChild"))}</h5>
          <div>${esc(this.biText(b.child))}</div>
        </div>
      </div>
      <div class="sub-arrow">${esc(this.t("subArrow"))}</div>`;
    return el;
  },

  _makeCompactCard(b, { done }) {
    const el = document.createElement("div");
    el.className = "compact";
    const pct = Math.max(4, Math.round((b.to / b.from) * 100));
    el.innerHTML = `<div class="row">
        <span>${esc(this.t("compactLbl"))}</span>
        <span style="margin-left:auto"><span class="from">${(b.from / 1000).toFixed(0)}k</span> → <span class="to">${(b.to / 1000).toFixed(0)}k tok</span></span>
      </div>
      <div class="bar"><i style="width:${done ? pct : 100}%"></i></div>
      <p>${esc(this.biText(b.summary))}</p>`;
    return el;
  },

  _makeMcpCard(b, { focusJson }) {
    const el = document.createElement("div");
    el.className = `mcp${focusJson ? " focus-hl" : ""}`;
    el.innerHTML = (b.rows || []).map(r => {
      let pretty = r.json;
      try { pretty = JSON.stringify(JSON.parse(r.json), null, 2); } catch {}
      return `<div class="mcp-row">
        <span class="mcp-dir ${r.dir}">${esc(r.dir === "req" ? this.t("mcpReq") : this.t("mcpRes"))}</span>
        <div class="mcp-json">${esc(pretty)}</div>
      </div>`;
    }).join("");
    return el;
  },

  _makeMemCard(b) {
    const el = document.createElement("div");
    el.className = "mem";
    el.innerHTML = (b.lines || []).map(l => `<div class="ln">
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
      const lbl = this.lang === "en" ? (en || zh) : zh;
      return `<div><b>${esc(v)}</b><span>${esc(lbl)}</span></div>`;
    }).join("");
    el.innerHTML = `<h3>${esc(this.t("doneTitle"))}</h3>
      <div class="stats">${statsHtml}</div>
      ${hasNext
        ? `<button class="btn primary" data-next>${esc(this.t("doneNext"))} <svg class="ic"><use href="#i-arrow"/></svg></button>`
        : `<p style="color:var(--green);font-weight:600">${esc(this.t("doneAll"))}</p>`
      }`;
    el.querySelector("[data-next]")?.addEventListener("click", () => {
      this.selectScenario(this.scnIdx + 1);
    });
    return el;
  },

  /* ============================================================
     Free-text interactive offline chat + Forking
     ============================================================ */
  async sendUser(text) {
    this.stopPlay();
    const id = ++this.runId;
    const chat = document.getElementById("chat");
    if (chat.querySelector(".empty")) chat.innerHTML = "";

    const sc = SCENARIOS[this.scnIdx];
    const uEl = this._makeUserMsg(text, text, true);
    chat.appendChild(uEl);
    this._scrollChat();

    // Update Request JSON & Flow
    const curMsgs = [...(XRay.state.request?.messages || []), { role: "user", content: text }];
    XRay.applyPatch({
      tab: "request",
      focus: "messages",
      request: { ...REQ_BASE, messages: curMsgs },
      flow: { active: ["client", "agent", "api"], edge: "e_agent_api", label: "POST /v1/messages" }
    });
    this._updateComposerChips();
    await sleep(320);
    if (this.runId !== id) return;

    // Match reply
    let replyBeats = sc.defaultReply;
    const low = text.toLowerCase();
    for (const rule of (sc.freeText || [])) {
      if (rule.match.some(m => low.includes(m.toLowerCase()))) {
        replyBeats = rule.reply;
        break;
      }
    }

    const r = replyBeats[0] || { zh: "好问题。", en: "Good question." };
    const respText = this.biText(r);

    // Stream simulated SSE chunks in X-Ray Response tab if streaming enabled
    if (this.sandbox.stream) {
      XRay.beginSSE();
      const chunks = respText.match(/.{1,14}/g) || [respText];
      await XRay.pushSSEFrame({ ev: "message_start", ms: 90, dt: JSON.stringify({ message: { id: "msg_custom", model: this.sandbox.model, usage: { input_tokens: XRay.fixedOverhead() + text.length } } }) });
      await sleep(110);
      await XRay.pushSSEFrame({ ev: "content_block_start", ms: 100, dt: JSON.stringify({ index: 0, content_block: { type: "text", text: "" } }) });
      for (const ch of chunks) {
        if (this.runId !== id) return;
        await sleep(75);
        await XRay.pushSSEFrame({ ev: "content_block_delta", ms: 75, dt: JSON.stringify({ index: 0, delta: { type: "text_delta", text: ch } }) });
      }
      await XRay.pushSSEFrame({ ev: "content_block_stop", ms: 80, dt: "{\"index\":0}" });
      await XRay.pushSSEFrame({ ev: "message_delta", ms: 90, dt: JSON.stringify({ delta: { stop_reason: "end_turn" }, usage: { output_tokens: Math.max(8, Math.round(respText.length / 2.2)) } }) });
      await XRay.pushSSEFrame({ ev: "message_stop", ms: 60, dt: "{}" });
    }

    const aEl = this._makeAssistantMsg();
    chat.appendChild(aEl);
    await this._typewrite(aEl.querySelector(".body"), r.zh, r.en, id);

    // Append to Context
    const prevCtx = XRay.contextMessages();
    const nextCtx = [
      ...prevCtx,
      { role: "user", text, tokens: Math.max(4, Math.round(text.length / 2.5)) },
      { role: "assistant", text: respText.slice(0, 60) + (respText.length > 60 ? "…" : ""), tokens: Math.max(8, Math.round(respText.length / 2.5)) }
    ];
    const used = nextCtx.reduce((s, m) => s + m.tokens, 0);
    XRay.applyPatch({ context: { messages: nextCtx, used, budget: 200000 } }, { silentTab: true });
    this._updateComposerChips();
  },

  forkFromMessage(msgEl, zh, en) {
    this.stopPlay();
    const chat = document.getElementById("chat");
    const children = [...chat.children];
    const idx = children.indexOf(msgEl);
    if (idx >= 0) {
      for (let i = children.length - 1; i > idx; i--) {
        children[i].remove();
      }
    }
    const existing = XRay.state.tree?.nodes?.length ? XRay.state.tree : {
      nodes: [
        { id: "root", label: "主线起点|Main root", sub: "session · #0", x: 0, y: 0, parent: null }
      ],
      current: "root"
    };
    const bId = `f${this.customIdSeq++}`;
    const nodes = [...existing.nodes];
    const parentId = existing.current || nodes[0].id;
    const maxCol = nodes.reduce((m, n) => Math.max(m, n.x || 0), 0);
    nodes.push({
      id: bId,
      label: `${(zh || "").slice(0, 14)}|${(en || zh || "").slice(0, 16)}`,
      sub: `fork · #${nodes.length + 1}`,
      x: maxCol + 1,
      y: 1,
      parent: parentId
    });
    XRay.applyPatch({ tab: "tree", tree: { nodes, current: bId } });
    this.showToast(this.t("forkedTip"));
    document.getElementById("composerInput")?.focus();
  },

  handleTreeSelect(nid) {
    const tr = XRay.state.tree;
    if (!tr || !tr.nodes) return;
    tr.current = nid;
    XRay.render();
    this.showToast((this.lang === "en" ? "Switched branch pointer to " : "已将对话指针切换到 ") + nid);
  },

  /* ============================================================
     Guided Spotlight Tour (Auto first-install + Replayable)
     ============================================================ */
  startTour() {
    this.tourIdx = 0;
    this._renderTourStep();
  },

  _renderTourStep() {
    const root = document.getElementById("tourRoot");
    if (!root) return;
    if (this.tourIdx < 0 || this.tourIdx >= TOUR_STEPS.length) {
      root.innerHTML = "";
      localStorage.setItem("ax_tour_seen", "1");
      if (window.innerWidth <= 1040) {
        this.sideOpen = false;
        this.xrayOpen = false;
        this.applySidebars(false);
      }
      return;
    }

    const st = TOUR_STEPS[this.tourIdx];
    const compact = window.innerWidth <= 1040;
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
      this.tourIdx = -1;
      root.innerHTML = "";
      return;
    }

    const z = this._coordScale();
    const r = target.getBoundingClientRect();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    const sx = Math.max(4, (r.left / z) - 4);
    const sy = Math.max(4, (r.top / z) - 4);
    const sw = Math.min(vw - sx - 4, (r.width / z) + 8);
    const sh = Math.min(vh - sy - 4, (r.height / z) + 8);

    const cardW = Math.min(390, vw - 24);
    const cardH = Math.min(225, vh - 24);
    let cx = sx;
    let cy = sy + sh + 12;
    if (compact) {
      cx = Math.max(12, (vw - cardW) / 2);
      cy = st.pos === "top" || sy > vh * 0.5 ? 60 : Math.min(vh - cardH - 12, vh * 0.35);
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

    const dots = TOUR_STEPS.map((_, i) => `<i class="${i === this.tourIdx ? "on" : ""}"></i>`).join("");
    const en = this.lang === "en";
    const isLast = this.tourIdx === TOUR_STEPS.length - 1;

    root.innerHTML = `<div class="tour-layer">
      <div class="tour-spot" style="left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px"></div>
      <div class="tour-card" style="left:${cx}px;top:${cy}px">
        <div class="tour-top">
          <span class="tour-badge">${esc(this.biText(st.badge))}</span>
          <button class="tour-skip" id="tourSkipBtn">${en ? "Skip" : "跳过"}</button>
        </div>
        <h3>${esc(this.biText(st.title))}</h3>
        <p>${esc(this.biText(st.desc))}</p>
        <div class="tour-actions">
          <div class="tour-dots">${dots}</div>
          <div style="display:flex;gap:7px">
            ${this.tourIdx > 0 ? `<button class="btn ghost" id="tourPrevBtn">${en ? "Back" : "上一步"}</button>` : ""}
            <button class="btn primary" id="tourNextBtn">${isLast ? (en ? "Finish" : "开始探索") : (en ? "Next" : "下一步")}</button>
          </div>
        </div>
      </div>
    </div>`;

    document.getElementById("tourSkipBtn").addEventListener("click", () => {
      this.tourIdx = -1;
      this._renderTourStep();
    });
    document.getElementById("tourPrevBtn")?.addEventListener("click", () => {
      this.tourIdx--;
      this._renderTourStep();
    });
    document.getElementById("tourNextBtn").addEventListener("click", () => {
      this.tourIdx = isLast ? -1 : this.tourIdx + 1;
      this._renderTourStep();
    });
  },

  /* ============================================================
     Confirm Reset All Progress Modal (#3) + Hint Popover + Sandbox Drawer
     ============================================================ */
  openResetConfirm() {
    const root = document.getElementById("modalRoot");
    root.innerHTML = `<div class="modal-backdrop" id="confirmBackdrop">
      <div class="modal confirm" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-warn-ic"><svg class="ic"><use href="#i-warn"/></svg></div>
          <h2>${esc(this.t("confirmTtl"))}</h2>
        </div>
        <p>${esc(this.t("confirmMsg"))}</p>
        <div class="modal-actions">
          <button class="btn ghost" id="confirmCancel">${esc(this.t("confirmNo"))}</button>
          <button class="btn danger" id="confirmOk">${esc(this.t("confirmYes"))}</button>
        </div>
      </div>
    </div>`;
    const close = () => { root.innerHTML = ""; };
    document.getElementById("confirmCancel").addEventListener("click", close);
    document.getElementById("confirmBackdrop").addEventListener("click", (e) => {
      if (e.target.id === "confirmBackdrop") close();
    });
    document.getElementById("confirmOk").addEventListener("click", () => {
      close();
      this.completed.clear();
      localStorage.removeItem("ax_done");
      this.selectScenario(0);
      this.showToast(this.t("clearedAll"));
    });
  },

  _toggleHintPopover() {
    const existing = document.querySelector(".popover");
    if (existing) { existing.remove(); return; }
    const sc = SCENARIOS[this.scnIdx];
    const btn = document.getElementById("hintBtn");
    const rect = btn.getBoundingClientRect();
    const z = this._coordScale();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    const popW = Math.min(380, vw - 24);
    const pop = document.createElement("div");
    pop.className = "popover";
    pop.style.top = `${Math.min(vh - 200, (rect.bottom / z) + 8)}px`;
    pop.style.left = `${Math.max(12, Math.min(vw - popW - 12, (rect.right / z) - popW))}px`;
    const en = this.lang === "en";
    pop.innerHTML = `<h4><svg class="ic"><use href="#i-bulb"/></svg>${esc(this.t("howTo"))} · ${esc(this.biText(sc.title))}</h4>
      <ol>
        ${sc.steps.map(s => `<li><b>${esc(this.biText(s.label))}</b> — ${esc(this.biText(s.summary || s.label))}</li>`).join("")}
      </ol>
      <div class="tip2">${esc(this.biText(sc.hint))}</div>`;
    document.body.appendChild(pop);
    const closer = (e) => {
      if (!pop.contains(e.target) && e.target !== btn) {
        pop.remove();
        document.removeEventListener("click", closer);
      }
    };
    setTimeout(() => document.addEventListener("click", closer), 0);
  },

  openSandbox() {
    const root = document.getElementById("modalRoot");
    const en = this.lang === "en";
    const sb = this.sandbox;
    root.innerHTML = `<div class="sheet-backdrop" id="sbBack"></div>
      <div class="sheet">
        <h3>${en ? "Request Sandbox" : "请求参数沙盒"}</h3>
        <div class="sub">${en ? "Modify API parameters live and inspect how the Request JSON & fixed token overhead update in X-Ray." : "实时修改 API 参数，观察右侧「请求 JSON」与「固定 token 开销」如何随之变化。"}</div>
        <div class="field">
          <label><span>model</span><b>${esc(sb.model)}</b></label>
          <select id="sbModel">
            <option value="claude-sonnet-4-5" ${sb.model === "claude-sonnet-4-5" ? "selected" : ""}>claude-sonnet-4-5</option>
            <option value="claude-opus-4-1" ${sb.model === "claude-opus-4-1" ? "selected" : ""}>claude-opus-4-1</option>
            <option value="claude-haiku-4-5" ${sb.model === "claude-haiku-4-5" ? "selected" : ""}>claude-haiku-4-5</option>
          </select>
        </div>
        <div class="field">
          <label><span>temperature</span><b id="sbTempVal">${sb.temperature}</b></label>
          <input type="range" id="sbTemp" min="0" max="1" step="0.1" value="${sb.temperature}">
        </div>
        <div class="field">
          <label><span>tools[] count</span><b id="sbToolsVal">${sb.toolsEnabled} / 6</b></label>
          <input type="range" id="sbTools" min="0" max="6" step="1" value="${sb.toolsEnabled}">
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
          <button class="btn ghost" id="sbReset">${en ? "Defaults" : "恢复默认"}</button>
          <button class="btn primary" id="sbDone">${en ? "Apply & Close" : "应用并关闭"}</button>
        </div>
        <div class="sheet-note">${en ? "Fixed overhead (system + tools) is currently ~" : "当前固定开销（system + tools）约 "}<b>${XRay.fixedOverhead()}</b> tokens.</div>
      </div>`;

    const sync = () => {
      this.sandbox = {
        model: document.getElementById("sbModel").value,
        maxTokens: 8192,
        temperature: Number(document.getElementById("sbTemp").value),
        toolsEnabled: Number(document.getElementById("sbTools").value),
        stream: document.getElementById("sbStream").classList.contains("on"),
        system: document.getElementById("sbSystem").value
      };
      document.getElementById("sbTempVal").textContent = String(this.sandbox.temperature);
      document.getElementById("sbToolsVal").textContent = `${this.sandbox.toolsEnabled} / 6`;
      XRay.setSandbox(this.sandbox);
      this._updateComposerChips();
    };

    document.getElementById("sbModel").addEventListener("change", sync);
    document.getElementById("sbTemp").addEventListener("input", sync);
    document.getElementById("sbTools").addEventListener("input", sync);
    document.getElementById("sbSystem").addEventListener("input", sync);
    document.getElementById("sbStream").addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("on");
      sync();
    });
    document.getElementById("sbReset").addEventListener("click", () => {
      this.sandbox = { model: "claude-sonnet-4-5", maxTokens: 8192, temperature: 0.2, toolsEnabled: 6, stream: true, system: REQ_BASE.system };
      XRay.setSandbox(this.sandbox);
      this._updateComposerChips();
      this.openSandbox();
    });
    const close = () => { sync(); root.innerHTML = ""; };
    document.getElementById("sbDone").addEventListener("click", close);
    document.getElementById("sbBack").addEventListener("click", close);
  },

  _showTooltip(anchorEl, text) {
    const tip = document.getElementById("tooltip");
    if (!tip || !text) return;
    tip.textContent = text;
    tip.classList.add("on");
    const rect = anchorEl.getBoundingClientRect();
    const z = this._coordScale();
    const vw = window.innerWidth / z;
    const vh = window.innerHeight / z;
    tip.style.left = `${Math.min(vw - 310, (rect.right / z) + 10)}px`;
    tip.style.top = `${Math.max(10, Math.min(vh - 90, rect.top / z))}px`;
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

document.addEventListener("DOMContentLoaded", () => App.init());
