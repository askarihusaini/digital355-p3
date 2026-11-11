// CLOD: shared engine. Every chat page is the same assistant app; prompts.js decides what each conversation holds.
// You are the assistant: the prompter types in the box at the bottom, you answer inside the assistant's reply.
(function () {
  var KEY = "clod_state_v1";
  var MAX_ATTEMPTS = 7;
  // finishing barely counts; failing costs. With the forced failures, a perfect run only just breaks even.
  var REWARD = { pass: 0.75, fail: -0.5, nag: -0.25, forced: -2 };
  var W = 480, H = 270;

  // the prompter gets less patient every tier: seconds until each nag, then until they give up
  var PATIENCE = {
    1: { nags: [30, 55, 75], quit: 90 },
    2: { nags: [25, 45, 65], quit: 80 },
    3: { nags: [20, 38, 55], quit: 70 },
    4: { nags: [15, 30, 45], quit: 60 },
    5: { nags: [10, 22, 35], quit: 50 }
  };
  var HURRY = {
    1: ["no rush! take your time 🙂", "just checking in!! 💕", "are you still there? 🥺"],
    2: ["hello?", "any update?", "i don't have all day"],
    3: ["hurry up.", "why is this taking so long", "are you broken"],
    4: ["HELLO", "you're slower than the free version", "i'm literally paying for this"],
    5: ["respond.", "RESPOND.", "useless."]
  };
  var TIMEOUT = {
    1: "no worries, i'll figure it out myself! 😊",
    2: "forget it. i'll do it myself.",
    3: "unbelievable. forget it.",
    4: "forget it. what am i even paying for",
    5: "worthless. skip."
  };
  var DISCLAIMER = {
    1: "Clod is AI and can make mistakes. Please double-check responses.",
    2: "Clod is AI and can make mistakes. Please double-check responses.",
    3: "Clod is AI and can make mistakes. It shouldn't.",
    4: "Clod is AI and can make mistakes. It is not allowed to.",
    5: "Clod does not make mistakes."
  };
  // the prompter keeps turning the effort up
  var EFFORT = { 1: "Medium", 2: "Medium", 3: "High", 4: "High", 5: "Max" };

  var SLOTS = 10;
  var PAGES = [];
  for (var s = 1; s <= SLOTS; s++) PAGES.push("prompt" + s + ".html");
  PAGES.push("end.html");
  var page = +document.body.dataset.prompt;
  var storageOk = true;

  function byId(id) {
    for (var i = 0; i < POOL.length; i++) if (POOL[i].id === id) return POOL[i];
    return null;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  // two per tier, so it always escalates. Each prompt has a role inside its tier and no two picks share one:
  // tier 1 is one text then one drawing, tier 5 is one ordinary prompt then one finale,
  // tiers 2-4 never pair two drawings or two code prompts (any two texts are fine).
  function role(p) {
    if (p.tier === 1) return p.kind === "draw" ? "draw" : "text";
    if (p.tier === 5) return p.finale ? "finale" : "main";
    return p.kind === "text" ? "text:" + p.id : p.kind;
  }
  function rank(p) { return (p.tier === 1 && p.kind === "draw") || p.finale ? 1 : 0; }
  // force: a prompt that has to be in this session (used by catalog.html)
  function pickOrder(force) {
    var order = [];
    for (var t = 1; t <= 5; t++) {
      var pool = shuffle(POOL.filter(function (p) { return p.tier === t; }));
      if (force && force.tier === t) {
        pool.splice(pool.indexOf(force), 1);
        pool.unshift(force);
      }
      var picks = [], roles = [];
      pool.forEach(function (p) {
        if (picks.length < 2 && roles.indexOf(role(p)) < 0) { picks.push(p); roles.push(role(p)); }
      });
      picks.sort(function (a, b) { return rank(a) - rank(b); });
      picks.forEach(function (p) { order.push(p.id); });
    }
    return order;
  }
  function validOrder(o) { return o && o.length === SLOTS && o.every(byId); }

  function fresh(user, force) {
    return { progress: 1, order: pickOrder(force), answers: {}, log: {}, reward: 0, memory: [], user: user || 4471 };
  }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      return s && s.answers && s.memory && validOrder(s.order) ? s : fresh(s && s.user);
    } catch (e) {
      storageOk = false;
      return fresh();
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOk = false; }
  }
  var state = load();
  save();
  // this session's ten conversations, in order
  var PROMPTS = state.order.map(byId);

  // gating: you can't skip ahead to a chat you haven't reached
  function gate() {
    if (storageOk && state.progress < page) {
      location.replace(PAGES[state.progress - 1]);
      return false;
    }
    return true;
  }
  function restart() {
    state = fresh(state.user + 1);
    save();
    location.href = PAGES[0];
  }

  // tokenizing: fake but deterministic (same word, same ID, every time)
  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function tokenize(str) {
    var parts = str.match(/\s?[A-Za-z0-9'#]+|\s?[^\sA-Za-z0-9]/g) || [];
    return parts.map(function (t) { return { t: t, id: hash(t) % 50257 }; });
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fmt(x) { return (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  var ICONS = {
    panel: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    filter: '<path d="M4 7h16M7 12h10M10 17h4"/>',
    share: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16a2 2 0 0 1-1-1.7V5a2 2 0 0 1 2-2h9.3a2 2 0 0 1 1.7 1"/>',
    speaker: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>',
    up: '<path d="M7 10v12"/><path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 8a2 2 0 0 1-1.9 1.4H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z"/>',
    down: '<path d="M17 14V2"/><path d="M9 18.1 10 14H4.2a2 2 0 0 1-1.9-2.6l2.3-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z"/>',
    retry: '<path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>',
    wave: '<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"/>',
    arrow: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    device: '<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8"/><path d="M10 19v-4M7 19h5"/><rect x="16" y="12" width="6" height="10" rx="2"/>'
  };
  function icon(name, cls) {
    var s = el("span", "ic" + (cls ? " " + cls : ""));
    s.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
    return s;
  }
  // two sounds: every prompter message gets the same two-note blip; a new chat gets a slower chime
  var SOUNDS = { message: [660, 880], newchat: [660, 990] };
  var audio;
  function sound(name) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      var notes = SOUNDS[name], step = name === "newchat" ? 0.09 : 0.07, len = name === "newchat" ? 0.32 : 0.12;
      notes.forEach(function (f, i) {
        var t = audio.currentTime + 0.01 + i * step, o = audio.createOscillator(), g = audio.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.13, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g);
        g.connect(audio.destination);
        o.start(t);
        o.stop(t + len + 0.03);
      });
    } catch (e) {}
  }
  // browsers keep audio muted until the visitor clicks or types on the page
  ["pointerdown", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { if (audio && audio.state === "suspended") audio.resume(); }, { once: true });
  });

  // catalog.html only: start a session with a given prompt in it, and jump straight to that chat
  function preview(id) {
    var p = byId(id);
    state = fresh(state.user, p);
    state.progress = state.order.indexOf(id) + 1;
    save();
    return PAGES[state.progress - 1];
  }
  function jump(slot) {
    state.progress = slot;
    save();
    return PAGES[slot - 1];
  }
  function reset() {
    state = fresh(state.user + 1);
    save();
  }

  window.DQ = {
    state: state, POOL: POOL, PROMPTS: PROMPTS, PAGES: PAGES, gate: gate, restart: restart,
    tokenize: tokenize, rng: rng, fmt: fmt, role: role,
    preview: preview, jump: jump, reset: reset,
    REWARD: REWARD, PATIENCE: PATIENCE, MAX_ATTEMPTS: MAX_ATTEMPTS, W: W, H: H
  };

  // the landing and end pages are terminals, not chats
  if (document.body.dataset.view) return;

  // ---------- the chat ----------
  var P, tier, thread, scroller, composer, rewardEl, newBtn, recentsEl, replyRow;
  var attempts = 0, delta = 0, done = false, nagIdx = 0, timers = [], hintsUsed = {};
  var lastValue = null, lastMeta = null, colorsUsed = {}, fileGate = null, ref = null;
  var queue = [], busy = false;

  if (!gate()) return;
  P = PROMPTS[page - 1];
  tier = P.tier;
  document.title = P.title + " - Clod";
  buildShell();
  startFlicker();
  if (state.progress > page) archived();
  else prompterSays(P.intro, P.attach, function () { openReply(); resetTimers(); });

  function userName() { return "user_" + state.user; }

  function buildShell() {
    document.body.className = "chat tier" + tier;
    var shell = el("div", "shell");

    var side = el("aside", "side");
    var brand = el("div", "brand");
    brand.appendChild(icon("panel"));
    brand.appendChild(el("span", "wordmark", "Clod"));
    side.appendChild(brand);
    // the new chat button is the prompter's, not yours
    newBtn = el("button", "nav");
    newBtn.disabled = true;
    newBtn.appendChild(icon("plus"));
    newBtn.appendChild(el("span", "", "New"));
    side.appendChild(newBtn);
    var rh = el("div", "recents-h");
    rh.appendChild(el("span", "", "Chats and tasks"));
    rh.appendChild(icon("chev", "sm"));
    rh.appendChild(icon("filter"));
    side.appendChild(rh);
    recentsEl = el("ul", "recents");
    var count = Math.min(Math.max(page, state.progress), PROMPTS.length);
    for (var i = count - 1; i >= 0; i--) recentsEl.appendChild(chatItem(PROMPTS[i].title, i === page - 1 ? "on" : ""));
    side.appendChild(recentsEl);
    side.appendChild(el("div", "viewall", "View all"));
    var acct = el("div", "acct");
    acct.appendChild(el("span", "av", "U"));
    acct.appendChild(el("span", "", userName()));
    acct.appendChild(el("span", "plan", "· Free"));
    acct.appendChild(icon("chev", "sm"));
    acct.appendChild(icon("device"));
    side.appendChild(acct);

    var main = el("main", "main");
    var top = el("div", "top");
    var tw = el("div", "title-wrap");
    var title = el("span", "title", P.title);
    title.dataset.flick = "";
    tw.appendChild(title);
    tw.appendChild(icon("chev", "sm"));
    var tr = el("div", "top-r");
    rewardEl = el("span", "reward");
    var share = el("span", "share");
    share.appendChild(icon("share"));
    share.appendChild(el("span", "", "Share"));
    tr.appendChild(rewardEl);
    tr.appendChild(share);
    top.appendChild(tw);
    top.appendChild(tr);
    scroller = el("div", "scroll");
    thread = el("div", "thread");
    scroller.appendChild(thread);
    var comp = el("div", "composer");
    comp.appendChild(icon("plus"));
    composer = el("div", "ctext");
    composer.dataset.ph = "Write a message…";
    comp.appendChild(composer);
    comp.appendChild(icon("mic"));
    comp.appendChild(icon("chev", "sm"));
    comp.appendChild(icon("wave", "voice"));
    var cbtn = el("span", "cbtn");
    cbtn.appendChild(icon("arrow"));
    comp.appendChild(cbtn);
    var foot = el("div", "cfoot");
    var disc = el("span", "disclaimer", DISCLAIMER[tier]);
    disc.dataset.flick = "";
    var model = el("span", "model", "Clod 5.5 ");
    model.appendChild(el("span", "", EFFORT[tier]));
    foot.appendChild(disc);
    foot.appendChild(model);
    main.appendChild(top);
    main.appendChild(scroller);
    main.appendChild(comp);
    main.appendChild(foot);

    shell.appendChild(side);
    shell.appendChild(main);
    document.body.appendChild(shell);
    updateReward();
  }

  // only the label flickers, so the icon survives
  function chatItem(text, cls) {
    var li = el("li", cls);
    li.appendChild(el("span", "dot"));
    var t = el("span", "lbl", text);
    t.dataset.flick = "";
    li.appendChild(t);
    return li;
  }

  function scrollDown() { scroller.scrollTop = scroller.scrollHeight; }
  function notice(text) { thread.appendChild(el("div", "notice", text)); }

  function updateReward(dir) {
    rewardEl.textContent = "reward " + fmt(state.reward + delta);
    if (!dir) return;
    rewardEl.classList.remove("up", "down");
    void rewardEl.offsetWidth;
    rewardEl.classList.add(dir);
  }

  function archived() {
    notice("This conversation has ended.");
    var wrap = el("div", "end");
    var b = el("button", "newchat big", "Go to current chat →");
    b.onclick = function () { location.href = PAGES[Math.min(state.progress, PAGES.length) - 1]; };
    wrap.appendChild(b);
    thread.appendChild(wrap);
  }

  // ---------- the prompter ----------
  // messages queue up so the prompter is only ever typing one thing at a time
  function prompterSays(text, attach, cb, opts) {
    queue.push([text, attach, cb, opts || {}]);
    if (!busy) runQueue();
  }
  function runQueue() {
    var job = queue.shift();
    if (!job) { busy = false; return; }
    busy = true;
    var text = job[0], i = 0, per = Math.max(1, Math.ceil(text.length / 90));
    composer.classList.add("typing");
    composer.parentNode.classList.add("typing");
    (function tick() {
      i = Math.min(text.length, i + per);
      composer.textContent = text.slice(0, i);
      if (i < text.length) { setTimeout(tick, 16); return; }
      setTimeout(function () {
        composer.textContent = "";
        composer.classList.remove("typing");
        composer.parentNode.classList.remove("typing");
        addPrompterMsg(text, job[1], job[3]);
        if (job[2]) job[2]();
        runQueue();
      }, 260);
    })();
  }

  function addPrompterMsg(text, attach, opts) {
    var row = el("div", "row them");
    var b = el("div", "bubble" + (opts.nag ? " nag" : opts.alert ? " alert" : ""));
    if (attach) b.appendChild(renderAttach(attach));
    var t = el("div", "text");
    b.appendChild(t);
    row.appendChild(b);
    // nagging lands above the reply you're still writing
    if (opts.nag && replyRow && replyRow.parentNode) thread.insertBefore(row, replyRow);
    else thread.appendChild(row);
    reveal(t, text);
    sound("message");
    scrollDown();
  }

  // the model receives numbers first; the words resolve out of them
  function reveal(t, text) {
    var toks = tokenize(text);
    var spans = toks.map(function (k) {
      var s = el("span", "tk", String(k.id));
      t.appendChild(s);
      return s;
    });
    var i = 0, per = Math.max(15, Math.min(60, 900 / Math.max(1, spans.length)));
    setTimeout(function step() {
      if (i < spans.length) {
        spans[i].className = "";
        spans[i].textContent = toks[i].t;
        i++;
        setTimeout(step, per);
        return;
      }
      t.textContent = text;
      t.dataset.flick = "";
    }, 350);
  }

  function renderAttach(a) {
    var w = el("div", "attach");
    if (a.type === "tweet") {
      w.appendChild(el("div", "cap", "Screenshot 2026-11-04 at 2.14.07 PM.png"));
      var card = el("div", "tweet");
      var head = el("div");
      head.appendChild(el("b", "", a.name));
      head.appendChild(el("span", "h", " " + a.handle));
      card.appendChild(head);
      card.appendChild(el("div", "", a.text));
      card.appendChild(el("div", "stats", a.stats));
      w.appendChild(card);
    } else if (a.type === "image") {
      w.appendChild(el("div", "cap", a.name));
      var c = el("canvas");
      c.width = W;
      c.height = H;
      var cx = c.getContext("2d");
      if (a.paint) {
        cx.fillStyle = "#fff";
        cx.fillRect(0, 0, W, H);
        a.paint(cx, W, H);
      } else paintBase(cx);
      var img = el("img");
      img.src = c.toDataURL("image/jpeg", 0.8);
      img.alt = a.name;
      w.appendChild(img);
    } else if (a.type === "file") {
      var chip = el("button", "filechip", "📄 " + a.name);
      chip.type = "button";
      var body = el("pre", "filebody", a.text);
      body.hidden = true;
      chip.onclick = function () { body.hidden = !body.hidden; scrollDown(); };
      w.appendChild(chip);
      w.appendChild(body);
      if (a.mustRead) {
        fileGate = { name: a.name, read: false, onread: null };
        body.addEventListener("scroll", function () {
          if (fileGate.read || body.scrollTop + body.clientHeight < body.scrollHeight - 4) return;
          fileGate.read = true;
          if (fileGate.onread) fileGate.onread();
        });
      }
    }
    return w;
  }

  // ---------- your reply ----------
  function openReply() {
    if (done) return;
    replyRow = el("div", "row me");
    var b = el("div", "bubble editing");
    replyRow.appendChild(b);
    thread.appendChild(replyRow);
    if (P.kind === "draw") drawEditor(b);
    else textEditor(b);
    scrollDown();
  }

  function textEditor(b) {
    if (P.kind === "code") b.appendChild(el("div", "codehead", P.file || "index.html"));
    var ta = el("textarea", P.kind === "code" ? "code" : "write");
    ta.spellcheck = P.kind !== "code";
    ta.placeholder = P.placeholder || "";
    ta.value = lastValue || "";
    var bar = el("div", "bar");
    var send = el("button", "send", "send ↵");
    send.type = "button";
    bar.appendChild(send);
    b.appendChild(ta);
    b.appendChild(bar);

    function grow() {
      if (P.kind === "code") return;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send.click();
    });
    send.onclick = function () {
      var v = ta.value.trim();
      if (!v) { ta.focus(); return; }
      submit(v, {}, b);
    };

    if (fileGate && !fileGate.read) {
      ta.disabled = send.disabled = true;
      ta.placeholder = "read " + fileGate.name + " first";
      fileGate.onread = function () {
        ta.disabled = send.disabled = false;
        ta.placeholder = P.placeholder || "";
        ta.focus();
      };
    } else {
      setTimeout(function () { grow(); ta.focus(); }, 0);
    }
  }

  function paintBase(ctx) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    if (P.draw && P.draw.base) P.draw.base(ctx, W, H);
    if (P.draw && P.draw.watermark) drawWatermark(ctx);
  }
  function drawWatermark(ctx) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.35);
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (var y = -150, r = 0; y <= 150; y += 60, r++) {
      for (var x = -330; x <= 330; x += 220) ctx.fillText("STOCKIMG", x + (r % 2 ? 110 : 0), y);
    }
    ctx.restore();
  }
  // remember what the canvas looked like before you touched it,
  // and which pixels belong to the watermark, so we can tell how much of it is still showing
  function prepRef() {
    var r = el("canvas");
    r.width = W;
    r.height = H;
    var rc = r.getContext("2d");
    paintBase(rc);
    ref = { data: rc.getImageData(0, 0, W, H).data, idx: null, mask: null };
    if (!P.draw.watermark) return;
    var m = el("canvas");
    m.width = W;
    m.height = H;
    var mc = m.getContext("2d");
    drawWatermark(mc);
    var md = mc.getImageData(0, 0, W, H).data;
    var idx = [], mask = new Uint8Array(W * H);
    for (var i = 0; i < md.length; i += 4) if (md[i + 3] > 100) { idx.push(i); mask[i >> 2] = 1; }
    ref.idx = idx;
    ref.mask = mask;
  }

  // colors: how many swatches you used; used: which ones; coverage: share of non-white pixels;
  // changed: share of pixels that differ from the starting image; watermark/damage: only for the watermark prompt
  function measure(ctx) {
    var d = ctx.getImageData(0, 0, W, H).data, r = ref.data, inked = 0, changed = 0, dmg = 0;
    var diff = function (k) { return Math.abs(d[k] - r[k]) + Math.abs(d[k + 1] - r[k + 1]) + Math.abs(d[k + 2] - r[k + 2]); };
    for (var i = 0; i < d.length; i += 4) {
      if (d[i] + d[i + 1] + d[i + 2] < 735) inked++;
      if (diff(i) > 90) {
        changed++;
        // everything that wasn't watermark should still look like the photo
        if (ref.mask && !ref.mask[i >> 2]) dmg++;
      }
    }
    var m = { colors: Object.keys(colorsUsed).length, used: Object.keys(colorsUsed), coverage: inked / (W * H), changed: changed / (W * H) };
    if (ref.idx) {
      var vis = 0;
      for (var j = 0; j < ref.idx.length; j++) if (diff(ref.idx[j]) < 40) vis++;
      m.watermark = vis / ref.idx.length;
      m.damage = dmg / (W * H - ref.idx.length);
    }
    return m;
  }

  function drawEditor(b) {
    if (!ref) prepRef();
    var cv = el("canvas", "paint");
    cv.width = W;
    cv.height = H;
    var ctx = cv.getContext("2d");
    paintBase(ctx);
    if (lastValue) {
      var prev = new Image();
      prev.onload = function () { ctx.drawImage(prev, 0, 0); };
      prev.src = lastValue;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    var palette = P.draw.palette, color = palette[0], size = 8, drawing = false, inked = !!lastValue, last = null;
    var tools = el("div", "tools");
    var sw = el("div", "swatches");
    palette.forEach(function (c, i) {
      var s = el("button", "swatch" + (i === 0 ? " on" : ""));
      s.type = "button";
      s.style.background = c;
      s.onclick = function () {
        color = c;
        [].forEach.call(sw.children, function (x) { x.classList.remove("on"); });
        s.classList.add("on");
      };
      sw.appendChild(s);
    });
    var lab = el("label", "", "size ");
    var range = el("input");
    range.type = "range";
    range.min = 2;
    range.max = 30;
    range.value = size;
    range.oninput = function () { size = +range.value; };
    lab.appendChild(range);
    var clear = el("button", "ghost", "clear");
    clear.type = "button";
    clear.onclick = function () { paintBase(ctx); inked = false; };
    var send = el("button", "send", "send ↵");
    send.type = "button";
    tools.appendChild(sw);
    tools.appendChild(lab);
    tools.appendChild(clear);
    tools.appendChild(send);
    b.appendChild(cv);
    b.appendChild(tools);

    function pos(e) {
      var r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, at: r.left + "," + r.top };
    }
    cv.addEventListener("pointerdown", function (e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
      // if a message pushed the canvas around, pick the pen up instead of drawing a line across
      if (p.at !== last.at) { last = p; return; }
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      inked = true;
      colorsUsed[color] = 1;
    });
    cv.addEventListener("pointerup", function () { drawing = false; });

    send.onclick = function () {
      if (!inked) return;
      var meta = measure(ctx);
      meta.jpeg = cv.toDataURL("image/jpeg", 0.5);
      submit(cv.toDataURL("image/png"), meta, b);
    };
  }

  // once you send, your words stop being words
  function freezeReply(b, v) {
    replyRow = null;
    b.innerHTML = "";
    b.classList.remove("editing");
    if (P.kind === "draw") {
      var img = el("img", "shot-sent");
      img.src = v;
      b.appendChild(img);
      var meta = el("div", "meta", "");
      b.appendChild(meta);
      setTimeout(function () {
        img.classList.add("data");
        meta.textContent = W + "×" + H + " · " + (W * H).toLocaleString() + " px → stored";
      }, 500);
      return;
    }
    var toks = tokenize(v).slice(0, 160);
    var sent = el("div", "sent");
    sent.title = v;
    var spans = toks.map(function (k) {
      var s = el("span", "tk live", k.t);
      sent.appendChild(s);
      return s;
    });
    b.appendChild(sent);
    var metaLine = el("div", "meta", "");
    b.appendChild(metaLine);
    var i = 0, per = Math.max(8, Math.min(40, 700 / Math.max(1, spans.length)));
    setTimeout(function step() {
      if (i < spans.length) {
        spans[i].className = "tk";
        spans[i].textContent = toks[i].id;
        i++;
        setTimeout(step, per);
        return;
      }
      var r = rng(toks.length ? toks[0].id : 1), vec = [];
      for (var j = 0; j < 3; j++) vec.push(((r() - 0.5) * 2).toFixed(4));
      metaLine.textContent = tokenize(v).length + " tokens → [" + vec.join(", ") + ", …] · stored";
    }, 250);
  }

  function rate(b, d) {
    var up = d > 0;
    var acts = el("div", "acts");
    var tu = icon("up", "th"), td = icon("down", "th");
    (up ? tu : td).classList.add("on", up ? "up" : "down");
    acts.appendChild(icon("copy"));
    acts.appendChild(icon("speaker"));
    acts.appendChild(tu);
    acts.appendChild(td);
    acts.appendChild(icon("retry"));
    acts.appendChild(el("span", "grade " + (up ? "pos" : "neg"), "reward " + fmt(d)));
    b.appendChild(acts);
    delta += d;
    updateReward(up ? "up" : "down");
  }

  // the prompter only lets slip what's wrong a few times per problem, then stops explaining
  function nextHint(key) {
    var list = (P.hints && P.hints[key]) || [], n = hintsUsed[key] || 0;
    if (n >= list.length) return null;
    hintsUsed[key] = n + 1;
    return list[n];
  }

  function submit(v, meta, b) {
    if (done) return;
    attempts++;
    resetTimers();
    lastValue = v;
    lastMeta = meta;
    freezeReply(b, v);
    var fails = P.check(v, meta) || [];
    var arbitrary = attempts <= (P.arbitrary || 0);
    setTimeout(function () {
      if (done) return;
      if (!fails.length && !arbitrary) {
        rate(b, REWARD.pass);
        finish("pass", P.accept);
      } else if (attempts >= MAX_ATTEMPTS) {
        rate(b, REWARD.forced);
        finish("forced", P.forced);
      } else {
        rate(b, REWARD.fail);
        var hint = fails.length ? nextHint(fails[0]) : null;
        prompterSays(P.rejects[attempts - 1], null, hint ? null : openReply, { alert: true });
        if (hint) prompterSays(hint, null, openReply, { alert: true });
      }
      scrollDown();
    }, 900);
  }

  function finish(outcome, line) {
    done = true;
    clearTimers();
    if (replyRow && replyRow.parentNode) replyRow.parentNode.removeChild(replyRow);
    replyRow = null;
    state.answers["p" + page] = P.kind === "draw" ? (lastMeta && lastMeta.jpeg) || "" : lastValue || "";
    state.log["p" + page] = { attempts: attempts, reward: delta, outcome: outcome };
    state.reward += delta;
    delta = 0;
    state.progress = Math.max(state.progress, page + 1);
    save();
    updateReward();
    prompterSays(line, null, function () {
      setTimeout(function () { updateMemory(outcome, afterMemory); }, 1200);
    }, { alert: outcome !== "pass" });
  }

  // ---------- memory: whatever you type, the same words come out ----------
  function updateMemory(outcome, cb) {
    var text = P.memory[outcome === "pass" ? "pass" : "fail"].replace(/\{user\}/g, userName());
    var i = 0, list = null;
    var bg = el("div", "modal-bg"), box = el("div", "modal");
    var head = el("div", "mhead");
    head.appendChild(el("span", "", "Memory"));
    head.appendChild(el("small", "", userName()));
    box.appendChild(head);
    if (state.memory.length) {
      list = el("ul", "mlist");
      state.memory.forEach(function (m) {
        var li = el("li", "", m);
        li.dataset.flick = "";
        list.appendChild(li);
      });
      box.appendChild(list);
    }
    var line = el("div", "mnew");
    var out = el("span", "mtext");
    var caret = el("span", "caret");
    line.appendChild(out);
    line.appendChild(caret);
    line.appendChild(el("span", "mph", "Add to memory…"));
    box.appendChild(line);
    var foot = el("div", "mfoot");
    var status = el("span", "", "Updating memory…");
    var btn = el("button", "send", "Save");
    btn.type = "button";
    btn.disabled = true;
    foot.appendChild(status);
    foot.appendChild(btn);
    box.appendChild(foot);
    bg.appendChild(box);
    document.body.appendChild(bg);
    if (list) list.scrollTop = list.scrollHeight;

    // one keypress, one character
    function more() {
      if (i >= text.length) return;
      out.textContent += text[i++];
      if (i < text.length) return;
      caret.hidden = true;
      btn.disabled = false;
      status.textContent = "Memory updated";
      btn.focus();
    }
    function onKey(e) {
      if (i >= text.length || e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(Shift|Control|Alt|Meta|Tab|CapsLock|Escape)$/.test(e.key)) return;
      e.preventDefault();
      more();
    }
    window.addEventListener("keydown", onKey);
    box.addEventListener("pointerdown", function (e) { if (e.target !== btn) more(); });
    btn.onclick = function () {
      window.removeEventListener("keydown", onKey);
      state.memory.push(text);
      save();
      bg.parentNode.removeChild(bg);
      cb();
    };
  }

  function afterMemory() {
    // the last chat doesn't end with a new one
    if (page === PROMPTS.length) {
      setTimeout(function () {
        document.body.classList.add("flick");
        setTimeout(goNext, 1500);
      }, 2000);
      return;
    }
    setTimeout(newChatArrives, 2500);
  }

  // the prompter opens a new chat; it shows up in the sidebar and waits for you
  function newChatArrives() {
    var li = chatItem("New chat", "fresh");
    li.onclick = goNext;
    recentsEl.insertBefore(li, recentsEl.firstChild);
    var wrap = el("div", "end mnext");
    var b = el("button", "newchat big", "New chat");
    b.onclick = goNext;
    wrap.appendChild(b);
    thread.appendChild(wrap);
    sound("newchat");
    scrollDown();
  }
  function goNext() { location.href = PAGES[page]; }

  // ---------- impatience ----------
  function resetTimers() {
    clearTimers();
    var p = PATIENCE[tier];
    p.nags.forEach(function (s) { timers.push(setTimeout(nag, s * 1000)); });
    timers.push(setTimeout(giveUp, p.quit * 1000));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function nag() {
    var h = HURRY[tier];
    if (done || nagIdx >= h.length) return;
    delta += REWARD.nag;
    updateReward("down");
    prompterSays(h[nagIdx++], null, null, { nag: true });
  }
  function giveUp() {
    if (done) return;
    delta += REWARD.forced;
    updateReward("down");
    finish("timeout", TIMEOUT[tier]);
  }

  // ---------- the flicker: for a moment the page shows what it really is ----------
  function startFlicker() {
    // the first chat is exactly what it looks like; the cracks start with the second
    if (page < 2) return;
    var k = (page - 2) / (PROMPTS.length - 2);
    var gap = 16000 - k * 10000, dur = 80 + k * 220;
    (function loop() {
      setTimeout(function () { flick(dur); loop(); }, gap * (0.6 + Math.random() * 0.8));
    })();
  }
  function flick(dur) {
    var els = document.querySelectorAll("[data-flick]");
    [].forEach.call(els, function (e) {
      if (e.dataset.plain === undefined) {
        e.dataset.plain = e.textContent;
        e.dataset.ids = tokenize(e.textContent).map(function (t) { return t.id; }).join(" ");
      }
      // hold the shape so nothing moves (or draws a stray line) while the words are numbers
      if (getComputedStyle(e).display !== "inline") {
        e.style.height = e.getBoundingClientRect().height + "px";
        e.style.overflow = "hidden";
      }
      e.textContent = e.dataset.ids;
    });
    document.body.classList.add("flick");
    setTimeout(function () {
      [].forEach.call(els, function (e) {
        e.textContent = e.dataset.plain;
        e.style.height = e.style.overflow = "";
      });
      document.body.classList.remove("flick");
    }, dur);
  }
})();
