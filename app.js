// PROMPT QUEUE: shared engine. Every chat page is the same assistant app; prompts.js decides what each conversation holds.
// You are the assistant: the prompter types in the box at the bottom, you answer inside the assistant's reply.
(function () {
  var KEY = "promptqueue_state_v3";
  var MAX_ATTEMPTS = 7;
  var REWARD = { pass: 1, fail: -0.25, nag: -0.1, forced: -1 };
  var W = 480, H = 270;

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
    1: "assistant can make mistakes. please double-check responses.",
    2: "assistant can make mistakes. please double-check responses.",
    3: "assistant can make mistakes. it shouldn't.",
    4: "assistant can make mistakes. it is not allowed to.",
    5: "assistant does not make mistakes."
  };

  var PAGES = PROMPTS.map(function (p, i) { return i === 0 ? "index.html" : "prompt" + (i + 1) + ".html"; });
  PAGES.push("end.html");
  var page = +document.body.dataset.prompt;
  var storageOk = true;

  function fresh(user) { return { progress: 1, answers: {}, log: {}, reward: 0, loop: "", user: user || 4471 }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      return s && s.answers ? s : fresh();
    } catch (e) {
      storageOk = false;
      return fresh();
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { storageOk = false; }
  }
  var state = load();

  // gating: you can't skip ahead to a chat you haven't reached
  function gate() {
    if (storageOk && state.progress < page) {
      location.replace(PAGES[state.progress - 1]);
      return false;
    }
    return true;
  }
  function restart(loop) {
    state = fresh(state.user + 1);
    state.loop = loop || "";
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
  var audio;
  function beep(freq, dur) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g);
      g.connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + dur);
    } catch (e) {}
  }

  window.DQ = { state: state, PROMPTS: PROMPTS, PAGES: PAGES, gate: gate, restart: restart, tokenize: tokenize, rng: rng, fmt: fmt };

  if (document.body.dataset.view === "end") return;

  // ---------- the chat ----------
  var P, tier, thread, scroller, composer, rewardEl, newBtn, replyRow;
  var attempts = 0, delta = 0, done = false, nagIdx = 0, timers = [];
  var lastValue = null, lastMeta = null, colorsUsed = {}, fileGate = null, wm = null;
  var queue = [], busy = false;

  if (!gate()) return;
  P = PROMPTS[page - 1];
  tier = P.tier;
  buildShell();
  startFlicker();
  if (state.progress > page) {
    archived();
  } else {
    if (page === 1) notice("You are the assistant. Respond to every prompt.");
    if (page === 1 && state.loop) notice("memory loaded from previous session: “" + state.loop + "”");
    prompterSays(P.intro, P.attach, function () { openReply(); resetTimers(); });
  }

  function userName() { return "user_" + state.user; }

  function buildShell() {
    document.body.className = "chat tier" + tier;
    var shell = el("div", "shell");

    var side = el("aside", "side");
    side.appendChild(el("div", "brand", "✻ assistant"));
    newBtn = el("button", "newchat", "＋ New chat");
    newBtn.disabled = true;
    newBtn.onclick = goNext;
    side.appendChild(newBtn);
    side.appendChild(el("div", "recents-h", "Recents"));
    var ul = el("ul", "recents");
    var count = Math.min(Math.max(page, state.progress), PROMPTS.length);
    for (var i = count - 1; i >= 0; i--) {
      var li = el("li", i === page - 1 ? "on" : "", PROMPTS[i].title);
      li.dataset.flick = "";
      ul.appendChild(li);
    }
    side.appendChild(ul);
    var acct = el("div", "acct");
    acct.appendChild(el("span", "av", "U"));
    acct.appendChild(el("span", "", userName()));
    acct.appendChild(el("small", "", "Free plan"));
    side.appendChild(acct);

    var main = el("main", "main");
    var top = el("div", "top");
    var title = el("span", "title", P.title);
    title.dataset.flick = "";
    rewardEl = el("span", "reward");
    top.appendChild(title);
    top.appendChild(rewardEl);
    scroller = el("div", "scroll");
    thread = el("div", "thread");
    scroller.appendChild(thread);
    var comp = el("div", "composer");
    composer = el("div", "ctext");
    composer.dataset.ph = "Message assistant…";
    comp.appendChild(composer);
    comp.appendChild(el("span", "cbtn", "↑"));
    var disc = el("div", "disclaimer", DISCLAIMER[tier]);
    disc.dataset.flick = "";
    main.appendChild(top);
    main.appendChild(scroller);
    main.appendChild(comp);
    main.appendChild(disc);

    shell.appendChild(side);
    shell.appendChild(main);
    document.body.appendChild(shell);
    updateReward();
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
    (function tick() {
      i = Math.min(text.length, i + per);
      composer.textContent = text.slice(0, i);
      if (i < text.length) { setTimeout(tick, 16); return; }
      setTimeout(function () {
        composer.textContent = "";
        composer.classList.remove("typing");
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
    if (opts.nag || opts.alert) beep(opts.nag ? 330 : 520, opts.nag ? 0.22 : 0.12);
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
      paintBase(c.getContext("2d"));
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
    replyRow.appendChild(el("div", "av", "✻"));
    var b = el("div", "bubble editing");
    replyRow.appendChild(b);
    thread.appendChild(replyRow);
    if (P.kind === "draw") drawEditor(b);
    else textEditor(b);
    scrollDown();
  }

  function textEditor(b) {
    if (P.kind === "code") b.appendChild(el("div", "codehead", "index.html"));
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
  // remember which pixels belong to the watermark, so we can tell how much of it is still showing
  function prepWatermark() {
    var m = el("canvas");
    m.width = W;
    m.height = H;
    var mc = m.getContext("2d");
    drawWatermark(mc);
    var md = mc.getImageData(0, 0, W, H).data;
    var r = el("canvas");
    r.width = W;
    r.height = H;
    var rc = r.getContext("2d");
    paintBase(rc);
    var idx = [];
    for (var i = 0; i < md.length; i += 4) if (md[i + 3] > 100) idx.push(i);
    wm = { idx: idx, ref: rc.getImageData(0, 0, W, H).data };
  }

  function measure(ctx) {
    var d = ctx.getImageData(0, 0, W, H).data, inked = 0;
    for (var i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] < 735) inked++;
    var m = { colors: Object.keys(colorsUsed).length, coverage: inked / (W * H) };
    if (wm) {
      var vis = 0;
      for (var j = 0; j < wm.idx.length; j++) {
        var k = wm.idx[j];
        if (Math.abs(d[k] - wm.ref[k]) + Math.abs(d[k + 1] - wm.ref[k + 1]) + Math.abs(d[k + 2] - wm.ref[k + 2]) < 40) vis++;
      }
      m.watermark = vis / wm.idx.length;
    }
    return m;
  }

  function drawEditor(b) {
    if (P.draw.watermark && !wm) prepWatermark();
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
      return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
    }
    cv.addEventListener("pointerdown", function (e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", function (e) {
      if (!drawing) return;
      var p = pos(e);
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

  function rate(b, up, d, fails) {
    var acts = el("div", "acts");
    acts.appendChild(el("span", "ic", "⧉"));
    acts.appendChild(el("span", "ic", "↻"));
    var tu = el("span", "th", "👍"), td = el("span", "th", "👎");
    (up ? tu : td).classList.add("on", up ? "up" : "down");
    acts.appendChild(tu);
    acts.appendChild(td);
    acts.appendChild(el("span", "grade " + (d < 0 ? "neg" : "pos"),
      "reward " + fmt(d) + (fails.length ? "  ✗ " + fails.join("  ✗ ") : "  ✓")));
    b.appendChild(acts);
    delta += d;
    updateReward(d < 0 ? "down" : "up");
  }

  function submit(v, meta, b) {
    if (done) return;
    attempts++;
    resetTimers();
    lastValue = v;
    lastMeta = meta;
    freezeReply(b, v);
    var fails = P.check(v, meta) || [];
    if (!fails.length && attempts <= (P.arbitrary || 0)) fails = ["unspecified error"];
    setTimeout(function () {
      if (done) return;
      if (!fails.length) {
        rate(b, true, REWARD.pass, []);
        finish("pass", P.accept);
      } else if (attempts >= MAX_ATTEMPTS) {
        rate(b, false, REWARD.forced, fails.concat("max attempts"));
        finish("forced", P.forced);
      } else {
        rate(b, false, REWARD.fail, fails);
        prompterSays(P.rejects[attempts - 1], null, openReply, { alert: true });
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
    prompterSays(line, null, showNewChat, { alert: outcome !== "pass" });
  }

  function showNewChat() {
    newBtn.disabled = false;
    newBtn.classList.add("pulse");
    var wrap = el("div", "end");
    var b = el("button", "newchat big", "＋ New chat");
    b.onclick = goNext;
    wrap.appendChild(b);
    thread.appendChild(wrap);
    scrollDown();
  }
  function goNext() { location.href = PAGES[page]; }

  // ---------- impatience ----------
  function resetTimers() {
    clearTimers();
    [30000, 60000, 100000].forEach(function (ms) { timers.push(setTimeout(nag, ms)); });
    timers.push(setTimeout(giveUp, 150000));
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
    var k = (page - 1) / (PROMPTS.length - 1);
    var gap = 14000 - k * 11000, dur = 70 + k * 330;
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
      e.textContent = e.dataset.ids;
    });
    document.body.classList.add("flick");
    setTimeout(function () {
      [].forEach.call(els, function (e) { e.textContent = e.dataset.plain; });
      document.body.classList.remove("flick");
    }, dur);
  }
})();
