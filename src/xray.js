/* ============================================================
   Agent X-Ray — Right Inspector (5 views + live SSE pipeline)
   Matches styles.css classes and #xrayTabs container
   ============================================================ */

const FIELD_DOCS = {
  model:       { zh: "指定调用哪个模型。同一套协议可换不同能力的模型。", en: "Which model to call. Same protocol, different capabilities." },
  max_tokens:  { zh: "单次响应最多生成的 token 数上限。", en: "Upper bound on tokens generated in a single response." },
  temperature: { zh: "采样温度（0~1）。代码任务常用 0~0.3，越低越稳定。", en: "Sampling temperature (0–1). Coding uses 0–0.3; lower = steadier." },
  stream:      { zh: "是否通过 SSE 逐帧流式推送增量，而非整包等待。", en: "Whether to stream deltas over SSE instead of waiting for the full body." },
  system:      { zh: "开发者预置的规章与人设，排在每次请求最前面。", en: "Developer-preset rules & persona, placed first on every request." },
  tools:       { zh: "工具说明书数组：name、description 与参数 JSON Schema。", en: "Tool manual array: name, description, and parameter JSON Schema." },
  messages:    { zh: "完整对话历史（user / assistant 交替，含工具调用与结果）。", en: "Full conversation history (alternating user/assistant + tool blocks)." },
  content:     { zh: "模型返回的内容块数组（text / tool_use），由 SSE 增量拼装而来。", en: "Returned content blocks (text / tool_use) assembled from SSE deltas." },
  stop_reason: { zh: "本轮停止原因：tool_use 表示继续循环，end_turn 表示结束。", en: "Why generation stopped: tool_use continues the loop; end_turn ends it." },
  usage:       { zh: "本轮消耗的 input_tokens 与 output_tokens 计费明细。", en: "Token accounting for this round: input_tokens and output_tokens." },
  id:          { zh: "本次响应消息或工具调用块的唯一标识。", en: "Unique identifier of this response message or tool_use block." }
};

const XRAY_TABS = [
  { id: "request",  zh: "请求",   en: "Request",  bi: "请求 Req" },
  { id: "response", zh: "响应",   en: "Response", bi: "响应 Res" },
  { id: "context",  zh: "上下文", en: "Context",  bi: "上下文 Ctx" },
  { id: "flow",     zh: "流向",   en: "Flow",     bi: "流向 Flow" },
  { id: "tree",     zh: "分支",   en: "Branch",   bi: "分支 Tree" }
];

const FLOW_NODES = [
  { id: "client", x: 14,  y: 122, w: 112, h: 64, label: "你的界面|Your UI",      sub: "chat · input" },
  { id: "agent",  x: 156, y: 122, w: 138, h: 64, label: "Agent 循环|Agent Loop", sub: "while (tool_use)" },
  { id: "api",    x: 324, y: 20,  w: 124, h: 64, label: "模型 API|Model API",    sub: "Claude / SSE" },
  { id: "tools",  x: 324, y: 122, w: 124, h: 64, label: "内置工具|Built-in",     sub: "Read · Edit · Bash" },
  { id: "mcp",    x: 324, y: 224, w: 124, h: 64, label: "MCP 服务|MCP Server",   sub: "JSON-RPC stdio" }
];

const FLOW_EDGES = [
  { id: "e_client_agent", x1: 126, y1: 154, x2: 156, y2: 154 },
  { id: "e_agent_api",    x1: 225, y1: 122, x2: 324, y2: 52  },
  { id: "e_api_agent",    x1: 324, y1: 68,  x2: 244, y2: 122 },
  { id: "e_agent_tools",  x1: 294, y1: 146, x2: 324, y2: 146 },
  { id: "e_tools_agent",  x1: 324, y1: 162, x2: 294, y2: 162 },
  { id: "e_agent_mcp",    x1: 225, y1: 186, x2: 324, y2: 256 }
];

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function approxTokens(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj || "");
  return Math.max(1, Math.round(s.length / 3.6));
}

function parseDeltaSafe(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

const XRay = {
  tab: "request",
  reqView: "json",      // independent switcher: "json" | "cards"
  resView: "cards",     // independent switcher: "cards" | "json"
  lang: "bi",           // "bi" | "zh" | "en"
  focusKey: null,
  _lastFocusKey: null,
  selectedField: null,
  state: {
    request: null,
    response: [],
    streamActive: false,
    streamBuffer: null,
    context: { messages: [], used: 0, budget: 200000 },
    flow: { active: ["agent"], edge: "", label: "" },
    tree: { nodes: [], current: null }
  },
  sandbox: { model: "claude-sonnet-4-5", maxTokens: 8192, temperature: 0.2, toolsEnabled: 6, stream: true, system: REQ_BASE.system },
  onBranchSelect: null,

  init(opts = {}) {
    if (opts.onBranchSelect) this.onBranchSelect = opts.onBranchSelect;
    this._renderTabs();
    this.render();
  },

  _isEn() {
    return this.lang === "en";
  },

  _bi(s) {
    if (!s || !s.includes("|")) return s || "";
    const [zh, en] = s.split("|");
    return this._isEn() ? en : zh;
  },

  _renderTabs() {
    const el = document.getElementById("xrayTabs");
    if (!el) return;
    el.innerHTML = XRAY_TABS.map(t => {
      const lbl = this.lang === "en" ? t.en : this.lang === "zh" ? t.zh : t.bi;
      return `<button class="tab${this.tab === t.id ? " on" : ""}" data-tab="${t.id}">${escHtml(lbl)}</button>`;
    }).join("");
    el.querySelectorAll(".tab").forEach(b => {
      b.addEventListener("click", () => this.setTab(b.dataset.tab));
    });
  },

  setLang(l) {
    this.lang = l;
    this._renderTabs();
    this.render();
  },

  setTab(t) {
    this.tab = t;
    document.querySelectorAll("#xrayTabs .tab").forEach(b => {
      b.classList.toggle("on", b.dataset.tab === t);
    });
    this.render();
  },

  setSandbox(sb) {
    this.sandbox = { ...this.sandbox, ...sb };
    if (this.state.request) {
      this.state.request = this._applySandbox(this.state.request);
    }
    this.render({ skipScroll: true });
  },

  _applySandbox(req) {
    const r = JSON.parse(JSON.stringify(req));
    r.model = this.sandbox.model;
    r.max_tokens = this.sandbox.maxTokens;
    r.temperature = this.sandbox.temperature;
    r.stream = this.sandbox.stream;
    if (this.sandbox.system) r.system = this.sandbox.system;
    if (Array.isArray(REQ_BASE.tools)) {
      r.tools = REQ_BASE.tools.slice(0, this.sandbox.toolsEnabled);
    }
    return r;
  },

  fixedOverhead() {
    const req = this.state.request || this._applySandbox(REQ_BASE);
    return approxTokens(req.system || "") + approxTokens(req.tools || []);
  },

  contextMessages() {
    return this.state.context?.messages || [];
  },

  reset() {
    this.focusKey = null;
    this._lastFocusKey = null;
    this.selectedField = null;
    this.state = {
      request: null,
      response: [],
      streamActive: false,
      streamBuffer: null,
      context: { messages: [], used: 0, budget: 200000 },
      flow: { active: ["agent"], edge: "", label: "" },
      tree: { nodes: [], current: null }
    };
    this.render();
  },

  beginSSE(opts = {}) {
    this.state.response = [];
    this.state.streamActive = true;
    this.state.streamBuffer = {
      id: "msg_streaming",
      model: this.sandbox.model,
      blocks: [],
      usage: { input_tokens: 0, output_tokens: 0 },
      stop_reason: null
    };
    this.focusKey = "content";
    this._lastFocusKey = null;
    if (!opts.silent) {
      this.tab = "response";
      this._renderTabs();
    }
    this.render({ skipScroll: !!opts.silent });
  },

  pushSSEFrame(frame, opts = {}) {
    if (!this.state.streamBuffer) this.beginSSE({ silent: true });
    this.state.response.forEach(f => { f.justArrived = false; });
    this.state.response.push({
      ev: frame.ev,
      dt: frame.dt,
      ms: frame.ms || 120,
      justArrived: !opts.silent
    });

    const buf = this.state.streamBuffer;
    const obj = parseDeltaSafe(frame.dt);
    if (obj) {
      if (frame.ev === "message_start" && obj.message) {
        if (obj.message.id) buf.id = obj.message.id;
        if (obj.message.model) buf.model = obj.message.model;
        if (obj.message.usage?.input_tokens != null) buf.usage.input_tokens = obj.message.usage.input_tokens;
      } else if (frame.ev === "content_block_start" && obj.content_block) {
        const idx = obj.index ?? buf.blocks.length;
        const cb = obj.content_block;
        buf.blocks[idx] = {
          type: cb.type || "text",
          id: cb.id || null,
          name: cb.name || null,
          text: cb.text || "",
          partial_json: ""
        };
      } else if (frame.ev === "content_block_delta" && obj.delta) {
        const idx = obj.index ?? Math.max(0, buf.blocks.length - 1);
        const blk = buf.blocks[idx] || (buf.blocks[idx] = { type: "text", text: "", partial_json: "" });
        if (obj.delta.type === "text_delta" && typeof obj.delta.text === "string") {
          blk.text += obj.delta.text;
        } else if (obj.delta.type === "input_json_delta" && typeof obj.delta.partial_json === "string") {
          blk.partial_json += obj.delta.partial_json;
        }
      } else if (frame.ev === "message_delta") {
        if (obj.delta?.stop_reason) buf.stop_reason = obj.delta.stop_reason;
        if (obj.usage?.output_tokens != null) buf.usage.output_tokens = obj.usage.output_tokens;
      } else if (frame.ev === "message_stop") {
        this.state.streamActive = false;
      }
    }
    if (frame.ev === "message_stop") this.state.streamActive = false;
    this.render({ skipScroll: !!opts.silent, streamTick: true });
  },

  applyPatch(patch, opts = {}) {
    if (!patch) return;
    if (patch.request) this.state.request = this._applySandbox(patch.request);
    if (patch.response) {
      this.state.response = [];
      this.state.streamActive = false;
      this.state.streamBuffer = null;
      if (Array.isArray(patch.response) && patch.response.length) {
        this.beginSSE({ silent: true });
        patch.response.forEach(f => this.pushSSEFrame(f, { silent: true }));
        this.state.streamActive = false;
      }
    }
    if (patch.context) this.state.context = patch.context;
    if (patch.flow)    this.state.flow = patch.flow;
    if (patch.tree)    this.state.tree = patch.tree;
    if ("focus" in patch) {
      this.focusKey = patch.focus || null;
      this._lastFocusKey = null;
    } else if (patch.request) {
      this.focusKey = null;
      this._lastFocusKey = null;
    }
    if (patch.tab && !opts.silentTab) {
      this.tab = patch.tab;
      this._renderTabs();
    }
    this.render({ skipScroll: !!opts.silent });
  },

  render(opts = {}) {
    const body = document.getElementById("xrayBody");
    if (!body) return;

    if (this.tab === "request")       body.innerHTML = this.renderRequest();
    else if (this.tab === "response") body.innerHTML = this.renderResponse();
    else if (this.tab === "context")  body.innerHTML = this.renderContext();
    else if (this.tab === "flow")     body.innerHTML = this.renderFlow();
    else if (this.tab === "tree")     body.innerHTML = this.renderTree();

    this._bindInteractions(body);

    if (!opts.skipScroll && this.focusKey && this.focusKey !== this._lastFocusKey) {
      this._lastFocusKey = this.focusKey;
      requestAnimationFrame(() => {
        const target = body.querySelector(".json-focus-ring");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    if (opts.streamTick && !opts.skipScroll && this.tab === "response") {
      requestAnimationFrame(() => {
        const feed = body.querySelector(".sse-list");
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
    }
  },

  _bindInteractions(body) {
    body.querySelectorAll("[data-reqview]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.reqView = btn.dataset.reqview;
        this._lastFocusKey = null;
        this.render();
      });
    });

    body.querySelectorAll("[data-resview]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.resView = btn.dataset.resview;
        this._lastFocusKey = null;
        this.render();
      });
    });

    body.querySelectorAll(".jfold").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const node = btn.closest(".jnode");
        if (node) {
          const folded = node.classList.toggle("folded");
          btn.textContent = folded ? "▸" : "▾";
        }
      });
    });

    body.querySelectorAll(".jk[data-field]").forEach(k => {
      k.addEventListener("click", e => {
        e.stopPropagation();
        this.selectedField = k.dataset.field;
        this.render({ skipScroll: true });
      });
    });

    body.querySelectorAll("[data-copy-json]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const type = btn.dataset.copyJson;
        const payload = type === "req"
          ? (this.state.request || this._applySandbox(REQ_BASE))
          : this._buildFullResponseObj();
        try {
          await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
          btn.textContent = this._isEn() ? "Copied!" : "已复制!";
          setTimeout(() => { btn.textContent = this._isEn() ? "Copy" : "复制"; }, 1200);
        } catch {}
      });
    });

    body.querySelectorAll(".tree-node[data-nid]").forEach(n => {
      n.addEventListener("click", () => {
        if (this.onBranchSelect) this.onBranchSelect(n.dataset.nid);
      });
    });
  },

  _modeBar(attr, mode, labelText, copyType) {
    const en = this._isEn();
    return `<div class="xr-mode-bar">
      <span class="lbl">${escHtml(labelText)}</span>
      <div style="display:flex;align-items:center;gap:6px">
        ${this.focusKey ? `<span class="tag acc">${en ? "Focus" : "聚焦"}: ${escHtml(this.focusKey)}</span>` : ""}
        <div class="xr-seg" role="group">
          <button ${attr}="cards" class="${mode === "cards" ? "on" : ""}">${en ? "Cards" : "卡片"}</button>
          <button ${attr}="json"  class="${mode === "json"  ? "on" : ""}">${en ? "Full JSON" : "完整 JSON"}</button>
        </div>
        <button class="btn" style="padding:4px 9px;font-size:11.5px" data-copy-json="${copyType}">${en ? "Copy" : "复制"}</button>
      </div>
    </div>`;
  },

  /* ============================================================
     1. REQUEST TAB — Independent [Cards | Full JSON] + JSON Focus
     ============================================================ */
  renderRequest() {
    const req = this.state.request || this._applySandbox(REQ_BASE);
    const en = this._isEn();
    const tok = approxTokens(req);
    const bar = this._modeBar("data-reqview", this.reqView, `POST /v1/messages · ≈ ${tok} tok`, "req");

    const doc = this.selectedField && FIELD_DOCS[this.selectedField]
      ? `<div class="xray-note"><span class="lbl">${escHtml(this.selectedField)}</span>${escHtml(FIELD_DOCS[this.selectedField][en ? "en" : "zh"])}</div>`
      : "";

    if (this.reqView === "cards") {
      const msgs = req.messages || [];
      const tools = req.tools || [];
      const fSys = this.focusKey === "system" ? " json-focus-ring" : "";
      const fTools = this.focusKey === "tools" ? " json-focus-ring" : "";
      const fMsgs = this.focusKey === "messages" ? " json-focus-ring" : "";
      return `${bar}${doc}
        <div class="xr-card">
          <div class="xr-card-h">
            <b>${en ? "Model & Parameters" : "模型与参数"}</b>
            <div class="right"><span class="tag acc">${req.stream ? "stream: true" : "stream: false"}</span></div>
          </div>
          <div class="xr-kv-grid">
            <div class="xr-kv-item"><div class="k">model</div><div class="v">${escHtml(req.model)}</div></div>
            <div class="xr-kv-item"><div class="k">max_tokens</div><div class="v">${req.max_tokens}</div></div>
            <div class="xr-kv-item"><div class="k">temperature</div><div class="v">${req.temperature}</div></div>
            <div class="xr-kv-item"><div class="k">tools / msgs</div><div class="v">${tools.length} / ${msgs.length}</div></div>
          </div>
        </div>

        <div class="xr-card${fSys}">
          <div class="xr-card-h">
            <b>system</b>
            <div class="right"><span class="tag blu">≈ ${approxTokens(req.system)} tok</span></div>
          </div>
          <div class="xr-sys-box">${escHtml(typeof req.system === "string" ? req.system : JSON.stringify(req.system, null, 2))}</div>
        </div>

        <div class="xr-card${fTools}">
          <div class="xr-card-h">
            <b>tools[] (${tools.length})</b>
            <div class="right"><span class="tag">≈ ${approxTokens(tools)} tok</span></div>
          </div>
          <div class="xr-tool-list">
            ${tools.map(t => `<div class="xr-tool-card">
              <div class="th"><span>${escHtml(t.name)}</span><span class="tag">${(t.input_schema?.required || []).join(", ")}</span></div>
              <div class="td">${escHtml(t.description)}</div>
              <pre>${escHtml(JSON.stringify(t.input_schema, null, 2))}</pre>
            </div>`).join("")}
          </div>
        </div>

        <div class="xr-card${fMsgs}">
          <div class="xr-card-h">
            <b>messages[] (${msgs.length})</b>
            <div class="right"><span class="tag grn">≈ ${approxTokens(msgs)} tok</span></div>
          </div>
          <div class="xr-msg-cards">
            ${msgs.length
              ? msgs.map((m, i) => `<div class="xr-msg-card${this.focusKey === "messages" && i === msgs.length - 1 ? " json-focus-ring" : ""}">
                  <div class="mh"><span class="tag ${m.role === "user" ? "acc" : "grn"}">#${i + 1} · ${escHtml(m.role)}</span><span>≈ ${approxTokens(m.content)} tok</span></div>
                  <div class="mb">${escHtml(typeof m.content === "string" ? m.content : JSON.stringify(m.content, null, 2))}</div>
                </div>`).join("")
              : `<div class="empty-xray" style="padding:18px">${en ? "No messages sent yet — press play or type below." : "尚未发出消息 — 点自动演示或在下方输入试试。"}</div>`
            }
          </div>
        </div>`;
    }

    // Full JSON view with collapsible .jnode + auto-focus ring
    const htmlJson = this._renderJSONVal(req, 0, this.focusKey, null);
    return `${bar}${doc}
      <div class="xr-card">
        <div class="xr-card-h">
          <b>Request JSON</b>
          <span class="tag">${en ? "click blue keys for docs" : "点击蓝色字段看说明"}</span>
          <div class="right"><span class="tag acc">${(req.messages || []).length} msgs</span></div>
        </div>
        <div class="json">${htmlJson}</div>
      </div>`;
  },

  _renderJSONVal(val, depth, focusKey, keyName) {
    if (val === null) return `<span class="jb">null</span>`;
    if (typeof val === "boolean") return `<span class="jb">${val}</span>`;
    if (typeof val === "number") return `<span class="jn">${val}</span>`;
    if (typeof val === "string") {
      const clean = val.length > 260 ? val.slice(0, 260) + "…" : val;
      return `<span class="js">"${escHtml(clean)}"</span>`;
    }

    const isArr = Array.isArray(val);
    const entries = isArr ? val.map((v, i) => [null, v]) : Object.entries(val);
    const open = isArr ? "[" : "{";
    const close = isArr ? "]" : "}";
    if (!entries.length) return `${open}${close}`;

    const isFocus = keyName && focusKey && keyName === focusKey;
    // Unfold focused node automatically; fold tools at depth=1 unless focused
    const folded = !isFocus && keyName === "tools" && depth === 1 && entries.length > 2;
    const indent = "  ".repeat(depth);
    const childIndent = "  ".repeat(depth + 1);

    const inner = entries.map(([k, v], i) => {
      const comma = i < entries.length - 1 ? "," : "";
      const kIsFocus = k && focusKey && k === focusKey;
      const kHtml = k !== null
        ? `<span class="jk${this.selectedField === k ? " sel" : ""}"${FIELD_DOCS[k] ? ` data-field="${escHtml(k)}"` : ""}>"${escHtml(k)}"</span>: `
        : "";
      const vRendered = this._renderJSONVal(v, depth + 1, focusKey, k);
      const line = `${childIndent}${kHtml}${vRendered}${comma}`;
      return kIsFocus ? `__BLOCK_START__<span class="jfocus-row json-focus-ring">${line}</span>__BLOCK_END__` : line;
    }).join("\n")
      .replace(/\n?__BLOCK_START__/g, "")
      .replace(/__BLOCK_END__\n?/g, "");

    const summary = isArr ? ` … ${entries.length} items ` : ` … ${entries.length} keys `;
    return `<span class="jnode${folded ? " folded" : ""}"><span class="jfold">${folded ? "▸" : "▾"}</span>${open}<span class="jellipsis">${summary}</span><span class="jbody">\n${inner}\n${indent}</span>${close}</span>`;
  },

  /* ============================================================
     2. RESPONSE TAB — Live SSE Pipeline + Independent [Cards | Full JSON]
     ============================================================ */
  _buildFullResponseObj() {
    const buf = this.state.streamBuffer;
    if (!buf) {
      return {
        id: "msg_waiting",
        type: "message",
        role: "assistant",
        model: this.sandbox.model,
        content: [],
        stop_reason: null,
        usage: { input_tokens: 0, output_tokens: 0 }
      };
    }
    const content = (buf.blocks || []).filter(Boolean).map(b => {
      if (b.type === "tool_use") {
        let parsed = b.partial_json;
        try { parsed = JSON.parse(b.partial_json || "{}"); } catch {}
        return { type: "tool_use", id: b.id || "toolu_01", name: b.name || "Tool", input: parsed };
      }
      return { type: "text", text: b.text || "" };
    });
    return {
      id: buf.id,
      type: "message",
      role: "assistant",
      model: buf.model,
      content,
      stop_reason: buf.stop_reason || (this.state.streamActive ? "streaming…" : "end_turn"),
      usage: buf.usage
    };
  },

  renderResponse() {
    const frames = this.state.response || [];
    const en = this._isEn();
    const bar = this._modeBar(
      "data-resview",
      this.resView,
      en ? `SSE Stream · ${frames.length} frames` : `SSE 响应 · ${frames.length} 帧`,
      "res"
    );

    if (!frames.length && !this.state.streamActive) {
      return `${bar}<div class="empty-xray">
        <svg class="ic"><use href="#i-stream"/></svg>
        <div>${en ? "Waiting for model response…<br>Play a step with streaming or API calls to watch SSE frames arrive and assemble live." : "等待模型响应…<br>播放包含网络请求或流式输出的步骤，这里会实时展示 SSE 管道传输、逐帧到达与 JSON 拼装。"}</div>
      </div>`;
    }

    const isLive = this.state.streamActive;
    const buf = this.state.streamBuffer || { blocks: [], usage: { input_tokens: 0, output_tokens: 0 }, stop_reason: null };
    const statusCls = isLive ? "live" : "done";
    const statusLbl = isLive ? (en ? "Streaming SSE" : "实时流式接收") : (en ? "Assembled" : "拼装完成");

    const pipelineCard = `<div class="xr-card">
      <div class="xr-card-h">
        <b>${en ? "Live SSE Pipeline" : "SSE 流式传输管道"}</b>
        <span class="wave ${isLive ? "live" : ""}"><i></i><i></i><i></i><i></i></span>
        <div class="right">
          <span class="stream-status ${statusCls}"><i></i>${statusLbl}</span>
        </div>
      </div>
      <div class="stream-pipe">
        <span class="pipe-node ${isLive ? "on" : ""}">${en ? "Model" : "模型"}</span>
        <div class="pipe-track ${statusCls}"></div>
        <span class="pipe-node on">${en ? "SSE Buffer" : "增量缓冲区"} (${frames.length})</span>
        <div class="pipe-track ${statusCls}"></div>
        <span class="pipe-node ${!isLive ? "on" : ""}">${en ? "UI / Tool" : "界面 / 工具"}</span>
      </div>
    </div>`;

    if (this.resView === "json") {
      const fullObj = this._buildFullResponseObj();
      const doc = this.selectedField && FIELD_DOCS[this.selectedField]
        ? `<div class="xray-note"><span class="lbl">${escHtml(this.selectedField)}</span>${escHtml(FIELD_DOCS[this.selectedField][en ? "en" : "zh"])}</div>`
        : "";
      const htmlJson = this._renderJSONVal(fullObj, 0, this.focusKey, null);
      return `${bar}${pipelineCard}${doc}
        <div class="xr-card">
          <div class="xr-card-h">
            <b>Response JSON</b>
            <span class="tag">${en ? "assembled from SSE" : "由 SSE 增量拼装"}</span>
            <div class="right"><span class="tag grn">${escHtml(buf.stop_reason || (isLive ? "streaming" : "end_turn"))}</span></div>
          </div>
          <div class="json">${htmlJson}</div>
        </div>`;
    }

    // Cards view: live buffer preview + accounting + raw SSE frame stream
    const blocks = (buf.blocks || []).filter(Boolean);
    const bufferPreviews = blocks.map((b, i) => {
      if (b.type === "tool_use") {
        let pretty = b.partial_json || "";
        let valid = false;
        try {
          pretty = JSON.stringify(JSON.parse(b.partial_json), null, 2);
          valid = true;
        } catch {}
        return `<div class="sse-preview is-json"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span class="tag acc">tool_use #${i}: ${escHtml(b.name || "…")}</span><span class="tag ${valid ? "grn" : ""}">${valid ? (en ? "Valid JSON ✓" : "JSON 已闭合 ✓") : (en ? "Assembling…" : "拼接中…")}</span></div>${escHtml(pretty || "{}")}${isLive ? '<span class="cursor"></span>' : ""}</div>`;
      }
      return `<div class="sse-preview"><div style="margin-bottom:5px"><span class="tag blu">text #${i} · ${(b.text || "").length} chars</span></div>${escHtml(b.text || "")}${isLive ? '<span class="cursor"></span>' : ""}</div>`;
    }).join("");

    const fContent = this.focusKey === "content" ? " json-focus-ring" : "";
    const fUsage = this.focusKey === "usage" ? " json-focus-ring" : "";

    const bufferCard = `<div class="xr-card${fContent}">
      <div class="xr-card-h">
        <b>${en ? "Live Assembled Buffer" : "实时拼装缓冲区"} (content[])</b>
        <div class="right"><span class="tag grn">${escHtml(buf.stop_reason || (isLive ? "streaming" : "end_turn"))}</span></div>
      </div>
      <div style="padding:10px 12px 2px">
        ${bufferPreviews || `<div class="sse-preview"><span class="ph">${en ? "Waiting for first content_block…" : "等待首个 content_block…"}</span></div>`}
      </div>
    </div>`;

    const usageCard = `<div class="xr-card${fUsage}">
      <div class="xr-card-h">
        <b>${en ? "Accounting & Stop Signal" : "结算与停止原因"} (usage)</b>
        <div class="right"><span class="tag">${escHtml(buf.id)}</span></div>
      </div>
      <div class="xr-kv-grid">
        <div class="xr-kv-item"><div class="k">input_tokens</div><div class="v">${buf.usage?.input_tokens ?? 0}</div></div>
        <div class="xr-kv-item"><div class="k">output_tokens</div><div class="v">${buf.usage?.output_tokens ?? 0}</div></div>
        <div class="xr-kv-item"><div class="k">stop_reason</div><div class="v">${escHtml(buf.stop_reason || "pending")}</div></div>
        <div class="xr-kv-item"><div class="k">frames</div><div class="v">${frames.length}</div></div>
      </div>
    </div>`;

    const rows = frames.map((f, idx) => `<div class="sse-row${f.justArrived ? " fresh" : ""}">
      <div class="ev">#${idx + 1} ${escHtml(f.ev)}<span class="dt-ms">${f.ms ? f.ms + " ms" : ""}</span></div>
      <div class="dt">${escHtml(f.dt)}</div>
    </div>`).join("");

    const feedCard = `<div class="xr-card">
      <div class="xr-card-h">
        <b>${en ? "Raw SSE Frames" : "SSE 原始帧流"}</b>
        <div class="right"><span class="tag">text/event-stream</span></div>
      </div>
      <div style="padding:10px 12px" class="sse-list">${rows}</div>
    </div>`;

    return `${bar}${pipelineCard}${bufferCard}${usageCard}${feedCard}`;
  },

  /* ============================================================
     3. CONTEXT TAB — Token bar + message array
     ============================================================ */
  renderContext() {
    const en = this._isEn();
    const ctx = this.state.context || { messages: [], used: 0, budget: 200000 };
    const msgs = ctx.messages || [];
    const req = this.state.request || this._applySandbox(REQ_BASE);
    const sysTok = approxTokens(req.system || "");
    const toolsTok = approxTokens(req.tools || []);
    const msgTok = ctx.used || 0;
    const budget = ctx.budget || 200000;
    const total = sysTok + toolsTok + msgTok;

    const pSys = Math.min(100, (sysTok / budget) * 100);
    const pTls = Math.min(100 - pSys, (toolsTok / budget) * 100);
    const pMsg = Math.max(msgTok > 0 ? 1 : 0, Math.min(100 - pSys - pTls, (msgTok / budget) * 100));

    const meter = `<div class="xr-card">
      <div class="xr-card-h">
        <b>${en ? "Context Window Budget" : "上下文窗口预算"}</b>
        <div class="right"><span class="tag acc">${total.toLocaleString()} / ${budget.toLocaleString()}</span></div>
      </div>
      <div style="padding:11px 13px">
        <div class="tok-stats">
          <span>${en ? "Total sent every round" : "每轮发送总计"}</span>
          <span>${((total / budget) * 100).toFixed(2)}%</span>
        </div>
        <div class="tokbar">
          <i style="width:${pSys.toFixed(2)}%;background:var(--blue)"></i>
          <i style="width:${pTls.toFixed(2)}%;background:var(--purple)"></i>
          <i style="width:${pMsg.toFixed(2)}%;background:var(--accent)"></i>
        </div>
        <div class="tok-legend">
          <span><i style="background:var(--blue)"></i>system ${sysTok.toLocaleString()}</span>
          <span><i style="background:var(--purple)"></i>tools ${toolsTok.toLocaleString()}</span>
          <span><i style="background:var(--accent)"></i>messages ${msgTok.toLocaleString()}</span>
        </div>
      </div>
    </div>`;

    const rows = msgs.map((m, i) => {
      const cls = m.role === "user" ? (String(m.text).startsWith("tool_result") ? "t" : "u") : "a";
      return `<div class="mrow">
        <span class="r ${cls}">#${i + 1} ${escHtml(m.role)}</span>
        <span class="c">${escHtml(m.text)}</span>
        <span class="tk">${m.tokens} tok</span>
      </div>`;
    }).join("");

    return `${meter}
      <div class="xr-card">
        <div class="xr-card-h">
          <b>messages[] (${msgs.length})</b>
          <div class="right"><span class="tag grn">${msgTok.toLocaleString()} tok</span></div>
        </div>
        <div style="padding:8px 12px" class="msglist">
          ${rows || `<div class="empty-xray" style="padding:20px">${en ? "No messages in history yet" : "暂无对话历史消息"}</div>`}
        </div>
      </div>`;
  },

  /* ============================================================
     4. FLOW TAB — Interactive architecture SVG
     ============================================================ */
  renderFlow() {
    const en = this._isEn();
    const fl = this.state.flow || { active: ["agent"], edge: "", label: "" };
    const active = new Set(fl.active || []);

    const edgesSvg = FLOW_EDGES.map(e => {
      const isOn = fl.edge === e.id;
      const isDiagUp = e.id === "e_agent_api" || e.id === "e_api_agent";
      const isDiagDn = e.id === "e_agent_mcp";
      const mx = (e.x1 + e.x2) / 2 + (isDiagUp ? -26 : isDiagDn ? -26 : 0);
      const my = (e.y1 + e.y2) / 2 + (isDiagUp ? -18 : isDiagDn ? 22 : -14);
      return `<g>
        <line class="edge ${isOn ? "active" : ""}" x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}" marker-end="url(#${isOn ? "arrOn" : "arr"})"/>
        ${isOn ? `<circle class="particle" r="3.8"><animate attributeName="cx" from="${e.x1}" to="${e.x2}" dur="1.1s" repeatCount="indefinite"/><animate attributeName="cy" from="${e.y1}" to="${e.y2}" dur="1.1s" repeatCount="indefinite"/></circle>` : ""}
        ${isOn && fl.label ? `<text class="edge-label active" x="${mx}" y="${my}" text-anchor="middle">${escHtml(fl.label)}</text>` : ""}
      </g>`;
    }).join("");

    const nodesSvg = FLOW_NODES.map(n => {
      const isOn = active.has(n.id);
      const title = this._bi(n.label);
      return `<g class="node ${isOn ? "active" : ""}">
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10"/>
        <text x="${n.x + n.w / 2}" y="${n.y + 27}" text-anchor="middle">${escHtml(title)}</text>
        <text class="nsub" x="${n.x + n.w / 2}" y="${n.y + 46}" text-anchor="middle">${escHtml(n.sub)}</text>
      </g>`;
    }).join("");

    return `<div class="flow-wrap">
      <svg class="flow-svg" viewBox="0 0 462 308">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--muted)"/>
          </marker>
          <marker id="arrOn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent)"/>
          </marker>
        </defs>
        ${edgesSvg}
        ${nodesSvg}
      </svg>
    </div>
    <div class="xray-note">
      <span class="lbl">${en ? "Signal Path" : "信号流向说明"}</span>
      ${en ? "Highlighted boxes show which runtime components are active in this beat; the animated orange dot shows the direction of data/control." : "亮起的节点表示当前步骤参与工作的组件，流动的橙色光点表示请求、响应或工具结果的流向。"}
    </div>`;
  },

  /* ============================================================
     5. TREE TAB — Interactive Branch & Rollback tree
     ============================================================ */
  renderTree() {
    const en = this._isEn();
    const tr = this.state.tree || { nodes: [], current: null };
    const nodes = tr.nodes || [];
    if (!nodes.length) {
      return `<div class="empty-xray">
        <svg class="ic"><use href="#i-branch"/></svg>
        <div>${en ? "No branches yet.<br>Play Branching or Capstone scenarios, or hover any user message and click “Fork from here”." : "还没有分叉树。<br>播放「对话分支与回滚」或「综合实战」，或在对话区悬停用户消息点「从这里分叉」。"}</div>
      </div>`;
    }

    const pos = {};
    let maxX = 0, maxY = 0;
    nodes.forEach(n => {
      const cx = 16 + (n.x || 0) * 234;
      const cy = 16 + (n.y || 0) * 74;
      pos[n.id] = { x: cx, y: cy, w: 212, h: 52 };
      maxX = Math.max(maxX, cx + 226);
      maxY = Math.max(maxY, cy + 70);
    });

    const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
    const activeSet = new Set();
    let cur = tr.current;
    while (cur && byId[cur]) {
      activeSet.add(cur);
      cur = byId[cur].parent;
    }

    const edges = nodes.filter(n => n.parent && pos[n.parent]).map(n => {
      const p = pos[n.parent];
      const c = pos[n.id];
      const x1 = p.x + p.w / 2, y1 = p.y + p.h;
      const x2 = c.x + c.w / 2, y2 = c.y;
      const on = activeSet.has(n.id);
      return `<path class="tree-edge ${on ? "active" : ""}" d="M ${x1} ${y1} C ${x1} ${y1 + 14}, ${x2} ${y2 - 14}, ${x2} ${y2}"/>`;
    }).join("");

    const boxes = nodes.map(n => {
      const p = pos[n.id];
      const isCur = n.id === tr.current;
      const isAct = activeSet.has(n.id);
      return `<g class="tree-node ${isCur ? "current" : isAct ? "active" : ""}" data-nid="${escHtml(n.id)}">
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="9"/>
        <text x="${p.x + 12}" y="${p.y + 22}">${escHtml(this._bi(n.label))}</text>
        <text class="tsub" x="${p.x + 12}" y="${p.y + 40}">${escHtml(n.sub || "")}</text>
      </g>`;
    }).join("");

    return `<div class="tree-wrap">
      <svg class="tree-svg" viewBox="0 0 ${Math.max(440, maxX)} ${Math.max(250, maxY)}">
        ${edges}
        ${boxes}
      </svg>
    </div>
    <div class="xray-note">
      <span class="lbl">${en ? "Interactive Tree" : "交互分支树"}</span>
      ${en ? "Click any node to switch or rewind to that branch. Forking creates zero-cost message pointers; file checkpoints restore edits." : "点击任意节点可切换或回滚到该分支。绿虚线框为当前节点，橙框为当前激活路径。"}
    </div>`;
  }
};
