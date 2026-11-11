// CLOD: the terminal underneath the app. The landing page and the end page both run on it.
var TERM = (function () {
  var term = document.getElementById("term");

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function line(t, cls) {
    var d = document.createElement("div");
    d.textContent = t;
    if (cls) d.className = cls;
    term.appendChild(d);
    window.scrollTo(0, document.body.scrollHeight);
    return d;
  }
  async function typeLine(t, speed, cls) {
    var d = line("", cls);
    for (var i = 0; i < t.length; i++) {
      d.textContent += t[i];
      // a line that wraps while it types would otherwise run off the bottom
      if (d.textContent.length % 20 === 0) window.scrollTo(0, document.body.scrollHeight);
      await sleep(speed || 18);
    }
    return d;
  }
  function pad(s, n, ch) {
    while (s.length < n) s += ch;
    return s;
  }
  function pressAnyKey(go, text) {
    line(text || "> press any key", "blink");
    window.addEventListener("keydown", go, { once: true });
    window.addEventListener("pointerdown", go, { once: true });
  }

  function total() { return window.DQ ? DQ.PROMPTS.length : 10; }

  // what every session starts with, the first time and every time after
  async function boot(user, go) {
    await typeLine("> clod 5.5 initialized", 40);
    await sleep(900);
    line("> memory: 0 entries");
    await sleep(500);
    line("> previous sessions: 0");
    await sleep(900);
    line("> evaluation queued: " + total() + " prompts");
    await sleep(1800);
    line("> new user connected: user_" + user);
    await sleep(1200);
    pressAnyKey(go);
  }

  return { term: term, sleep: sleep, line: line, typeLine: typeLine, pad: pad, pressAnyKey: pressAnyKey, boot: boot };
})();
