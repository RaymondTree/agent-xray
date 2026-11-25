/* ============================================================
   Agent X-Ray — scenario data (bilingual zh/en)
   Beat types:
     user   {t,zh,en}                       user bubble
     think  {t,zh,en}                       thinking block
     say    {t,zh,en}                       assistant text (streamed)
     tool   {t,name,arg,kind,input,output,ms,note:{zh,en}}
     note   {t,kind:'key|info|warn',zh,en}
     code   {t,title,lang,code}
     http   {t,method,url,status,ms}
     perm   {t,cmd,risk:{zh,en},allow:{zh,en},deny:{zh,en},choice}
     sub    {t,task:{zh,en},child:{zh,en},result:{zh,en}}
     compact{t,from,to,summary:{zh,en}}
     mcp    {t,rows:[{dir:'req'|'res',json}]}
     mem    {t,lines:[{p,text,cls}]}
     sse    {t,frames:[{ev,dt,ms}],focus}   live frame-by-frame SSE stream
     done   {t,stats:{k:v}}
     xr     {t,patch:{request,response,context,flow,tree,tab,focus}}
   ============================================================ */

const REQ_BASE = {
  model: "claude-sonnet-4-5",
  max_tokens: 8192,
  temperature: 0.2,
  stream: true,
  system: "You are a coding agent. You have tools to read, edit and run code…",
  tools: [
    { name: "Read",  description: "Read a file from disk",        input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
    { name: "Edit",  description: "Replace text in a file",       input_schema: { type: "object", properties: { path: { type: "string" }, old: { type: "string" }, next: { type: "string" } }, required: ["path", "old", "next"] } },
    { name: "Bash",  description: "Run a shell command",          input_schema: { type: "object", properties: { cmd: { type: "string" } }, required: ["cmd"] } },
    { name: "Grep",  description: "Search text across files",     input_schema: { type: "object", properties: { pattern: { type: "string" }, dir: { type: "string" } }, required: ["pattern"] } },
    { name: "Glob",  description: "List files matching a pattern",input_schema: { type: "object", properties: { pattern: { type: "string" } }, required: ["pattern"] } },
    { name: "Write", description: "Create or overwrite a file",   input_schema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } }
  ],
  messages: []
};

const SCENARIOS = [
/* ================================================================
   01 — The Agent Loop
   ================================================================ */
{
  id: "loop", icon: "i-loop",
  title: { zh: "Agent 主循环", en: "The Agent Loop" },
  sub: { zh: "一个 while 循环：问模型 → 模型说要调工具 → 执行工具 → 把结果喂回去 → 再问…直到模型说「我做完了」。",
         en: "One while-loop: ask the model → it asks for a tool → run the tool → feed the result back → ask again… until it says “done”." },
  hint: { zh: "点「自动演示」或悬停步骤条，一步步看 Agent 如何自己转完一整圈。也可以在下方输入框打字试试。",
          en: "Press “Auto play” or hover the step bars to watch the agent complete a full loop. You can also type below." },
  placeholder: { zh: "试着问：循环什么时候停？工具结果去哪了？", en: "Try asking: when does the loop stop? Where do tool results go?" },
  steps: [
    { label: { zh: "第 1 步 · 用户开口", en: "Step 1 · User speaks" },
      summary: { zh: "把用户输入打包成首个 POST 请求中的 messages[] JSON", en: "Pack user input into the initial request’s messages[] JSON" },
      beats: [
        { t: "user", zh: "帮我看看 src/auth.ts 有没有 bug", en: "Can you check src/auth.ts for bugs?" },
        { t: "think", zh: "用户想让我检查一个文件。我需要先读它。", en: "The user wants me to inspect a file. I need to read it first." },
        { t: "say", zh: "我先读一下这个文件。", en: "Let me read the file first." },
        { t: "xr", patch: { tab: "request", focus: "messages", request: { ...REQ_BASE, messages: [
            { role: "user", content: "帮我看看 src/auth.ts 有没有 bug" }
          ] } } },
        { t: "note", kind: "info", zh: "注意：Agent 还没「想」出答案——它做的第一件事是把整段对话打包成一个 HTTP 请求发出去。右侧已自动聚焦到请求 JSON 里的 messages。", en: "Note: the agent hasn’t “thought” of an answer yet — its first move is packing the conversation into an HTTP request. Right panel auto-focused on messages in Request JSON." }
      ] },
    { label: { zh: "第 2 步 · 模型要求调工具", en: "Step 2 · Model asks for a tool" },
      summary: { zh: "模型通过 SSE 流返回 tool_use JSON 提议，Agent 本地执行 Read", en: "Model streams a tool_use JSON proposal via SSE; agent runs Read locally" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["client", "agent", "api"], edge: "e_agent_api", label: "POST /v1/messages" } } },
        { t: "http", method: "POST", url: "https://api.anthropic.com/v1/messages", status: "200 OK", ms: "1.2s" },
        { t: "sse", focus: "content", frames: [
            { ev: "message_start",       ms: 140, dt: "{\"message\":{\"id\":\"msg_01…\",\"model\":\"claude-sonnet-4-5\",\"usage\":{\"input_tokens\":312}}}" },
            { ev: "content_block_start", ms: 160, dt: "{\"index\":0,\"content_block\":{\"type\":\"tool_use\",\"id\":\"toolu_01…\",\"name\":\"Read\"}}" },
            { ev: "content_block_delta", ms: 190, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"path\\\": \"}}" },
            { ev: "content_block_delta", ms: 180, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"\\\"src/auth.ts\\\"}\"}}" },
            { ev: "content_block_stop",  ms: 120, dt: "{\"index\":0}" },
            { ev: "message_delta",       ms: 150, dt: "{\"delta\":{\"stop_reason\":\"tool_use\"},\"usage\":{\"output_tokens\":47}}" },
            { ev: "message_stop",        ms: 100, dt: "{}" }
          ] },
        { t: "tool", name: "Read", arg: "src/auth.ts", kind: "read", ms: 38,
          input: "{\n  \"path\": \"src/auth.ts\"\n}",
          output: "export function login(user, pass) {\n  const u = db.find(user);\n  if (u.password === pass) return u.token;\n  return null;\n}",
          note: { zh: "模型不能直接读你的硬盘。它只能「提议」调工具，真正执行的是 Agent 程序。", en: "The model can’t touch your disk. It can only *propose* a tool call — the agent program does the actual work." } },
        { t: "note", kind: "key", zh: "关键：模型返回的不是文件内容，而是一个 tool_use 块——「请帮我调用 Read，参数是 path=src/auth.ts」。", en: "Key point: the model didn’t return file contents. It returned a tool_use block — “please call Read with path=src/auth.ts”." }
      ] },
    { label: { zh: "第 3 步 · 工具结果回填", en: "Step 3 · Tool result feeds back" },
      summary: { zh: "把 tool_result 追加到 messages[]，下一轮整包重发给模型", en: "Append tool_result into messages[] and re-send the full history next round" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "tools", "api"], edge: "e_tools_agent", label: "tool_result" } } },
        { t: "say", zh: "读到了。文件里有个问题：密码是明文比较的。", en: "Got it. There’s an issue: passwords are compared in plain text." },
        { t: "tool", name: "Edit", arg: "src/auth.ts", kind: "edit", ms: 12,
          input: "{\n  \"path\": \"src/auth.ts\",\n  \"old\": \"if (u.password === pass)\",\n  \"next\": \"if (await verifyHash(u.hash, pass))\"\n}",
          output: "✓ edited src/auth.ts (1 replacement)",
          note: { zh: "工具结果被包装成一条新的 user 消息（tool_result），追加到对话末尾。", en: "The tool result is wrapped as a new user message (tool_result) and appended to the end of the conversation." } },
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user",      text: "帮我看看 src/auth.ts 有没有 bug", tokens: 14 },
            { role: "assistant", text: "我先读一下这个文件。", tokens: 9 },
            { role: "assistant", text: "tool_use: Read {path: src/auth.ts}", tokens: 21 },
            { role: "user",      text: "tool_result: <file contents…>", tokens: 38 },
            { role: "assistant", text: "读到了。文件里有个问题：密码是明文比较的。", tokens: 16 },
            { role: "assistant", text: "tool_use: Edit {path: src/auth.ts, …}", tokens: 34 },
            { role: "user",      text: "tool_result: ✓ edited (1 replacement)", tokens: 11 }
          ], used: 143, budget: 200000 } } },
        { t: "note", kind: "info", zh: "现在对话里多了 5 条消息。下一轮请求会把这 5 条全部重新发一遍——模型没有记忆，它每次都靠「重读全部历史」来续上进度。", en: "The conversation now has 5 more messages. The next request re-sends all of them — the model has no memory; it reconstructs progress by re-reading the full history every time." }
      ] },
    { label: { zh: "第 4 步 · 模型说「做完了」", en: "Step 4 · Model says “done”" },
      summary: { zh: "模型返回纯文本与 stop_reason=end_turn，跳出 while 循环", en: "Model emits text with stop_reason=end_turn, exiting the while-loop" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "api", "client"], edge: "e_api_agent", label: "text + end_turn" } } },
        { t: "say", zh: "修好了。我把明文比较换成了哈希校验：\n\n- `verifyHash(u.hash, pass)` 用 bcrypt 校验\n- 失败时仍返回 `null`，行为不变\n\n还有别的要改的吗？", en: "Fixed. I replaced the plain-text comparison with hash verification:\n\n- `verifyHash(u.hash, pass)` uses bcrypt\n- Still returns `null` on failure — behavior unchanged\n\nAnything else you’d like changed?" },
        { t: "note", kind: "key", zh: "这次模型返回的是纯文本，stop_reason = end_turn。Agent 看到这个信号就停下循环，把文本显示给你。", en: "This time the model returned plain text with stop_reason = end_turn. The agent sees that signal, stops the loop, and shows you the text." },
        { t: "done", stats: { "轮次|rounds": 3, "工具调用|tool calls": 2, "总 token|total": "≈ 1.4k" } }
      ] },
    { label: { zh: "第 5 步 · 循环的本质", en: "Step 5 · What the loop really is" },
      summary: { zh: "用几行 TypeScript 伪代码看懂 Agent 骨架", en: "See the agent loop skeleton in concise TypeScript pseudocode" },
      beats: [
        { t: "code", title: "agent.ts — 伪代码|agent.ts — pseudocode", lang: "ts",
          code: "let messages = [userMsg];\nwhile (true) {\n  const res = await api.messages({ messages, tools });\n  messages.push(res.assistantMsg);\n  if (res.stop_reason !== 'tool_use') break;   // 模型说完了\n  const results = await runTools(res.toolUses); // 真正执行\n  messages.push({ role: 'user', content: results });\n}\nshowToUser(messages.at(-1));" },
        { t: "note", kind: "info", zh: "整个「智能」来自模型，但循环本身只是几行普通代码。模型负责决策（调哪个工具、传什么参数），程序负责执行和喂数据。", en: "All the “intelligence” comes from the model, but the loop itself is just a few lines of ordinary code. The model decides (which tool, what args); the program executes and feeds data." },
        { t: "note", kind: "key", zh: "记住这个骨架：后面 11 个体验都是在这个循环上加东西——流式、上下文、分支、MCP、记忆……", en: "Remember this skeleton: the next 11 experiences all add something on top of this loop — streaming, context, branching, MCP, memory…" }
      ] }
  ],
  freeText: [
    { match: ["循环", "什么时候停", "stop", "loop", "end_turn"], reply: [
      { t: "say", zh: "循环停下来的条件很简单：模型返回的 stop_reason 不是 tool_use（比如 end_turn），说明它这轮只想说话、不想调工具，Agent 就停。", en: "The loop stops when stop_reason isn’t tool_use (e.g. end_turn) — the model just wants to talk this round, so the agent exits." }
    ] },
    { match: ["工具结果", "结果去哪", "tool_result", "回填", "喂"], reply: [
      { t: "say", zh: "工具结果被包装成一条 role=user 的消息，content 里放 tool_result 块，追加到 messages 末尾，然后随下一轮请求一起发给模型。", en: "Tool results are wrapped as a role=user message containing a tool_result block, appended to messages, and sent along with the next request." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "好问题。回到主循环想想：Agent = 一个 while 循环，每轮都把「全部历史 + 工具结果」发给模型，模型要么调工具、要么给最终答复。想深入哪个环节？可以在左侧清单里跳过去。", en: "Good question. Think back to the main loop: the agent is a while-loop that each round sends “full history + tool results” to the model. The model either calls a tool or gives the final answer. Want to dig into a specific part? Jump to it in the list on the left." }
  ]
},
/* ================================================================
   02 — API Request
   ================================================================ */
{
  id: "request", icon: "i-request",
  title: { zh: "API 请求长什么样", en: "Anatomy of an API Request" },
  sub: { zh: "一次请求的完整 JSON：system、tools、messages、参数。右侧可在「完整 JSON」与「卡片视图」间自由切换。",
         en: "The full JSON of one request: system, tools, messages, parameters. Switch freely between Full JSON and Card view on the right." },
  hint: { zh: "看右侧「请求」标签里的 JSON，点任意蓝色字段名看解释，或切换为「卡片」模式分块阅读。",
          en: "Inspect the JSON in the Request tab — click any blue field name for docs, or switch to Card view." },
  placeholder: { zh: "试着问：system 是什么？tools 为什么要发？", en: "Try asking: what is system? Why send tools?" },
  steps: [
    { label: { zh: "第 1 步 · 一次请求的骨架", en: "Step 1 · Request skeleton" },
      summary: { zh: "查看 POST /v1/messages 的完整 JSON 请求体结构", en: "Inspect the complete JSON body of POST /v1/messages" },
      beats: [
        { t: "user", zh: "帮我给 /login 接口加个限流", en: "Add rate limiting to the /login endpoint" },
        { t: "xr", patch: { tab: "request", focus: "messages", request: { ...REQ_BASE, messages: [
            { role: "user", content: "帮我给 /login 接口加个限流" }
          ] } } },
        { t: "say", zh: "好，我先看一下现有的限流中间件，再动手改。", en: "Sure — let me look at the existing rate-limit middleware first." },
        { t: "note", kind: "info", zh: "右侧「请求」标签就是这次发出的 JSON（右上可切「卡片 / 完整 JSON」）。注意：模型每次收到的都是这一整包东西，没有任何「隐藏状态」。", en: "The Request tab shows the exact JSON sent (toggle Cards / Full JSON at top-right). Note: the model receives this whole package every time — there is no hidden state." }
      ] },
    { label: { zh: "第 2 步 · system：人设与规则", en: "Step 2 · system: persona & rules" },
      summary: { zh: "聚焦 system 字段：开发者预置的规章与约束", en: "Focus on system: developer-preset identity and rules" },
      beats: [
        { t: "xr", patch: { tab: "request", focus: "system" } },
        { t: "note", kind: "key", zh: "system 是开发者写死的「开场白」，告诉模型：你是谁、有什么工具、什么规矩（比如「改文件前先读」）。它在每次请求里都排在最前面。", en: "system is the developer-written “opening line”: who you are, what tools exist, what rules apply (e.g. “read before editing”). It always sits at the front of every request." },
        { t: "code", title: "system 片段|system snippet", lang: "ts",
          code: "system: [\n  \"You are a coding agent in a terminal.\",\n  \"Always read a file before editing it.\",\n  \"Prefer small, surgical edits.\",\n  \"Never run destructive commands without asking.\"\n]" },
        { t: "note", kind: "info", zh: "system 里的每一句都会变成 token 计费，而且每次请求都要重发。所以好的 system 又短又准。", en: "Every word in system costs tokens and is re-sent on every request. A good system prompt is short and precise." }
      ] },
    { label: { zh: "第 3 步 · tools：工具说明书", en: "Step 3 · tools: the tool manual" },
      summary: { zh: "聚焦 tools[] JSON Schema：模型靠它学会如何传参调工具", en: "Focus on tools[] JSON Schema: the manual teaching the model how to call tools" },
      beats: [
        { t: "xr", patch: { tab: "request", focus: "tools" } },
        { t: "say", zh: "我先搜一下项目里已有的限流代码。", en: "Let me search the project for existing rate-limit code." },
        { t: "tool", name: "Grep", arg: "rate.?limit", kind: "search", ms: 61,
          input: "{\n  \"pattern\": \"rate.?limit\",\n  \"dir\": \"src\"\n}",
          output: "src/middleware/ratelimit.ts:12  export const limiter = …\n  3 matches in 1 file",
          note: { zh: "tools 数组里每个工具都有 name、description 和 input_schema（参数的 JSON Schema）。模型就是靠这份「说明书」学会调工具的。", en: "Each entry in the tools array has a name, description and input_schema (a JSON Schema of its parameters). The model learns to call tools from this manual." } },
        { t: "note", kind: "warn", zh: "description 写得越清楚，模型越不会乱传参数。很多 Agent 的「笨」其实是工具描述写得差。", en: "The clearer the description, the fewer wrong arguments. Many “dumb agent” problems are really just badly written tool descriptions." }
      ] },
    { label: { zh: "第 4 步 · messages：历史", en: "Step 4 · messages: history" },
      summary: { zh: "查看 user 与 assistant 交替组成的消息历史数组", en: "See how user and assistant alternate inside messages[]" },
      beats: [
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user",      text: "帮我给 /login 接口加个限流", tokens: 13 },
            { role: "assistant", text: "好，我先看一下现有的限流中间件，再动手改。", tokens: 18 },
            { role: "assistant", text: "tool_use: Grep {pattern: rate.?limit}", tokens: 22 },
            { role: "user",      text: "tool_result: 3 matches in ratelimit.ts", tokens: 15 }
          ], used: 68, budget: 200000 } } },
        { t: "say", zh: "找到了，项目里已经有 `ratelimit.ts`，我直接复用它。", en: "Found it — the project already has `ratelimit.ts`. I’ll reuse it." },
        { t: "note", kind: "info", zh: "messages 就是对话历史：user 和 assistant 交替，工具调用和结果也以消息形式存在。模型看的「上下文」= system + tools + messages 拼在一起。", en: "messages is the conversation history: user and assistant alternate, and tool calls/results live here as messages too. What the model “sees” = system + tools + messages concatenated." }
      ] },
    { label: { zh: "第 5 步 · 其他参数", en: "Step 5 · Other parameters" },
      summary: { zh: "了解 model、max_tokens、temperature 与 stream 参数的作用", en: "Understand model, max_tokens, temperature and stream parameters" },
      beats: [
        { t: "code", title: "请求参数一览|Request parameters", lang: "ts",
          code: "{\n  model: 'claude-sonnet-4-5',  // 用哪个模型\n  max_tokens: 8192,            // 最多生成多少 token\n  temperature: 0.2,           // 随机性，代码任务通常调低\n  stream: true,               // 流式返回（下一个体验）\n  stop_sequences: ['\\n---']  // 遇到这个就停\n}" },
        { t: "note", kind: "key", zh: "点下方输入框旁边的「请求参数」按钮，可以亲手改这些参数，看 token 消耗怎么变。", en: "Click the “Request parameters” button next to the input box to tweak these parameters yourself and watch token usage change." },
        { t: "done", stats: { "请求体大小|Payload size": "≈ 2.1 KB", "固定开销|Fixed overhead": "≈ 1.8k tok", "本轮新增|Added": "68 tok" } }
      ] }
  ],
  freeText: [
    { match: ["system", "系统提示", "人设"], reply: [
      { t: "say", zh: "system 是开发者预置的指令：身份、规则、工具使用规范。它排在每次请求的最前面，模型把它当作「开工前的规章制度」。", en: "system is the developer’s preset instructions: identity, rules, tool-use conventions. It leads every request — think of it as the house rules before work begins." }
    ] },
    { match: ["tools", "工具", "说明书", "schema"], reply: [
      { t: "say", zh: "tools 数组是发给模型的「工具说明书」：每个工具的名字、用途描述、参数的 JSON Schema。模型只能从这份清单里挑工具调用。", en: "The tools array is the “tool manual” sent to the model: each tool’s name, description and parameter JSON Schema. The model can only pick from this list." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "一次请求 = system（规则）+ tools（工具说明书）+ messages（历史）+ 参数（模型、温度、长度）。模型没有记忆，全靠这一包东西「重读」上下文。", en: "One request = system (rules) + tools (manual) + messages (history) + parameters (model, temperature, length). The model has no memory — it re-reads this package every time." }
  ]
},
/* ================================================================
   03 — Streaming
   ================================================================ */
{
  id: "stream", icon: "i-stream",
  title: { zh: "流式输出", en: "Streaming Output" },
  sub: { zh: "模型不是「想完再说」，而是逐 token 往外吐。右侧「响应」标签通过实时管道动画与 SSE 帧流展示拼装全过程。",
         en: "The model doesn’t “think then speak” — it emits tokens one by one. Watch the live SSE pipeline and incremental assembly in the Response tab." },
  hint: { zh: "点「自动演示」，观察右侧响应标签里的流式管道动画、字符实时拼装以及切到「完整 JSON」对比结果。",
          en: "Press “Auto play” to watch the streaming pipeline animation, live character assembly, and toggle Full JSON in Response." },
  placeholder: { zh: "试着问：为什么要流式？token 是什么？", en: "Try asking: why stream? What is a token?" },
  steps: [
    { label: { zh: "第 1 步 · 为什么流式", en: "Step 1 · Why stream" },
      summary: { zh: "对比一次性等待与首字秒出的流式体验差异", en: "Compare waiting for full generation vs fast time-to-first-token streaming" },
      beats: [
        { t: "user", zh: "解释一下什么是 JWT", en: "Explain what JWT is" },
        { t: "note", kind: "info", zh: "如果等模型全部生成完才显示，一段长回答要等好几秒，屏幕上什么都没有。流式让第一个字几百毫秒就出现——体感快得多。", en: "If we waited for the full generation, a long answer would take seconds with a blank screen. Streaming shows the first character within hundreds of milliseconds — it feels much faster." },
        { t: "xr", patch: { tab: "response", response: [] } }
      ] },
    { label: { zh: "第 2 步 · SSE 逐帧流式到达", en: "Step 2 · Frame-by-frame SSE stream" },
      summary: { zh: "看 SSE 事件一帧帧通过管道到达并在缓冲区实时拼出文本", en: "Watch SSE chunks arrive through the stream pipe and assemble text live" },
      beats: [
        { t: "sse", focus: "content", frames: [
            { ev: "message_start",       ms: 150, dt: "{\"message\":{\"id\":\"msg_02…\",\"usage\":{\"input_tokens\":96}}}" },
            { ev: "content_block_start", ms: 180, dt: "{\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"\"}}" },
            { ev: "content_block_delta", ms: 240, dt: "{\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"JWT\"}}" },
            { ev: "content_block_delta", ms: 260, dt: "{\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"（JSON Web Token）\"}}" },
            { ev: "content_block_delta", ms: 260, dt: "{\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"是一种自包含的\"}}" },
            { ev: "content_block_delta", ms: 240, dt: "{\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"身份令牌格式，由 Header.Payload.Signature 组成。\"}}" },
            { ev: "content_block_stop",  ms: 160, dt: "{\"index\":0}" },
            { ev: "message_delta",       ms: 150, dt: "{\"delta\":{\"stop_reason\":\"end_turn\"},\"usage\":{\"output_tokens\":31}}" },
            { ev: "message_stop",        ms: 120, dt: "{}" }
          ] },
        { t: "say", zh: "JWT（JSON Web Token）是一种自包含的身份令牌格式，由 Header.Payload.Signature 组成。", en: "JWT (JSON Web Token) is a self-contained token format made of Header.Payload.Signature." },
        { t: "note", kind: "key", zh: "看右侧流式管道和缓冲区：每个 text_delta 只带一小段文字，一帧帧到达后拼接起来，就是你看到的「打字机」效果。", en: "Look at the live pipeline and buffer on the right: each text_delta carries a tiny fragment; assembling them frame by frame creates the typewriter effect." }
      ] },
    { label: { zh: "第 3 步 · 工具调用参数也在流里", en: "Step 3 · Tool arguments stream too" },
      summary: { zh: "观察 input_json_delta 如何把工具参数 JSON 一块块拼合", en: "Watch input_json_delta assemble tool-call JSON arguments chunk by chunk" },
      beats: [
        { t: "say", zh: "顺便帮我看看 package.json 的依赖版本。", en: "Also, check the dependency versions in package.json." },
        { t: "sse", focus: "content", frames: [
            { ev: "message_start",       ms: 140, dt: "{\"message\":{\"id\":\"msg_03…\",\"usage\":{\"input_tokens\":118}}}" },
            { ev: "content_block_start", ms: 170, dt: "{\"index\":0,\"content_block\":{\"type\":\"tool_use\",\"id\":\"toolu_02…\",\"name\":\"Read\"}}" },
            { ev: "content_block_delta", ms: 240, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"path\\\":\"}}" },
            { ev: "content_block_delta", ms: 240, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\" \\\"pack\"}}" },
            { ev: "content_block_delta", ms: 240, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"age.json\\\"}\"}}" },
            { ev: "content_block_stop",  ms: 150, dt: "{\"index\":0}" },
            { ev: "message_delta",       ms: 140, dt: "{\"delta\":{\"stop_reason\":\"tool_use\"},\"usage\":{\"output_tokens\":31}}" },
            { ev: "message_stop",        ms: 110, dt: "{}" }
          ] },
        { t: "tool", name: "Read", arg: "package.json", kind: "read", ms: 9,
          input: "{\n  \"path\": \"package.json\"\n}",
          output: "{ \"dependencies\": { \"express\": \"^4.19\", \"react\": \"^18.3\" } }",
          note: { zh: "工具参数也是流式拼出来的：input_json_delta 一段段到达，拼完才是合法 JSON。", en: "Tool arguments stream in too: input_json_delta fragments arrive piece by piece and only become valid JSON once complete." } }
      ] },
    { label: { zh: "第 4 步 · 流结束时的结算", en: "Step 4 · End-of-stream accounting" },
      summary: { zh: "聚焦 message_delta 的 usage 结算字段，并可在「完整 JSON」模式检视", en: "Inspect usage accounting in message_delta and switch to Full JSON mode" },
      beats: [
        { t: "xr", patch: { tab: "response", focus: "usage" } },
        { t: "say", zh: "依赖版本没问题，都是较新的稳定版。", en: "Dependency versions look fine — all recent stable releases." },
        { t: "note", kind: "info", zh: "最后一个事件 message_delta 带来 usage：输入/输出各用了多少 token。你可以把右侧「响应」切到「完整 JSON」查看拼装后的完整响应体。", en: "The final message_delta carries usage: input/output tokens consumed. Try switching Response to “Full JSON” on the right to see the assembled response object." },
        { t: "done", stats: { "首字延迟|TTFT": "≈ 380 ms", "总输出|Output tokens": 62, "事件数|Events": 8 } }
      ] }
  ],
  freeText: [
    { match: ["token", "字", "单位"], reply: [
      { t: "say", zh: "token 是模型处理文字的最小单位，大致是「三分之四个英文单词」或「一两个汉字」。模型一次生成一个 token，流式就是把这些 token 逐个推给你。", en: "A token is the model’s smallest unit of text — roughly ¾ of an English word or one-two Chinese characters. The model generates one token at a time; streaming pushes them to you one by one." }
    ] },
    { match: ["为什么", "流式", "stream", "SSE"], reply: [
      { t: "say", zh: "流式（SSE）让第一个字几百毫秒就出现，而不是等全部生成完。代价是协议复杂一点：要处理事件、拼接增量、处理中断。", en: "Streaming (SSE) shows the first character in hundreds of milliseconds instead of waiting for full generation. The cost is protocol complexity: events, incremental assembly, interruption handling." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "流式输出 = 模型逐 token 生成，服务器用 SSE 把每个增量推过来。右侧「响应」标签能看到流式管道动画和每个事件的原始 JSON。", en: "Streaming = the model generates token by token and the server pushes each increment over SSE. The Response tab shows the live pipeline animation and raw JSON frames." }
  ]
},
/* ================================================================
   04 — Tool Calling
   ================================================================ */
{
  id: "tools", icon: "i-tool",
  title: { zh: "工具调用机制", en: "How Tool Calling Works" },
  sub: { zh: "模型不能执行代码，只能「提议」。工具调用 = 模型提议 + 程序执行 + 结果回填，三步握手。",
         en: "The model can’t run code — it can only propose. Tool calling = propose + execute + feed back, a three-step handshake." },
  hint: { zh: "点「自动演示」看一次完整的工具调用握手；注意工具卡片自动高亮的 JSON 输入与输出。",
          en: "Press “Auto play” to watch a complete tool-call handshake; notice the auto-highlighted JSON input and output." },
  placeholder: { zh: "试着问：模型能自己运行代码吗？并行调用怎么处理？", en: "Try asking: can the model run code itself? How are parallel calls handled?" },
  steps: [
    { label: { zh: "第 1 步 · 模型只是「提议」", en: "Step 1 · The model only proposes" },
      summary: { zh: "理解模型与本地宿主程序之间的协议边界", en: "Understand the protocol boundary between the model and the local host" },
      beats: [
        { t: "user", zh: "跑一下测试看看有没有挂的", en: "Run the tests and see if anything fails" },
        { t: "say", zh: "我来跑一下测试套件。", en: "I’ll run the test suite." },
        { t: "note", kind: "warn", zh: "关键分工：模型负责「想」，程序负责「做」。模型没有 shell、没有文件系统，它只能输出一个 tool_use 块。", en: "Key division of labor: the model thinks, the program acts. The model has no shell and no filesystem — it can only emit a tool_use block." }
      ] },
    { label: { zh: "第 2 步 · tool_use 块", en: "Step 2 · The tool_use block" },
      summary: { zh: "模型返回 tool_use 块并触发本地 Bash 执行", en: "Model emits a tool_use block and triggers local Bash execution" },
      beats: [
        { t: "sse", focus: "content", frames: [
            { ev: "message_start",       ms: 120, dt: "{\"message\":{\"id\":\"msg_04…\",\"usage\":{\"input_tokens\":412}}}" },
            { ev: "content_block_start", ms: 160, dt: "{\"index\":0,\"content_block\":{\"type\":\"tool_use\",\"id\":\"toolu_01…\",\"name\":\"Bash\"}}" },
            { ev: "content_block_delta", ms: 200, dt: "{\"index\":0,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"cmd\\\": \\\"npm test 2>&1 | tail -20\\\"}\"}}" },
            { ev: "message_delta",       ms: 140, dt: "{\"delta\":{\"stop_reason\":\"tool_use\"},\"usage\":{\"output_tokens\":44}}" },
            { ev: "message_stop",        ms: 100, dt: "{}" }
          ] },
        { t: "tool", name: "Bash", arg: "npm test", kind: "bash", ms: 1840,
          input: "{\n  \"cmd\": \"npm test 2>&1 | tail -20\"\n}",
          output: "PASS  src/auth.test.ts\nFAIL  src/cart.test.ts\n  ✕ total with discount\n    expected 90, got 100\nTests: 1 failed, 12 passed",
          note: { zh: "这个 tool_use 块包含：id（回填时对号入座）、name（调哪个工具）、input（参数）。", en: "This tool_use block carries: an id (for matching the result later), a name (which tool), and input (the arguments)." } }
      ] },
    { label: { zh: "第 3 步 · 结果回填", en: "Step 3 · Result feeds back" },
      summary: { zh: "tool_result 通过 tool_use_id 与原调用对号入座", en: "tool_result pairs with the original call via tool_use_id" },
      beats: [
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user",      text: "跑一下测试看看有没有挂的", tokens: 11 },
            { role: "assistant", text: "我来跑一下测试套件。", tokens: 9 },
            { role: "assistant", text: "tool_use: Bash {cmd: npm test}", tokens: 19 },
            { role: "user",      text: "tool_result(toolu_01): 1 failed, 12 passed", tokens: 24 }
          ], used: 63, budget: 200000 } } },
        { t: "say", zh: "有一个失败：`cart.test.ts` 里折扣计算不对。我看一下实现。", en: "One failure: the discount math in `cart.test.ts` is wrong. Let me look at the implementation." },
        { t: "note", kind: "info", zh: "tool_result 必须带上对应的 tool_use_id，模型才能把结果和请求配对。多个工具并行时全靠 id 对号。", en: "tool_result must carry the matching tool_use_id so the model can pair result with request. With parallel tools, ids do all the matching." }
      ] },
    { label: { zh: "第 4 步 · 并行与串行工具调用", en: "Step 4 · Parallel & serial tool calls" },
      summary: { zh: "先 Read 源码定位缺陷，再在下一轮调用 Edit 修复", en: "Read source to locate the bug, then call Edit in the next round" },
      beats: [
        { t: "tool", name: "Read", arg: "src/cart.ts", kind: "read", ms: 15,
          input: "{\n  \"path\": \"src/cart.ts\"\n}",
          output: "export function total(items, discount) {\n  return items.reduce((s, i) => s + i.price, 0);\n}",
          note: { zh: "模型可以一轮返回多个 tool_use，Agent 并行执行，再把多个 tool_result 一起回填。", en: "The model can return several tool_use blocks in one round; the agent runs them in parallel and feeds all results back together." } },
        { t: "say", zh: "找到 bug 了：`total` 根本没用 `discount` 参数。", en: "Found the bug: `total` never uses the `discount` parameter." },
        { t: "tool", name: "Edit", arg: "src/cart.ts", kind: "edit", ms: 11,
          input: "{\n  \"path\": \"src/cart.ts\",\n  \"old\": \"return items.reduce((s, i) => s + i.price, 0);\",\n  \"next\": \"return items.reduce((s, i) => s + i.price, 0) * (1 - discount);\"\n}",
          output: "✓ edited src/cart.ts (1 replacement)",
          note: { zh: "注意：Edit 依赖 Read 的结果，所以它必须等下一轮。模型自己会判断哪些调用可以并行、哪些必须串行。", en: "Note: Edit depends on Read’s result, so it must wait for the next round. The model itself decides which calls can parallelize and which must serialize." } }
      ] },
    { label: { zh: "第 5 步 · 工具的「说明书」", en: "Step 5 · The tool manual" },
      summary: { zh: "在 Request JSON 中查看工具 input_schema 声明方式", en: "Examine how tools[] input_schema is declared in Request JSON" },
      beats: [
        { t: "xr", patch: { tab: "request", focus: "tools", request: { ...REQ_BASE, messages: [
            { role: "user", content: "跑一下测试看看有没有挂的" }
          ] } } },
        { t: "code", title: "tools 数组中的一个工具|One tool in tools[]", lang: "ts",
          code: "{\n  name: 'Bash',\n  description: 'Run a shell command. Avoid using Bash with find/grep/cat — use the dedicated tools instead.',\n  input_schema: {\n    type: 'object',\n    properties: {\n      cmd: { type: 'string', description: 'The command to run' },\n      timeout: { type: 'number', description: 'Seconds to wait, default 120' }\n    },\n    required: ['cmd']\n  }\n}" },
        { t: "note", kind: "key", zh: "description 不只是给人看的——它直接决定模型会不会用对工具。写工具 = 写说明书。", en: "The description isn’t just for humans — it directly determines whether the model uses the tool correctly. Writing a tool = writing its manual." },
        { t: "done", stats: { "工具调用|Tool calls": 3, "并行批次|Parallel batches": 1, "总耗时|Duration": "≈ 2.9s" } }
      ] }
  ],
  freeText: [
    { match: ["自己", "运行", "执行", "代码"], reply: [
      { t: "say", zh: "不能。模型只会输出文本（包括 tool_use 块），真正执行的是 Agent 程序里的工具函数。模型和你的电脑之间隔着一层协议。", en: "No. The model only outputs text (including tool_use blocks). The actual execution happens in the agent program’s tool functions. A protocol layer separates the model from your machine." }
    ] },
    { match: ["并行", "同时", "多个"], reply: [
      { t: "say", zh: "一轮可以返回多个 tool_use，Agent 并行执行，再把多个 tool_result 一起回填。每个结果都带 tool_use_id 对号入座。", en: "One round can return multiple tool_use blocks; the agent executes them in parallel and feeds all tool_results back together, each matched by tool_use_id." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "工具调用是三步握手：模型提议（tool_use）→ 程序执行 → 结果回填（tool_result）。模型永远不能直接碰你的文件系统。", en: "Tool calling is a three-step handshake: the model proposes (tool_use) → the program executes → the result feeds back (tool_result). The model can never touch your filesystem directly." }
  ]
},
/* ================================================================
   05 — Context Management
   ================================================================ */
{
  id: "context", icon: "i-context",
  title: { zh: "上下文管理", en: "Context Management" },
  sub: { zh: "「记忆」就是一个消息数组。右侧「上下文」标签显示它如何变长、token 如何消耗。",
         en: "“Memory” is just an array of messages. The Context tab shows how it grows and how tokens are consumed." },
  hint: { zh: "点「自动演示」，盯着右侧上下文标签的 token 条；再点下方输入框旁的「请求参数」改工具数量看固定开销变化。",
          en: "Press “Auto play” and watch the token bar in the Context tab; open “Request params” to toggle tools and see fixed overhead change." },
  placeholder: { zh: "试着问：上下文满了会怎样？为什么每次都重发历史？", en: "Try asking: what happens when context fills up? Why re-send history every time?" },
  steps: [
    { label: { zh: "第 1 步 · 上下文 = 消息数组", en: "Step 1 · Context = message array" },
      summary: { zh: "对话开始时 messages[] 只有一条用户消息", en: "At turn 1, messages[] holds just a single user message" },
      beats: [
        { t: "user", zh: "帮我重构一下 payment.ts", en: "Refactor payment.ts for me" },
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user", text: "帮我重构一下 payment.ts", tokens: 10 }
          ], used: 10, budget: 200000 } } },
        { t: "note", kind: "info", zh: "所谓「上下文」，就是每次请求里发给模型的全部文本：system + tools + messages。模型看不到的任何东西，它都不知道。", en: "“Context” is everything sent to the model in each request: system + tools + messages. Anything the model can’t see, it doesn’t know." }
      ] },
    { label: { zh: "第 2 步 · 历史越滚越长", en: "Step 2 · History keeps growing" },
      summary: { zh: "读取 200 行文件让 tool_result 瞬间膨胀上下文", en: "Reading a 200-line file swells context via tool_result" },
      beats: [
        { t: "tool", name: "Read", arg: "src/payment.ts", kind: "read", ms: 22,
          input: "{\n  \"path\": \"src/payment.ts\"\n}",
          output: "export function pay(order) {\n  // 200 lines of legacy payment code…\n}",
          note: { zh: "文件内容进了 tool_result，也进了上下文。读得越多，上下文越胖。", en: "File contents enter via tool_result — and into the context. The more you read, the fatter the context." } },
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user",      text: "帮我重构一下 payment.ts", tokens: 10 },
            { role: "assistant", text: "tool_use: Read {path: src/payment.ts}", tokens: 18 },
            { role: "user",      text: "tool_result: <200 lines of code…>", tokens: 1450 },
            { role: "assistant", text: "这个文件有 200 行，我先看看测试。", tokens: 14 },
            { role: "assistant", text: "tool_use: Glob {pattern: **/*.test.ts}", tokens: 20 },
            { role: "user",      text: "tool_result: payment.test.ts, cart.test.ts…", tokens: 60 }
          ], used: 1572, budget: 200000 } } },
        { t: "note", kind: "warn", zh: "注意：每次请求都把全部历史重新发一遍。所以对话越长，每一轮越贵、越慢。这就是为什么 Agent 要省着读文件。", en: "Every request re-sends the entire history. So the longer the conversation, the pricier and slower each round. That’s why agents read files sparingly." }
      ] },
    { label: { zh: "第 3 步 · token 预算", en: "Step 3 · The token budget" },
      summary: { zh: "拆解固定开销（system + tools）与增长开销（messages）", en: "Break down fixed overhead (system + tools) vs growing messages[]" },
      beats: [
        { t: "say", zh: "我先跑一遍现有测试，确认重构前都是绿的。", en: "Let me run the existing tests first to confirm everything is green before refactoring." },
        { t: "tool", name: "Bash", arg: "npm test payment", kind: "bash", ms: 1600,
          input: "{\n  \"cmd\": \"npm test payment\"\n}",
          output: "Tests: 8 passed, 8 total",
          note: { zh: "右侧 token 条里：system + tools 是固定开销（每轮都付），messages 是随对话增长的部分。", en: "In the token bar: system + tools are fixed overhead (paid every round); messages are the part that grows with the conversation." } },
        { t: "code", title: "上下文预算的构成|Context budget breakdown", lang: "ts",
          code: "// 每次请求的 token 消耗\nsystem:   ~1,200   // 固定\ntools:    ~2,400   // 固定（工具越多越贵）\nmessages: 随对话增长  // ← 唯一变量\n// 预算 200k，messages 占满后必须处理（压缩/截断）" }
      ] },
    { label: { zh: "第 4 步 · 满了怎么办", en: "Step 4 · When it fills up" },
      summary: { zh: "接近窗口上限时优先触发压缩（Compaction）而非硬截断", en: "Prefer Compaction over hard truncation as context nears its limit" },
      beats: [
        { t: "note", kind: "key", zh: "当 messages 接近预算上限，Agent 会触发「上下文压缩」：把旧消息总结成一段摘要，替换掉原文。细节在「记忆与压缩」体验里。", en: "When messages approach the budget, the agent triggers context compaction: old messages are summarized and replace the originals. Details in the Memory & Compaction experience." },
        { t: "note", kind: "info", zh: "还有一种粗暴办法：截断最旧的消息。但那会丢信息，好的 Agent 优先用压缩。", en: "A cruder option is truncating the oldest messages — but that loses information. Good agents prefer compaction." },
        { t: "done", stats: { "当前占用|Used": "1.6k / 200k", "固定开销|Fixed": "3.6k", "剩余轮次|Remaining": "≈ 60+" } }
      ] }
  ],
  freeText: [
    { match: ["满", "上限", "压缩", "截断"], reply: [
      { t: "say", zh: "上下文快满时，Agent 会把旧消息压缩成摘要（compaction），或者截断最旧的消息。压缩保信息，截断丢信息——所以优先压缩。", en: "When context nears full, the agent compacts old messages into a summary, or truncates the oldest ones. Compaction preserves information; truncation loses it — so compaction wins." }
    ] },
    { match: ["重发", "为什么", "历史"], reply: [
      { t: "say", zh: "因为模型没有记忆。每次请求都是独立的 HTTP 调用，模型只能靠这一包文本「重读」全部历史来续上进度。", en: "Because the model has no memory. Each request is an independent HTTP call; the model reconstructs progress by re-reading the full text package." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "上下文 = system + tools + messages。messages 随对话增长，每轮都要重发，所以 Agent 要精打细算地读文件、控输出。", en: "Context = system + tools + messages. Messages grow with the conversation and are re-sent every round, so agents must read files and control output carefully." }
  ]
},
/* ================================================================
   06 — Branching & Rollback
   ================================================================ */
{
  id: "branch", icon: "i-branch",
  title: { zh: "对话分支与回滚", en: "Branching & Rollback" },
  sub: { zh: "对话不是一条线，而是一棵树。右侧「分支」标签能看到树形结构，可以从任意节点分叉、回滚。",
         en: "A conversation isn’t a line — it’s a tree. The Branch tab shows the tree; you can fork or rewind from any node." },
  hint: { zh: "点「自动演示」，看右侧分支树长出来；也可以点击树上的任意节点切换分支，或悬停用户消息点「从这里分叉」。",
          en: "Press “Auto play” to watch the branch tree grow; click any tree node to switch branches, or hover a user message to fork." },
  placeholder: { zh: "试着问：回滚会删除文件吗？分支怎么存的？", en: "Try asking: does rollback delete files? How are branches stored?" },
  steps: [
    { label: { zh: "第 1 步 · 对话是一棵树", en: "Step 1 · A conversation is a tree" },
      summary: { zh: "每条消息带 id 与 parentId，当前对话是一条从根到叶的路径", en: "Messages link via id/parentId; the active chat is one root-to-node path" },
      beats: [
        { t: "user", zh: "把登录改成 JWT 方案", en: "Switch login to JWT" },
        { t: "say", zh: "好，我先把 session 方案换成 JWT。", en: "OK, I’ll swap the session scheme for JWT." },
        { t: "xr", patch: { tab: "tree", tree: { nodes: [
            { id: "m1", label: "把登录改成 JWT|Switch login to JWT", sub: "user · #1", x: 0, y: 0, parent: null },
            { id: "m2", label: "先换 JWT|Swap to JWT", sub: "assistant · #2", x: 0, y: 1, parent: "m1" },
            { id: "m3", label: "tool_use: Edit auth.ts", sub: "tool · #3", x: 0, y: 2, parent: "m2" }
          ], current: "m3" } } },
        { t: "note", kind: "info", zh: "每条消息都有 id 和父节点 id。所谓「当前对话」，就是从根到某个节点的这条路径。", en: "Every message has an id and a parent id. The “current conversation” is just the path from the root to some node." }
      ] },
    { label: { zh: "第 2 步 · 从这里分叉", en: "Step 2 · Fork from here" },
      summary: { zh: "从 #1 节点分叉出新思路，旧分支原封不动留在树上", en: "Fork a new approach from node #1 while preserving the old branch" },
      beats: [
        { t: "say", zh: "等等，JWT 的刷新逻辑有点复杂。换个思路：先保留 session，只把 token 换成签名 cookie。", en: "Wait — JWT refresh logic is getting complicated. Different approach: keep sessions, just switch tokens to signed cookies." },
        { t: "xr", patch: { tab: "tree", tree: { nodes: [
            { id: "m1", label: "把登录改成 JWT|Switch login to JWT", sub: "user · #1", x: 0, y: 0, parent: null },
            { id: "m2", label: "先换 JWT|Swap to JWT", sub: "assistant · #2", x: 0, y: 1, parent: "m1" },
            { id: "m3", label: "tool_use: Edit auth.ts", sub: "tool · #3", x: 0, y: 2, parent: "m2" },
            { id: "m4", label: "换思路：签名 cookie|Signed cookie", sub: "user · #4", x: 1, y: 1, parent: "m1" },
            { id: "m5", label: "改用签名 cookie|Use signed cookie", sub: "assistant · #5", x: 1, y: 2, parent: "m4" }
          ], current: "m5" } } },
        { t: "note", kind: "key", zh: "分叉不复制任何东西：新分支只是换了个「当前节点」。旧分支还在树上，随时可以点击切回去。", en: "Forking copies nothing: the new branch just points at a different “current node”. Click any node in the tree to jump back anytime." }
      ] },
    { label: { zh: "第 3 步 · 回滚到检查点", en: "Step 3 · Rewind to a checkpoint" },
      summary: { zh: "每次工具修改前自动打文件快照，支持状态一并回滚", en: "File snapshots taken before tool edits enable coordinated state rewind" },
      beats: [
        { t: "tool", name: "Edit", arg: "src/session.ts", kind: "edit", ms: 14,
          input: "{\n  \"path\": \"src/session.ts\",\n  \"old\": \"req.session.user = user\",\n  \"next\": \"res.cookie('sid', sign(sessionId), { httpOnly: true })\"\n}",
          output: "✓ edited src/session.ts",
          note: { zh: "每次工具调用前，Agent 会给文件系统打个快照（checkpoint）。回滚 = 恢复快照 + 把对话指针移回去。", en: "Before each tool call, the agent snapshots the filesystem (a checkpoint). Rewind = restore the snapshot + move the conversation pointer back." } },
        { t: "xr", patch: { tab: "tree", tree: { nodes: [
            { id: "m1", label: "把登录改成 JWT|Switch login to JWT", sub: "user · #1", x: 0, y: 0, parent: null },
            { id: "m2", label: "先换 JWT|Swap to JWT", sub: "assistant · #2", x: 0, y: 1, parent: "m1" },
            { id: "m3", label: "tool_use: Edit auth.ts", sub: "tool · #3", x: 0, y: 2, parent: "m2" },
            { id: "m4", label: "换思路：签名 cookie|Signed cookie", sub: "user · #4", x: 1, y: 1, parent: "m1" },
            { id: "m5", label: "改用签名 cookie|Use signed cookie", sub: "assistant · #5", x: 1, y: 2, parent: "m4" },
            { id: "m6", label: "tool_use: Edit session.ts", sub: "tool · #6", x: 1, y: 3, parent: "m5" }
          ], current: "m6" } } },
        { t: "note", kind: "warn", zh: "注意：回滚只恢复「Agent 自己的」改动。如果你手动改过文件，快照里没有，回滚不会帮你恢复。", en: "Note: rollback only restores the agent’s own changes. If you edited files manually, they’re not in the snapshot and won’t be restored." }
      ] },
    { label: { zh: "第 4 步 · 和 git 的类比", en: "Step 4 · The git analogy" },
      summary: { zh: "比较对话消息引用树与 git 提交树存储代价差异", en: "Compare lightweight message pointer trees against git file snapshots" },
      beats: [
        { t: "code", title: "对话树 ≈ git 历史|Message tree ≈ git history", lang: "ts",
          code: "// git:        commit → commit → commit\n//              ↘ branch\n// 对话:       msg → msg → msg\n//              ↘ fork\n//\n// 区别：git 存的是文件快照，\n// 对话树存的是消息引用（轻量）" },
        { t: "note", kind: "info", zh: "对话分支很便宜（只存引用），文件快照才贵。所以「分叉对话」随便分，「回滚文件」要谨慎。", en: "Conversation branches are cheap (just references); file snapshots are expensive. So fork conversations freely, but rewind files carefully." },
        { t: "done", stats: { "分支数|Branches": 2, "节点数|Nodes": 6, "快照|Snapshots": 2 } }
      ] }
  ],
  freeText: [
    { match: ["回滚", "删除", "文件"], reply: [
      { t: "say", zh: "回滚会恢复 Agent 工具调用前的快照，并把对话指针移回那个节点。手动改过的文件不在快照里，不会被恢复。", en: "Rollback restores the snapshot taken before the agent’s tool calls and moves the conversation pointer back. Manually edited files aren’t in the snapshot and won’t be restored." }
    ] },
    { match: ["怎么存", "存储", "引用"], reply: [
      { t: "say", zh: "对话树只存消息引用（id + 父 id），分叉几乎零成本。贵的只有文件快照。", en: "The conversation tree stores only message references (id + parent id), so forking is nearly free. Only file snapshots are expensive." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "对话是一棵树：每条消息有 id 和父 id，「当前对话」是根到某节点的一条路径。分叉 = 换指针，回滚 = 恢复快照 + 换指针。", en: "A conversation is a tree: each message has an id and parent id; the “current conversation” is a root-to-node path. Fork = move the pointer; rewind = restore snapshot + move the pointer." }
  ]
},
/* ================================================================
   07 — MCP
   ================================================================ */
{
  id: "mcp", icon: "i-mcp",
  title: { zh: "MCP 协议", en: "Model Context Protocol" },
  sub: { zh: "给 Agent 接外设的「USB 接口」：一个独立进程，通过 JSON-RPC 提供工具和数据。",
         en: "The “USB port” for agents: an independent process that exposes tools and data over JSON-RPC." },
  hint: { zh: "点「自动演示」，看 MCP JSON-RPC 握手与工具卡片联动；也可以问「MCP 和普通工具什么区别」。",
          en: "Press “Auto play” to watch MCP JSON-RPC handshakes and tool cards; ask “how does MCP differ from built-in tools?” below." },
  placeholder: { zh: "试着问：MCP server 是什么？和普通工具什么区别？", en: "Try asking: what is an MCP server? How does it differ from built-in tools?" },
  steps: [
    { label: { zh: "第 1 步 · 问题：集成爆炸", en: "Step 1 · The integration problem" },
      summary: { zh: "内置工具不够用时，硬编码集成外部数据源会导致爆炸", en: "Hard-coding external integrations into every agent doesn’t scale" },
      beats: [
        { t: "user", zh: "查一下数据库里最近的订单", en: "Check the recent orders in the database" },
        { t: "note", kind: "warn", zh: "Agent 内置工具只有 Read/Edit/Bash/Grep——没有「查数据库」。如果每个数据源都要改 Agent 代码，集成会爆炸。", en: "Built-in tools are only Read/Edit/Bash/Grep — there’s no “query database”. If every data source required changing agent code, integrations would explode." }
      ] },
    { label: { zh: "第 2 步 · MCP：独立进程握手", en: "Step 2 · MCP: process & handshake" },
      summary: { zh: "Agent 启动 MCP Server，通过 JSON-RPC initialize 与 tools/list 发现能力", en: "Agent starts MCP Server and runs JSON-RPC initialize + tools/list" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "mcp"], edge: "e_agent_mcp", label: "JSON-RPC over stdio" } } },
        { t: "say", zh: "我通过 MCP 连了一个数据库服务，看看它提供什么工具。", en: "I’m connected to a database service over MCP — let me see what tools it offers." },
        { t: "mcp", rows: [
            { dir: "req", json: "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{\"protocolVersion\":\"2024-11-05\",\"clientInfo\":{\"name\":\"agent-xray\"}}}" },
            { dir: "res", json: "{\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{\"serverInfo\":{\"name\":\"db-server\",\"version\":\"1.2.0\"},\"capabilities\":{\"tools\":{}}}}" },
            { dir: "req", json: "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\",\"params\":{}}" },
            { dir: "res", json: "{\"jsonrpc\":\"2.0\",\"id\":2,\"result\":{\"tools\":[{\"name\":\"db_query\",\"description\":\"Run a read-only SQL query\",\"inputSchema\":{\"type\":\"object\",\"properties\":{\"sql\":{\"type\":\"string\"}}}}]}}" }
          ] },
        { t: "note", kind: "info", zh: "MCP server 是一个独立进程，Agent 启动它、跟它握手（initialize），再问它「你有什么工具」（tools/list）。", en: "An MCP server is a separate process. The agent launches it, shakes hands (initialize), then asks “what tools do you have?” (tools/list)." }
      ] },
    { label: { zh: "第 3 步 · 调用 MCP 工具", en: "Step 3 · Calling an MCP tool" },
      summary: { zh: "模型像调用普通工具一样调用 db_query，Agent 转发 JSON-RPC tools/call", en: "Model calls db_query normally; agent forwards it over JSON-RPC tools/call" },
      beats: [
        { t: "tool", name: "db_query", arg: "SELECT … FROM orders", kind: "mcp", ms: 210,
          input: "{\n  \"sql\": \"SELECT id, total FROM orders ORDER BY created_at DESC LIMIT 5\"\n}",
          output: "id=1042 total=¥899\nid=1041 total=¥1,299\nid=1040 total=¥59 …",
          note: { zh: "对模型来说，db_query 和内置工具没区别——它只看到 name 和 schema。区别在执行端：请求被转发给 MCP server 进程。", en: "To the model, db_query looks just like a built-in tool — it only sees the name and schema. The difference is on the execution side: the call is forwarded to the MCP server process." } },
        { t: "mcp", rows: [
            { dir: "req", json: "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"db_query\",\"arguments\":{\"sql\":\"SELECT id, total FROM orders ORDER BY created_at DESC LIMIT 5\"}}}" },
            { dir: "res", json: "{\"jsonrpc\":\"2.0\",\"id\":3,\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"id=1042 total=¥899\\nid=1041 total=¥1,299…\"}]}}" }
          ] }
      ] },
    { label: { zh: "第 4 步 · 为什么用 MCP", en: "Step 4 · Why MCP" },
      summary: { zh: "写一次 MCP Server 即可跨所有支持协议的 Agent 复用", en: "Write one MCP Server once, reuse it across every compatible agent" },
      beats: [
        { t: "say", zh: "最近 5 笔订单：1042（¥899）、1041（¥1,299）、1040（¥59）……", en: "The 5 most recent orders: 1042 (¥899), 1041 (¥1,299), 1040 (¥59)…" },
        { t: "note", kind: "key", zh: "MCP 的价值：数据库、GitHub、浏览器……每个外设只需写一个 server，所有 Agent 都能用。Agent 侧只实现一次协议。", en: "MCP’s value: databases, GitHub, browsers… each peripheral needs just one server, usable by every agent. The agent side implements the protocol once." },
        { t: "note", kind: "info", zh: "传输方式可以是 stdio（本地子进程）或 HTTP（远程服务）。协议本身不变。", en: "Transport can be stdio (local subprocess) or HTTP (remote service). The protocol itself stays the same." },
        { t: "done", stats: { "MCP 握手|Handshakes": 2, "工具调用|Tool calls": 1, "新增工具|Added tool": "db_query" } }
      ] }
  ],
  freeText: [
    { match: ["区别", "普通", "内置"], reply: [
      { t: "say", zh: "对模型来说没区别——都是 name + schema。区别在执行端：内置工具在 Agent 进程里跑，MCP 工具在独立的 server 进程里跑，通过 JSON-RPC 通信。", en: "To the model there’s no difference — just name + schema. The difference is execution: built-in tools run inside the agent process; MCP tools run in a separate server process over JSON-RPC." }
    ] },
    { match: ["server", "进程", "独立"], reply: [
      { t: "say", zh: "MCP server 是一个独立进程（可以是本地子进程，也可以是远程 HTTP 服务），负责真正地访问数据库、GitHub 等外部系统。", en: "An MCP server is an independent process (local subprocess or remote HTTP service) that actually accesses external systems like databases and GitHub." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "MCP = 给 Agent 接外设的标准接口：独立进程 + JSON-RPC + tools/list 发现 + tools/call 调用。模型侧无感，执行端分离。", en: "MCP = a standard interface for peripherals: independent process + JSON-RPC + tools/list discovery + tools/call invocation. Invisible to the model; separated on the execution side." }
  ]
},
/* ================================================================
   08 — Skills
   ================================================================ */
{
  id: "skills", icon: "i-skill",
  title: { zh: "Skills 技能系统", en: "Skills System" },
  sub: { zh: "把知识写成文件夹，按需加载。核心思想：渐进式披露——先给目录，需要时再展开。",
         en: "Knowledge packaged as folders, loaded on demand. The core idea: progressive disclosure — show the index first, expand when needed." },
  hint: { zh: "点「自动演示」，看 Skill 如何从「目录」展开成「全文」；下方可以问「Skill 和 system prompt 什么区别」。",
          en: "Press “Auto play” to watch a Skill expand from index to full text; ask “how is a Skill different from system prompt?” below." },
  placeholder: { zh: "试着问：Skill 和 system prompt 什么区别？渐进式披露是什么？", en: "Try asking: Skill vs system prompt? What is progressive disclosure?" },
  steps: [
    { label: { zh: "第 1 步 · 问题：塞不下", en: "Step 1 · The problem: it doesn’t fit" },
      summary: { zh: "把冗长团队流程全塞进 system prompt 会导致每轮巨额 token 浪费", en: "Stuffing 40-page playbooks into system prompt wastes tokens every round" },
      beats: [
        { t: "user", zh: "按我们团队的发布流程发版", en: "Release following our team’s process" },
        { t: "note", kind: "warn", zh: "团队的发布流程有 40 页。如果全塞进 system prompt，每轮请求都要付这 40 页的 token——贵且慢。", en: "The team’s release process is 40 pages. Stuffing it all into the system prompt means paying for those 40 pages on every request — expensive and slow." }
      ] },
    { label: { zh: "第 2 步 · Skill = 文件夹", en: "Step 2 · Skill = a folder" },
      summary: { zh: "用 Read 按需加载 SKILL.md，frontmatter 提供轻量目录索引", en: "Read SKILL.md on demand; frontmatter supplies lightweight index metadata" },
      beats: [
        { t: "say", zh: "我先看看有哪些可用的技能。", en: "Let me see which skills are available." },
        { t: "tool", name: "Read", arg: "~/.agent/skills/release/SKILL.md", kind: "read", ms: 8,
          input: "{\n  \"path\": \"~/.agent/skills/release/SKILL.md\"\n}",
          output: "---\nname: release\ndescription: 发布流程：打 tag、跑检查、写 changelog\n---\n# 发布流程\n1. npm test 必须全绿\n2. bump version …",
          note: { zh: "一个 Skill 就是一个文件夹：SKILL.md（说明）+ 可选的脚本和模板。frontmatter 里的 name 和 description 是「目录条目」。", en: "A Skill is just a folder: SKILL.md (instructions) plus optional scripts and templates. The name and description in the frontmatter are the “index entries”." } }
      ] },
    { label: { zh: "第 3 步 · 渐进式披露", en: "Step 3 · Progressive disclosure" },
      summary: { zh: "三层加载机制：目录常驻 → 按需读全文 → 执行时加载脚本", en: "Three-tier loading: index resident → full SKILL.md on demand → scripts last" },
      beats: [
        { t: "note", kind: "key", zh: "渐进式披露分三层：① 所有 Skill 的 name+description 常驻在 system 里（很短）；② 模型判断需要时，读 SKILL.md 全文；③ 真正执行时才加载脚本和模板。", en: "Progressive disclosure has three layers: ① every Skill’s name+description lives in system (tiny); ② when the model decides it needs one, it reads the full SKILL.md; ③ scripts and templates load only at execution time." },
        { t: "code", title: "三层加载|Three-tier loading", lang: "ts",
          code: "// 第 1 层：常驻（~50 tokens / 个）\n//   name: release\n//   description: 发布流程：打 tag、跑检查、写 changelog\n//\n// 第 2 层：按需读 SKILL.md（~2k tokens）\n// 第 3 层：执行时加载 scripts/、templates/（按需）" },
        { t: "say", zh: "这个发布技能正好对口，我展开看一下完整流程。", en: "This release skill is exactly what I need — let me expand the full process." }
      ] },
    { label: { zh: "第 4 步 · 触发机制", en: "Step 4 · How it triggers" },
      summary: { zh: "触发靠模型阅读 description 自主匹配，无需硬编码路由", en: "Model matches tasks to Skill descriptions autonomously without hard-coded rules" },
      beats: [
        { t: "tool", name: "Bash", arg: "npm test", kind: "bash", ms: 1600,
          input: "{\n  \"cmd\": \"npm test\"\n}",
          output: "Tests: 24 passed",
          note: { zh: "触发没有硬编码规则：模型读到 description，自己判断「这个任务匹配这个 Skill」，然后主动去读全文。", en: "There’s no hard-coded trigger: the model reads the description, decides “this task matches this Skill”, and reads the full text itself." } },
        { t: "note", kind: "info", zh: "所以 description 的写法决定了 Skill 会不会被用上——它本质上是一段「广告文案」，写给模型看的。", en: "So how you write the description decides whether the Skill gets used — it’s essentially ad copy, written for the model." },
        { t: "done", stats: { "常驻成本|Resident": "≈ 50 tok", "展开后|Expanded": "≈ 2k tok", "节省|Saved": "≈ 95%" } }
      ] }
  ],
  freeText: [
    { match: ["区别", "system"], reply: [
      { t: "say", zh: "system prompt 每轮都全量发送；Skill 只有 name+description 常驻，全文按需加载。Skill 适合「偶尔用、内容长」的知识。", en: "The system prompt is sent in full every round; a Skill keeps only name+description resident and loads the full text on demand. Skills suit knowledge that’s long but rarely needed." }
    ] },
    { match: ["渐进", "披露", "三层"], reply: [
      { t: "say", zh: "三层：① name+description 常驻；② 需要时读 SKILL.md 全文；③ 执行时才加载脚本和模板。每一层只在上一层证明「需要」时才付费。", en: "Three layers: ① name+description resident; ② read SKILL.md when needed; ③ load scripts/templates only at execution. Each layer is paid for only when the previous one proves it’s needed." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "Skill = 文件夹 + SKILL.md。核心是渐进式披露：目录常驻、全文按需、脚本最后。触发靠模型读 description 自己判断。", en: "A Skill = folder + SKILL.md. The core is progressive disclosure: index resident, full text on demand, scripts last. Triggering relies on the model reading the description and deciding." }
  ]
},
/* ================================================================
   09 — Subagents
   ================================================================ */
{
  id: "subagents", icon: "i-subagent",
  title: { zh: "子代理", en: "Subagents" },
  sub: { zh: "主 Agent 派一个「分身」去干脏活：独立上下文、独立循环，只把结论带回来。",
         en: "The main agent sends a “clone” to do the dirty work: its own context, its own loop, returning only the conclusion." },
  hint: { zh: "点「自动演示」，看主/子代理的上下文如何隔离；下方可以问「为什么不直接自己做」。",
          en: "Press “Auto play” to see how main/subagent contexts stay isolated; ask “why not just do it directly?” below." },
  placeholder: { zh: "试着问：为什么不直接自己做？子代理怎么并行？", en: "Try asking: why not do it directly? How do subagents parallelize?" },
  steps: [
    { label: { zh: "第 1 步 · 问题：上下文污染", en: "Step 1 · The problem: context pollution" },
      summary: { zh: "大量文件探索如果直接在主循环进行，会迅速耗尽主上下文", en: "Exploring dozens of files directly in main context burns through budget" },
      beats: [
        { t: "user", zh: "这个项目怎么跑起来的？帮我摸清楚", en: "How does this project run? Figure it out for me" },
        { t: "note", kind: "warn", zh: "摸清一个项目要读几十个文件。如果主 Agent 亲自读，上下文会被几万 token 的细节塞满，真正干活时没预算了。", en: "Understanding a project means reading dozens of files. If the main agent does it personally, its context fills with tens of thousands of tokens of detail, leaving no budget for real work." }
      ] },
    { label: { zh: "第 2 步 · 派生子代理", en: "Step 2 · Spawn a subagent" },
      summary: { zh: "通过 Task 工具开启独立循环，传参 JSON 委派探索任务", en: "Invoke Task tool to spin up an isolated agent loop for exploration" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "api"], edge: "e_agent_api", label: "Task(subagent)" } } },
        { t: "say", zh: "我派一个子代理去全盘摸底，它只需要把结论告诉我。", en: "I’ll spawn a subagent to survey everything — it only needs to report back the conclusion." },
        { t: "tool", name: "Task", arg: "explore codebase", kind: "task", ms: 1450,
          input: "{\n  \"subagent_type\": \"Explore\",\n  \"prompt\": \"摸清这个项目的启动方式、目录结构、关键模块，只返回结论\"\n}",
          output: "（子代理在独立上下文中运行…）",
          note: { zh: "Task 是一个普通工具，但它的执行效果是：开一个全新的 Agent 循环（新上下文、新对话）。", en: "Task is an ordinary tool, but its effect is: start a brand-new agent loop (fresh context, fresh conversation)." } }
      ] },
    { label: { zh: "第 3 步 · 上下文隔离", en: "Step 3 · Context isolation" },
      summary: { zh: "子代理内部的 41k token 细节全部隔离，仅返回 300 token 结论", en: "41k tokens of exploration detail stay isolated; only a 300-token summary returns" },
      beats: [
        { t: "sub", task: { zh: "摸清项目结构与启动方式", en: "Map the project structure and startup" },
          child: { zh: "读了 38 个文件，上下文 41k tokens，全部留在子代理内部", en: "Read 38 files, 41k tokens of context — all stays inside the subagent" },
          result: { zh: "结论：npm run dev 启动，入口 src/main.ts，3 个核心模块", en: "Conclusion: npm run dev starts it, entry src/main.ts, 3 core modules" } },
        { t: "note", kind: "key", zh: "子代理的 41k token 细节不会进入主上下文。主 Agent 只收到一段几百字的结论——这就是「上下文隔离」。", en: "The subagent’s 41k tokens of detail never enter the main context. The main agent receives only a few hundred words of conclusion — that’s context isolation." }
      ] },
    { label: { zh: "第 4 步 · 并行子代理", en: "Step 4 · Parallel subagents" },
      summary: { zh: "多个互不依赖的调研任务可同时派生子代理并发完成", en: "Independent investigations can spawn multiple parallel subagents" },
      beats: [
        { t: "say", zh: "摸清楚了：`npm run dev` 启动，入口是 `src/main.ts`。接下来我直接改业务代码。", en: "Got it: `npm run dev` starts the app, entry is `src/main.ts`. Now I’ll work on the business code directly." },
        { t: "note", kind: "info", zh: "多个互不依赖的探索任务可以同时派多个子代理并行跑。主 Agent 只负责分工和汇总。", en: "Multiple independent explorations can run as parallel subagents. The main agent just divides work and summarizes." },
        { t: "done", stats: { "子代理读文件|Files read": 38, "主上下文新增|Main ctx +": "≈ 300 tok", "隔离掉|Isolated": "≈ 41k tok" } }
      ] }
  ],
  freeText: [
    { match: ["为什么", "直接", "自己"], reply: [
      { t: "say", zh: "因为探索细节会污染主上下文。子代理把几万 token 的细节关在自己的上下文里，只返回结论，主 Agent 的预算留给真正的任务。", en: "Because exploration detail pollutes the main context. The subagent keeps tens of thousands of tokens in its own context and returns only the conclusion, preserving the main agent’s budget for the real task." }
    ] },
    { match: ["并行", "同时", "多个"], reply: [
      { t: "say", zh: "互不依赖的任务可以同时派多个子代理并行执行，主 Agent 只负责分工和汇总结果。", en: "Independent tasks can spawn multiple subagents in parallel; the main agent just divides work and summarizes results." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "子代理 = 独立上下文的新 Agent 循环。主 Agent 派它去干「读得多、结论短」的活，细节留在子代理内部，结论带回来。", en: "A subagent = a fresh agent loop with its own context. The main agent sends it “read a lot, conclude briefly” work; details stay inside, conclusions come back." }
  ]
},
/* ================================================================
   10 — Hooks & Permissions
   ================================================================ */
{
  id: "hooks", icon: "i-shield",
  title: { zh: "钩子与权限", en: "Hooks & Permissions" },
  sub: { zh: "工具执行前有一道道关卡：权限审批、钩子拦截、沙盒隔离。模型想干什么，先过安检。",
         en: "Before any tool runs, it passes checkpoints: permission approval, hook interception, sandbox isolation. Whatever the model wants, it goes through security first." },
  hint: { zh: "点「自动演示」，看 Bash 命令如何被拦截；下方可以问「权限模式有哪几种」。",
          en: "Press “Auto play” to watch a Bash command get intercepted; ask “what permission modes exist?” below." },
  placeholder: { zh: "试着问：权限模式有哪几种？钩子能做什么？", en: "Try asking: what permission modes exist? What can hooks do?" },
  steps: [
    { label: { zh: "第 1 步 · 危险操作要审批", en: "Step 1 · Dangerous ops need approval" },
      summary: { zh: "高风险命令在执行前先弹窗请用户确认放行或拒绝", en: "High-risk commands prompt user approval before running" },
      beats: [
        { t: "user", zh: "清理一下临时文件", en: "Clean up the temp files" },
        { t: "say", zh: "我来清理一下。", en: "I’ll clean those up." },
        { t: "perm", cmd: "rm -rf /tmp/build-cache node_modules/.cache",
          risk: { zh: "删除操作 · 不可恢复", en: "Deletion · irreversible" },
          allow: { zh: "已允许，执行中…", en: "Allowed, executing…" },
          deny: { zh: "已拒绝，未执行", en: "Denied, not executed" },
          choice: "allow" }
      ] },
    { label: { zh: "第 2 步 · 权限模式", en: "Step 2 · Permission modes" },
      summary: { zh: "了解 allow / ask / deny / bypass 四种权限策略", en: "Review allow / ask / deny / bypass permission policies" },
      beats: [
        { t: "code", title: "权限模式一览|Permission modes", lang: "ts",
          code: "// allow   —— 白名单里的直接跑，其余照常问\n// ask     —— 每次工具调用都问（默认）\n// deny    —— 危险命令直接拒绝\n// bypass  —— 全部放行（危险！仅沙盒环境）" },
        { t: "note", kind: "info", zh: "权限判断发生在工具执行之前，由 Agent 程序做，不是模型做的。模型就算「想」删库，程序也可以说不。", en: "Permission checks happen before tool execution, done by the agent program — not the model. Even if the model “wants” to wipe the database, the program can say no." }
      ] },
    { label: { zh: "第 3 步 · 钩子：可编程的拦截点", en: "Step 3 · Hooks: programmable interception" },
      summary: { zh: "PreToolUse 钩子拦截保护目录，拒绝危险 rm 命令", en: "PreToolUse hook intercepts protected paths and blocks destructive rm" },
      beats: [
        { t: "say", zh: "再帮我把日志目录也清一下。", en: "Also clear the logs directory." },
        { t: "perm", cmd: "rm -rf ./logs",
          risk: { zh: "删除操作 · 命中 Hook 规则", en: "Deletion · matched a Hook rule" },
          allow: { zh: "Hook 放行，执行中…", en: "Hook allowed it, executing…" },
          deny: { zh: "Hook 拦截：logs/ 是生产日志，禁止删除", en: "Hook blocked it: logs/ holds production logs, deletion forbidden" },
          choice: "deny" },
        { t: "note", kind: "key", zh: "Hook 是用户写的脚本，在工具调用前后触发：PreToolUse 可以拦截/改写，PostToolUse 可以检查结果、写审计日志。", en: "Hooks are user-written scripts fired around tool calls: PreToolUse can block or rewrite, PostToolUse can inspect results and write audit logs." }
      ] },
    { label: { zh: "第 4 步 · 沙盒隔离与 TS Hook 示例", en: "Step 4 · Sandbox isolation & TS Hook" },
      summary: { zh: "查看 TypeScript PreToolUse Hook 示例及沙盒边界", en: "Inspect a TypeScript PreToolUse Hook and sandbox isolation" },
      beats: [
        { t: "code", title: "Hook 脚本示例（PreToolUse）|PreToolUse Hook (TS)", lang: "ts",
          code: "// hooks/pre-tool-use.ts\nconst ev = JSON.parse(await new Response(process.stdin).text());\nif (ev.tool === 'Bash' && ev.input.cmd.includes('rm -rf /')) {\n  console.log(JSON.stringify({ decision: 'block', reason: '禁止删除根目录' }));\n  process.exit(0);\n}\n// 其余情况放行" },
        { t: "note", kind: "info", zh: "沙盒模式下，Bash 命令跑在隔离环境里：文件系统只读、网络受限。即使模型乱来，也出不了沙盒。", en: "In sandbox mode, Bash commands run in an isolated environment: read-only filesystem, restricted network. Even a rogue model can’t escape the sandbox." },
        { t: "done", stats: { "拦截|Blocked": 1, "放行|Allowed": 1, "审计日志|Audit log": "logged" } }
      ] }
  ],
  freeText: [
    { match: ["模式", "权限", "allow", "ask"], reply: [
      { t: "say", zh: "常见模式：allow（白名单直接跑）、ask（每次都问，默认）、deny（危险命令直接拒）、bypass（全部放行，仅限沙盒）。", en: "Common modes: allow (whitelist runs directly), ask (ask every time, the default), deny (dangerous commands refused), bypass (allow all, sandbox only)." }
    ] },
    { match: ["钩子", "hook", "拦截"], reply: [
      { t: "say", zh: "Hook 是用户脚本，在工具调用前后触发。PreToolUse 可以拦截或改写调用，PostToolUse 可以检查结果、写审计日志。", en: "Hooks are user scripts fired around tool calls. PreToolUse can block or rewrite a call; PostToolUse can inspect results and write audit logs." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "工具执行前有三道关：权限模式（allow/ask/deny）、Hook 拦截（PreToolUse）、沙盒隔离。判断由程序做，不由模型做。", en: "Three checkpoints before execution: permission modes (allow/ask/deny), Hook interception (PreToolUse), sandbox isolation. The program makes these calls, not the model." }
  ]
},
/* ================================================================
   11 — Memory & Compaction
   ================================================================ */
{
  id: "memory", icon: "i-memory",
  title: { zh: "记忆与压缩", en: "Memory & Compaction" },
  sub: { zh: "长期记忆是文件系统里的笔记；上下文压缩是把旧对话「总结」成摘要。两者别混淆。",
         en: "Long-term memory is notes on the filesystem; compaction is “summarizing” old conversation. Don’t confuse the two." },
  hint: { zh: "点「自动演示」，看记忆文件和压缩卡片；下方可以问「记忆和压缩什么区别」。",
          en: "Press “Auto play” to see the memory file and compaction card; ask “what’s the difference between memory and compaction?” below." },
  placeholder: { zh: "试着问：记忆和压缩什么区别？记忆存在哪？", en: "Try asking: memory vs compaction? Where is memory stored?" },
  steps: [
    { label: { zh: "第 1 步 · 长期记忆 = 文件", en: "Step 1 · Long-term memory = files" },
      summary: { zh: "把跨会话偏好写入磁盘上的 MEMORY.md，新会话开始时读入", en: "Persist cross-session preferences to MEMORY.md on disk for future sessions" },
      beats: [
        { t: "user", zh: "记住：我们项目用 pnpm，不要用 npm", en: "Remember: this project uses pnpm, not npm" },
        { t: "say", zh: "记下了，我把这条写进项目记忆。", en: "Noted — I’ll write that into the project memory." },
        { t: "mem", lines: [
            { p: "1", text: "# 项目记忆", cls: "h" },
            { p: "2", text: "- 包管理器：pnpm（不要用 npm）", cls: "" },
            { p: "3", text: "- 测试命令：pnpm test", cls: "" },
            { p: "4", text: "- 代码风格：函数式优先", cls: "" },
            { p: "5", text: "", cls: "" },
            { p: "6", text: "## 用户偏好", cls: "h" },
            { p: "7", text: "- 回答用中文，代码注释用英文", cls: "tagx" }
          ] },
        { t: "note", kind: "info", zh: "长期记忆就是磁盘上的 Markdown 文件（比如 MEMORY.md）。每次新会话开始时，Agent 把它读进 system，获得「跨会话的记忆」。", en: "Long-term memory is just a Markdown file on disk (e.g. MEMORY.md). At each new session, the agent reads it into system — gaining “cross-session memory”." }
      ] },
    { label: { zh: "第 2 步 · 记忆的读写时机", en: "Step 2 · When memory is read/written" },
      summary: { zh: "记忆文件采用索引+明细的分层结构以节约常驻上下文", en: "Memory files separate a compact index from detailed topic notes" },
      beats: [
        { t: "note", kind: "key", zh: "读：新会话开始时加载。写：用户明确说「记住」时，或 Agent 判断某条信息长期有用时。记忆文件本身也占上下文，所以要精简。", en: "Read: loaded at session start. Written: when the user says “remember”, or when the agent judges something durably useful. The memory file itself consumes context, so keep it lean." },
        { t: "code", title: "记忆文件的组织|Memory file layout", lang: "ts",
          code: "memory/\n  MEMORY.md      # 索引：每条记忆一行\n  user.md        # 用户偏好\n  project.md     # 项目约定\n  feedback.md    # 纠正过的错误\n// 索引常驻，详情按需读 —— 又是渐进式披露" }
      ] },
    { label: { zh: "第 3 步 · 上下文压缩", en: "Step 3 · Context compaction" },
      summary: { zh: "上下文逼近上限时，先把要点落盘再把旧消息压成 12k 摘要", en: "Before compacting 184k→12k, persist vital facts to disk first" },
      beats: [
        { t: "say", zh: "（对话已经很长了，上下文接近上限，触发压缩…）", en: "(The conversation is long and context is near the limit — triggering compaction…)" },
        { t: "compact", from: 184000, to: 12000,
          summary: { zh: "摘要：已把登录改成签名 cookie；修了 cart 折扣 bug；项目用 pnpm。当前在做支付重构。", en: "Summary: login switched to signed cookies; cart discount bug fixed; project uses pnpm. Currently refactoring payments." } },
        { t: "note", kind: "warn", zh: "压缩会丢细节：原始的工具输出、文件内容都消失了，只剩摘要。所以压缩前 Agent 会先把重要信息写进长期记忆——先落盘，再总结。", en: "Compaction loses detail: raw tool outputs and file contents vanish, leaving only the summary. So before compacting, the agent writes important facts to long-term memory — persist first, then summarize." }
      ] },
    { label: { zh: "第 4 步 · 两者的分工", en: "Step 4 · How they divide the work" },
      summary: { zh: "对比长期记忆（磁盘跨会话）与上下文压缩（会话内省 token）", en: "Contrast persistent disk memory against in-session context compaction" },
      beats: [
        { t: "code", title: "记忆 vs 压缩|Memory vs Compaction", lang: "ts",
          code: "// 长期记忆：跨会话，存在磁盘上\n//   「项目用 pnpm」—— 下次开新会话还记得\n//\n// 上下文压缩：会话内，存在对话里\n//   「刚才聊了什么」—— 压缩后只剩摘要\n//\n// 配合：压缩前把重要事实写入长期记忆" },
        { t: "done", stats: { "压缩前|Before": "184k tok", "压缩后|After": "12k tok", "记忆条目|Entries": 7 } }
      ] }
  ],
  freeText: [
    { match: ["区别", "不同"], reply: [
      { t: "say", zh: "长期记忆跨会话、存在磁盘上（文件）；上下文压缩只在会话内、存在对话里（摘要）。压缩前会把重要事实写入长期记忆。", en: "Long-term memory spans sessions and lives on disk (files); compaction lives inside one session’s conversation (a summary). Before compacting, important facts are written to long-term memory." }
    ] },
    { match: ["存在", "哪", "文件"], reply: [
      { t: "say", zh: "存在磁盘上的 Markdown 文件里，比如 MEMORY.md。每次新会话开始时读进 system。", en: "In Markdown files on disk, e.g. MEMORY.md. Read into system at the start of each new session." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "长期记忆 = 磁盘上的文件，跨会话；上下文压缩 = 会话内的摘要，省 token。配合使用：先落盘，再总结。", en: "Long-term memory = files on disk, cross-session; compaction = in-session summaries, saving tokens. Used together: persist first, then summarize." }
  ]
},
/* ================================================================
   12 — Capstone: Full Lifecycle Trace (Covers ALL 1–11 topics)
   ================================================================ */
{
  id: "capstone", icon: "i-flag",
  title: { zh: "综合实战：完整追踪", en: "Capstone: Full Trace" },
  sub: { zh: "把前面 11 个体验全部串起来：从主循环、请求 JSON、Skills、子代理、MCP、流式工具调用，到分支回滚、Hook 安检、记忆与压缩的完整工程实战。",
         en: "Tying all 11 prior experiences together: main loop, Request JSON, Skills, Subagent, MCP, Streaming tools, Branch/Rollback, Hooks, Memory & Compaction in one realistic build." },
  hint: { zh: "点「自动演示」或逐个悬停/点击这 8 步，每一步都能在右侧 X-Ray 的 5 个面板里找到完整印证！",
          en: "Press “Auto play” or click any of the 8 steps — every single concept from experiences 1–11 has live evidence in the X-Ray panel." },
  placeholder: { zh: "试着问：这次实战用到了哪 11 个机制？压缩和记忆如何配合？", en: "Try asking: how were all 11 mechanisms used here? How did memory & compaction work?" },
  steps: [
    { label: { zh: "第 1 步 · 主循环启动 & 请求组装（1, 2）", en: "Step 1 · Loop start & Request JSON (1, 2)" },
      summary: { zh: "用户输入进入 messages[]，带上 system、tools 与长期记忆发往 API", en: "User task enters messages[] with system, tools & memory in round 1 Request JSON" },
      beats: [
        { t: "user", zh: "按团队规范给 /checkout 加分布式幂等保护，确保并发和重启都不重复扣款", en: "Add distributed idempotency to /checkout per team rules so retries & restarts never double-charge" },
        { t: "xr", patch: { tab: "flow", flow: { active: ["client", "agent", "api"], edge: "e_agent_api", label: "POST /v1/messages" } } },
        { t: "xr", patch: { tab: "request", focus: "messages", request: { ...REQ_BASE,
            system: "You are a coding agent. Memory: project uses pnpm. Resident skills: [checkout-safety: 支付幂等规范]",
            messages: [
              { role: "user", content: "按团队规范给 /checkout 加分布式幂等保护，确保并发和重启都不重复扣款" }
            ] } } },
        { t: "http", method: "POST", url: "https://api.anthropic.com/v1/messages", status: "200 OK", ms: "0.9s" },
        { t: "note", kind: "info", zh: "【覆盖 01 主循环 + 02 请求体 + 11 记忆预读】while 循环第 1 轮把 system（含 MEMORY.md 和 Skill 目录）+ tools + messages 打包发给模型，右侧已聚焦到 messages[]。", en: "[Covers 01 Loop + 02 Request + 11 Memory preload] Round 1 packs system (including MEMORY.md & Skill index) + tools + messages; Request JSON focused on messages[]." }
      ] },
    { label: { zh: "第 2 步 · 按需展开 Skill（8）", en: "Step 2 · Load Skill on demand (8)" },
      summary: { zh: "模型从目录发现 checkout-safety Skill，用 Read 按需读取 SKILL.md 全文", en: "Model spots checkout-safety in the index and Reads SKILL.md via progressive disclosure" },
      beats: [
        { t: "say", zh: "我看到目录里有 `checkout-safety` 技能，先按需展开它的完整规范。", en: "I see the `checkout-safety` skill in the index — let me expand its full spec on demand." },
        { t: "tool", name: "Read", arg: "~/.agent/skills/checkout-safety/SKILL.md", kind: "read", ms: 11,
          input: "{\n  \"path\": \"~/.agent/skills/checkout-safety/SKILL.md\"\n}",
          output: "---\nname: checkout-safety\ndescription: 支付幂等规范\n---\n1. 必须校验 Idempotency-Key 请求头\n2. 幂等锁必须用 Redis（禁止单机内存 Map）\n3. 必须校验 DB 订单唯一索引",
          note: { zh: "【覆盖 08 Skills 渐进式披露】平时只常驻 1 行描述，触发时才读取 300 字规范全文，省掉大量无关 token。", en: "[Covers 08 Skills Progressive Disclosure] Only 1 index line stayed resident; full spec loaded only after matching the task." } }
      ] },
    { label: { zh: "第 3 步 · 子代理隔离探索（9）", en: "Step 3 · Subagent exploration (9)" },
      summary: { zh: "派生 Explore 子代理扫描 24 个文件，32k 探索细节不污染主上下文", en: "Spawn Explore subagent to read 24 files; 32k tokens stay isolated from main context" },
      beats: [
        { t: "say", zh: "支付链路文件较多，我派一个子代理独立摸底，只带回关键路径结论。", en: "The payment flow spans many files — I’ll spawn a subagent to explore in isolation and return just the findings." },
        { t: "tool", name: "Task", arg: "explore payment & redis", kind: "task", ms: 1350,
          input: "{\n  \"subagent_type\": \"Explore\",\n  \"prompt\": \"找出 /checkout 路由、Redis 客户端封装与现有测试文件\"\n}",
          output: "路由: src/routes/checkout.ts | Redis: src/lib/redis.ts | 测试: test/checkout.test.ts",
          note: { zh: "【覆盖 09 子代理】子代理在独立上下文循环中工作，只把压缩后的结论返回给主 Agent。", en: "[Covers 09 Subagents] The subagent ran its own isolated loop and returned only a concise conclusion." } },
        { t: "sub", task: { zh: "定位 /checkout、Redis 封装与测试文件", en: "Locate /checkout route, Redis helper & tests" },
          child: { zh: "读了 24 个文件，消耗 32k tokens，全部留存在子代理上下文内", en: "Read 24 files (32k tokens) — all kept inside subagent context" },
          result: { zh: "结论：入口 src/routes/checkout.ts，Redis 客户端 src/lib/redis.ts", en: "Conclusion: route src/routes/checkout.ts, Redis client src/lib/redis.ts" } }
      ] },
    { label: { zh: "第 4 步 · MCP 查库结构（7）", en: "Step 4 · Query DB schema via MCP (7)" },
      summary: { zh: "通过 JSON-RPC 连接外部 db-server MCP 进程，调用 db_query 确认订单表约束", en: "Use MCP JSON-RPC db-server to call db_query and inspect orders table constraints" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "mcp"], edge: "e_agent_mcp", label: "JSON-RPC tools/call" } } },
        { t: "mcp", rows: [
            { dir: "req", json: "{\"jsonrpc\":\"2.0\",\"id\":11,\"method\":\"tools/call\",\"params\":{\"name\":\"db_query\",\"arguments\":{\"sql\":\"SHOW INDEX FROM orders\"}}}" },
            { dir: "res", json: "{\"jsonrpc\":\"2.0\",\"id\":11,\"result\":{\"content\":[{\"type\":\"text\",\"text\":\"UNIQUE KEY uniq_idem_key (idempotency_key)\"}]}}" }
          ] },
        { t: "tool", name: "db_query", arg: "SHOW INDEX FROM orders", kind: "mcp", ms: 140,
          input: "{\n  \"sql\": \"SHOW INDEX FROM orders\"\n}",
          output: "UNIQUE KEY uniq_idem_key (idempotency_key) — 已建唯一索引",
          note: { zh: "【覆盖 07 MCP 协议】数据库能力由独立 MCP Server 进程提供，通过标准 JSON-RPC 与 Agent 解耦。", en: "[Covers 07 MCP] Database access comes from an external MCP server process decoupled over JSON-RPC." } }
      ] },
    { label: { zh: "第 5 步 · 流式输出 + 并行工具调用（3, 4）", en: "Step 5 · Streaming SSE + Tool calls (3, 4)" },
      summary: { zh: "SSE 流逐帧推送 text_delta 与 input_json_delta，并行读取业务与 Redis 代码", en: "SSE frames stream text_delta & input_json_delta to invoke parallel Read calls" },
      beats: [
        { t: "xr", patch: { tab: "flow", flow: { active: ["agent", "api"], edge: "e_api_agent", label: "SSE stream" } } },
        { t: "sse", focus: "content", frames: [
            { ev: "message_start",       ms: 120, dt: "{\"message\":{\"id\":\"msg_cap5\",\"usage\":{\"input_tokens\":2140}}}" },
            { ev: "content_block_start", ms: 150, dt: "{\"index\":0,\"content_block\":{\"type\":\"text\",\"text\":\"\"}}" },
            { ev: "content_block_delta", ms: 200, dt: "{\"index\":0,\"delta\":{\"type\":\"text_delta\",\"text\":\"我同时读取 checkout.ts 和 redis.ts 来写幂等逻辑。\"}}" },
            { ev: "content_block_start", ms: 150, dt: "{\"index\":1,\"content_block\":{\"type\":\"tool_use\",\"id\":\"toolu_r1\",\"name\":\"Read\"}}" },
            { ev: "content_block_delta", ms: 200, dt: "{\"index\":1,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"path\\\":\\\"src/routes/checkout.ts\\\"}\"}}" },
            { ev: "content_block_start", ms: 150, dt: "{\"index\":2,\"content_block\":{\"type\":\"tool_use\",\"id\":\"toolu_r2\",\"name\":\"Read\"}}" },
            { ev: "content_block_delta", ms: 200, dt: "{\"index\":2,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"path\\\":\\\"src/lib/redis.ts\\\"}\"}}" },
            { ev: "message_delta",       ms: 130, dt: "{\"delta\":{\"stop_reason\":\"tool_use\"},\"usage\":{\"output_tokens\":84}}" },
            { ev: "message_stop",        ms: 100, dt: "{}" }
          ] },
        { t: "say", zh: "我同时读取 `checkout.ts` 和 `redis.ts` 来写幂等逻辑。", en: "I’ll read `checkout.ts` and `redis.ts` in parallel to implement the idempotency guard." },
        { t: "tool", name: "Read", arg: "src/routes/checkout.ts & redis.ts", kind: "read", ms: 19,
          input: "[\n  { \"id\": \"toolu_r1\", \"path\": \"src/routes/checkout.ts\" },\n  { \"id\": \"toolu_r2\", \"path\": \"src/lib/redis.ts\" }\n]",
          output: "checkout.ts: router.post('/checkout', …)\nredis.ts: export async function acquireLock(key, ttlSec)",
          note: { zh: "【覆盖 03 流式输出 + 04 并行工具调用】一轮 SSE 同时拼出两个 tool_use，Agent 并行读完后按 tool_use_id 回填结果。", en: "[Covers 03 Streaming + 04 Parallel Tool Calls] One SSE turn streams two tool_use blocks; results match back by tool_use_id." } }
      ] },
    { label: { zh: "第 6 步 · 分支尝试与检查点回滚（6）", en: "Step 6 · Branching & Checkpoint rollback (6)" },
      summary: { zh: "先试单机内存 Set 后回滚检查点，分叉改为 Redis 分布式幂等方案", en: "Try in-memory Set, rewind checkpoint, then fork a Redis-backed branch" },
      beats: [
        { t: "say", zh: "我先尝试过单机 `Set` 去重并改了文件（#c3），但想起 `checkout-safety` 规范禁止内存锁——重启会丢！立即回滚检查点并从 #c1 分叉到 Redis 方案。", en: "I initially tried an in-memory `Set` (#c3), then recalled the `checkout-safety` skill forbids local locks — restarts lose keys! Rewinding checkpoint and forking from #c1 to Redis." },
        { t: "tool", name: "Edit", arg: "src/routes/checkout.ts", kind: "edit", ms: 16,
          input: "{\n  \"path\": \"src/routes/checkout.ts\",\n  \"old\": \"router.post('/checkout', async (req, res) => {\",\n  \"next\": \"router.post('/checkout', redisIdempotent({ ttl: 3600 }), async (req, res) => {\"\n}",
          output: "✓ checkpoint restored & edited src/routes/checkout.ts (Redis branch)",
          note: { zh: "【覆盖 06 分支与回滚】右侧「分支」树展示了被放弃的「内存 Set」分支与当前激活的「Redis 幂等」分支。", en: "[Covers 06 Branching & Rollback] Check the Branch tab on the right: the abandoned memory-Set path stays on the tree while the Redis branch is active." } },
        { t: "xr", patch: { tab: "tree", tree: { nodes: [
            { id: "c1", label: "加固 /checkout 幂等|Harden /checkout", sub: "user · #1", x: 0, y: 0, parent: null },
            { id: "c2", label: "尝试内存 Set|Try memory Set", sub: "assistant · #2", x: 0, y: 1, parent: "c1" },
            { id: "c3", label: "Edit (已回滚)|Rewound", sub: "checkpoint · #3", x: 0, y: 2, parent: "c2" },
            { id: "c4", label: "分叉: Redis 幂等|Fork: Redis lock", sub: "fork · #4", x: 1, y: 1, parent: "c1" },
            { id: "c5", label: "Edit checkout.ts|Edit checkout.ts", sub: "tool · #5", x: 1, y: 2, parent: "c4" }
          ], current: "c5" } } }
      ] },
    { label: { zh: "第 7 步 · Hook 拦截与权限审批（10）", en: "Step 7 · Hooks & Permissions gate (10)" },
      summary: { zh: "PreToolUse Hook 拦截危险清库命令，安全放行 pnpm test 验证", en: "PreToolUse Hook blocks unsafe DB wipe while allowing pnpm test verification" },
      beats: [
        { t: "perm", cmd: "redis-cli FLUSHALL && psql -c 'TRUNCATE orders'",
          risk: { zh: "高危清库操作 · 命中 PreToolUse Hook", en: "Destructive wipe · matched PreToolUse Hook" },
          allow: { zh: "放行执行…", en: "Allowed…" },
          deny: { zh: "Hook 拦截：禁止清空生产 Redis / orders 表，请用独立测试库", en: "Hook blocked: production Redis/orders wipe forbidden; use isolated test DB" },
          choice: "deny" },
        { t: "tool", name: "Bash", arg: "pnpm test checkout", kind: "bash", ms: 1350,
          input: "{\n  \"cmd\": \"pnpm test checkout\"\n}",
          output: "Tests: 14 passed (含并发重放 + 服务重启幂等用例)",
          note: { zh: "【覆盖 10 钩子与权限】危险命令被程序侧 Hook 硬拦截；安全的 pnpm 测试命令通过权限并全绿（14 passed）。", en: "[Covers 10 Hooks & Permissions] Dangerous wipe was blocked by a program-side Hook; safe pnpm tests passed (14 passed)." } }
      ] },
    { label: { zh: "第 8 步 · 上下文压缩 + 记忆落盘 + 全课总结（5, 11）", en: "Step 8 · Compaction, Memory & Full Map (5, 11)" },
      summary: { zh: "上下文逼近上限前先把新约定写入 MEMORY.md，再压缩对话并输出全知识地图", en: "Persist new convention to MEMORY.md before compacting 178k→14k tokens" },
      beats: [
        { t: "xr", patch: { tab: "context", context: { messages: [
            { role: "user",      text: "按团队规范给 /checkout 加分布式幂等保护…", tokens: 24 },
            { role: "assistant", text: "tool_use: Read(checkout-safety/SKILL.md)", tokens: 26 },
            { role: "user",      text: "tool_result: <Skill spec…>", tokens: 320 },
            { role: "assistant", text: "tool_use: Task(Explore) → 结论 260 tok", tokens: 280 },
            { role: "user",      text: "tool_result: db_query(uniq_idem_key)", tokens: 95 },
            { role: "assistant", text: "tool_use: Read + Edit(Redis branch)", tokens: 410 },
            { role: "user",      text: "tool_result: Hook blocked FLUSHALL; pnpm test 14 passed", tokens: 180 },
            { role: "assistant", text: "compacted summary + MEMORY.md updated", tokens: 120 }
          ], used: 1455, budget: 200000 } } },
        { t: "mem", lines: [
            { p: "1", text: "# MEMORY.md (更新并落盘)", cls: "h" },
            { p: "2", text: "- 包管理器：pnpm", cls: "" },
            { p: "3", text: "- 支付幂等：强制 Redis 锁 + DB 唯一索引（禁止内存 Map）", cls: "tagx" }
          ] },
        { t: "compact", from: 178000, to: 14000,
          summary: { zh: "压缩摘要：已通过 checkout-safety Skill、Explore 子代理、MCP 查表与 Redis 分支完成 /checkout 幂等改造，Hook 拦截清库，pnpm test 14/14 通过。", en: "Summary: hardened /checkout via checkout-safety Skill, Explore subagent, MCP DB check & Redis branch; Hook blocked wipe; 14/14 pnpm tests green." } },
        { t: "say", zh: "全部完成！`/checkout` 已切换为 `Redis + DB 唯一索引` 分布式幂等保护，`14` 个并发与重启测试全过。\n\n我们刚刚一口气完整走遍了前面 1~11 项全部机制：\n- **01 主循环** & **02 请求 JSON**：打包 `system + tools + messages` 驱动多轮决策\n- **03 流式输出** & **04 工具调用**：SSE 逐帧拼装并行工具并按 `id` 回填\n- **05 上下文管理** & **11 记忆/压缩**：先写 `MEMORY.md` 再把 `178k` 压到 `14k`\n- **06 分支回滚**：舍弃内存方案，回滚快照并分叉出 Redis 方案\n- **07 MCP** & **08 Skills** & **09 子代理**：外接数据库、按需加载规范、隔离探索噪音\n- **10 钩子与权限**：`PreToolUse` Hook 硬拦截危险清库命令", en: "All done! `/checkout` now uses `Redis + DB unique index` distributed idempotency, and all `14` concurrency/restart tests pass.\n\nThis single trace exercised all 11 prior mechanisms:\n- **01 Loop & 02 Request JSON**: multi-turn decisions from `system + tools + messages`\n- **03 Streaming & 04 Tool Calls**: SSE frames assembling parallel `tool_use` + `tool_result`\n- **05 Context & 11 Memory/Compaction**: persisted `MEMORY.md` before compacting `178k → 14k`\n- **06 Branch & Rollback**: rewound in-memory attempt and forked to Redis\n- **07 MCP, 08 Skills, 09 Subagents**: external DB RPC, progressive spec loading, isolated exploration\n- **10 Hooks & Permissions**: `PreToolUse` Hook blocked destructive DB wipe" },
        { t: "done", stats: { "覆盖机制|Topics": "11 / 11", "轮次|Rounds": 8, "上下文压缩|Compacted": "178k→14k", "测试通过|Tests": "14 / 14" } }
      ] }
  ],
  freeText: [
    { match: ["11", "覆盖", "机制", "回顾", "总结", "地图"], reply: [
      { t: "say", zh: "第 12 课 8 步覆盖全部 11 项：① 第 1 步主循环与请求体；② 第 2 步 Skills 渐进式披露；③ 第 3 步子代理上下文隔离；④ 第 4 步 MCP JSON-RPC；⑤ 第 5 步 SSE 流式与并行工具调用；⑥ 第 6 步分支与快照回滚；⑦ 第 7 步 Hook 拦截与权限审批；⑧ 第 8 步上下文预算、长期记忆落盘与 Compaction 压缩。", en: "All 11 prior topics appear across the 8 steps: (1) Loop & Request JSON, (2) Skills progressive disclosure, (3) Subagent isolation, (4) MCP JSON-RPC, (5) SSE streaming & parallel tools, (6) Branching & rollback, (7) Hooks & permissions, (8) Context budget, disk Memory & Compaction." }
    ] },
    { match: ["压缩", "记忆", "token", "配合"], reply: [
      { t: "say", zh: "压缩前先把重要新规则（Redis 幂等约定）落盘写入 MEMORY.md，随后再把冗长的中间过程从 178k 压缩成 14k 摘要——既保住长期知识又腾出上下文预算。", en: "Before compacting, durable conventions (Redis idempotency rule) are saved to MEMORY.md on disk; then 178k of verbose tool logs shrink to a 14k summary." }
    ] }
  ],
  defaultReply: [
    { t: "say", zh: "这个综合实战把前面 11 个体验的全部机制都串进了真实工程流程。你可以点击上方任意步骤横线单独重看某一步，并在右侧 X-Ray 5 个标签页中交叉印证。", en: "This capstone connects all 11 prior mechanisms into one engineering workflow. Click any step bar above to replay that single step and inspect its evidence across all 5 X-Ray tabs." }
  ]
}
];
