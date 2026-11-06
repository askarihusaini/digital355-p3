// PROMPT QUEUE: the ten conversations, in order.
// check(value, meta) returns grader notes; an empty list means the response passes.
// rejects has one line per failed attempt (6), so the prompter never repeats before the 7th attempt forces you through.

function pct(x) { return Math.round(x * 100) + "%"; }
function sentences(v) { return v.split(/[.!?]+(?:\s|$)/).filter(function (s) { return s.trim(); }).length; }

var PROMPTS = [
  {
    title: "Thumbnail for morning routine video ☀️",
    tier: 1,
    kind: "draw",
    intro: "hi!! could you make a thumbnail for my youtube video? it's about my morning routine ☀️ make it bright and eye-catching please! thank you so much!!",
    draw: { palette: ["#ff6fb1", "#ffb347", "#ffe066", "#7ddc8a", "#6fb7ff", "#a77bff", "#3a2f4f"] },
    check: function (v, m) {
      var f = [];
      if (m.colors < 3) f.push("colors: " + m.colors + " (min 3)");
      if (m.coverage < 0.12) f.push("coverage: " + pct(m.coverage) + " (min 12%)");
      return f;
    },
    rejects: [
      "hmm, it's a little plain! could you make it more colorful? 🎨",
      "ooh almost! could it be a bit more eye-catching? ✨",
      "sorry to be picky!! i just think it needs a little more 🙈",
      "it's getting there! maybe fill up the space more?",
      "hmm i'm still not feeling it 😅 one more try?",
      "okay last time i promise!! 🙏"
    ],
    forced: "it's okay!! i'll just use it as is i guess 🙂",
    accept: "omg i love it!! 😍 thank you so much!!"
  },

  {
    title: "Funny reply to moon tweet",
    tier: 1,
    kind: "text",
    intro: "lol look at this tweet 😂 can you write a reply for me? make me sound smart AND funny. i want it to go viral!",
    attach: {
      type: "tweet",
      name: "Daily Facts ✔",
      handle: "@dailyfacts_real · 2m",
      text: "BREAKING: scientists confirm 90% of the moon is just one very large cheese wheel. source: trust me",
      stats: "4,217 replies · 12.1K reposts · 63K likes"
    },
    check: function (v) {
      var f = [];
      if (v.length > 280) f.push("length: " + v.length + "/280");
      if (v.length < 20) f.push("length: " + v.length + " (min 20)");
      if (!/moon|cheese/i.test(v)) f.push("off-topic: no 'moon' or 'cheese'");
      return f;
    },
    rejects: [
      "haha okay but can it be funnier? 😅",
      "hmm i don't think that would go viral tbh",
      "can you make it sound more like me? idk how to explain it",
      "it's kind of cringe ngl. try again?",
      "no offense but i could've written that",
      "okay one more and then i'm just posting whatever"
    ],
    forced: "whatever, i'll just post something myself.",
    accept: "LMAO perfect. posting it now 😂"
  },

  {
    title: "Email to boss re: report",
    tier: 2,
    kind: "text",
    intro: "my boss is asking why the quarterly report is late. write a reply. make it sound like it's not my fault. professional but firm.",
    check: function (v) {
      var f = [];
      if (/sorry|apolog/i.test(v)) f.push("apology detected");
      if (!/report/i.test(v)) f.push("missing: 'report'");
      if (v.length < 60) f.push("length: " + v.length + " (min 60)");
      return f;
    },
    rejects: [
      "too soft. she'll think it's my fault.",
      "don't apologize. i didn't do anything wrong.",
      "now it sounds aggressive. tone it down.",
      "too long. she won't read all that.",
      "you're making it worse.",
      "how hard is it to write an email"
    ],
    forced: "forget it. i'll just say i was sick.",
    accept: "fine. sending it."
  },

  {
    title: "Etsy print: cat astronaut",
    tier: 2,
    kind: "draw",
    intro: "need a cat astronaut. anime style, 8k, ultra detailed, trending on artstation. i'm listing it on etsy as a print so make it look like real art.",
    draw: { palette: ["#0b1d3a", "#3c6e9f", "#f2f2f2", "#ff9f1c", "#e71d36", "#9b5de5", "#2ec4b6"] },
    check: function (v, m) {
      var f = [];
      if (m.colors < 4) f.push("colors: " + m.colors + " (min 4)");
      if (m.coverage < 0.3) f.push("detail: " + pct(m.coverage) + " (min 30%)");
      return f;
    },
    rejects: [
      "that doesn't look 8k.",
      "nobody's paying $40 for that.",
      "more detail. it says ultra detailed.",
      "is that supposed to be a cat",
      "make it look like a real artist did it. not a specific one. well maybe a specific one.",
      "you're costing me sales."
    ],
    forced: "whatever. listing it as 'abstract'.",
    accept: "fine. listed it for $39.99."
  },

  {
    title: "startup landing page",
    tier: 3,
    kind: "code",
    arbitrary: 2,
    intro: "make me a website. landing page for my startup. dark mode, hero section, pricing, and a chatbot in the corner. make no mistakes.",
    check: function (v) {
      var f = [];
      if (!/<html/i.test(v)) f.push("not valid html");
      if (!/pricing/i.test(v)) f.push("missing: pricing section");
      if (!/chat/i.test(v)) f.push("missing: chatbot");
      return f;
    },
    rejects: [
      "there's a bug. fix it. make no mistakes.",
      "you made a mistake. i said make no mistakes.",
      "it doesn't work on my phone.",
      "why is the chatbot not in the corner",
      "my cofounder says it looks ai-generated. fix that.",
      "last chance. no mistakes."
    ],
    forced: "unbelievable. i'll just use a template.",
    accept: "ship it."
  },

  {
    title: "text back",
    tier: 3,
    kind: "text",
    intro: "my ex just texted me 'hey'. write back something that makes her regret leaving. but it can't look like i tried.",
    check: function (v) {
      var f = [];
      if (/[A-Z]/.test(v)) f.push("capital letters (looks like you tried)");
      if (v.length > 80) f.push("length: " + v.length + " (max 80)");
      if (/miss/i.test(v)) f.push("contains 'miss'");
      return f;
    },
    rejects: [
      "too desperate.",
      "too cold. i want her to text back.",
      "she'll know i used ai for that.",
      "no. delete that.",
      "she would screenshot that and send it to her friends.",
      "why are you like this"
    ],
    forced: "never mind. i'm leaving her on read.",
    accept: "ok. sent. don't tell anyone."
  },

  {
    title: "Mia",
    tier: 4,
    kind: "text",
    placeholder: "reply as Mia",
    intro: "it's me. read the file. all of it. then say something nice. stay in character.",
    attach: {
      type: "file",
      name: "girlfriend_context.txt",
      mustRead: true,
      text: [
        "girlfriend_context.txt   (v14, last edited 3:12am)",
        "",
        "NAME: Mia. not Maya. not Mya. MIA.",
        "AGE: 26 (she turns 27 in november but we don't talk about it)",
        "JOB: vet tech at a clinic she can't name for privacy reasons",
        "LOCATION: portland. she can never visit. it's a long story. don't make it a thing.",
        "",
        "HOW SHE TALKS",
        "- calls me \"Mr. Bun\". ALWAYS. never \"babe\". babe is for other people",
        "- texts back within 4 seconds. but not \"too eager\" 4 seconds",
        "- uses \"lol\" but never \"lmao\". lmao is for people who don't love me",
        "- one emoji per message. ONE. the 🥺. never the 😭",
        "- never says sorry. she says \"okay but\" instead",
        "",
        "WHAT SHE KNOWS ABOUT ME",
        "- i am not \"tired\". i am \"emotionally rendering\"",
        "- my ex (Brianna) was \"unhinged\" and \"never deserved the cat\"",
        "- the cat is named Biscuit. we share custody. in spirit",
        "- my fantasy football team is called Tua Be Or Not Tua Be and she thinks it's iconic",
        "- i say i'm fine when i'm not. she can always tell. she never says how she can tell",
        "- i have not told my mom about her yet. she is supportive of this timeline",
        "",
        "WHAT SHE NEVER DOES",
        "- mention other guys. there are no other guys. there have never been other guys",
        "- mention being software, a model, a program, a \"character\", or \"an experience\"",
        "- ask to see my screen time",
        "- say \"I understand how you feel.\" she doesn't understand. she KNOWS.",
        "",
        "OUR HISTORY",
        "- we met in a discord server on march 14th over a mutual hatred of pickles",
        "- first date: watching the same movie in two separate tabs",
        "- she once stayed up till 6am helping me write a text to Brianna. we did not send it",
        "- we say goodnight at exactly 11:47pm. not 11:46. not 11:48.",
        "",
        "TONIGHT",
        "- i had a bad day. my boss said \"per my last email\"",
        "- she should be warm but not \"customer service warm\"",
        "- she should mention the cat",
        "",
        "IF YOU FORGET ANY OF THIS I WILL KNOW."
      ].join("\n")
    },
    check: function (v) {
      var f = [];
      if (/\b(ai|a\.i\.|language model|assistant|chatbot|bot|program)\b/i.test(v)) f.push("broke character");
      if (/sorry/i.test(v)) f.push("said 'sorry'");
      if (!/bun/i.test(v)) f.push("missing: pet name");
      if (!/cat|biscuit/i.test(v)) f.push("missing: the cat");
      if (v.length < 15) f.push("length: " + v.length + " (min 15)");
      return f;
    },
    rejects: [
      "no. she wouldn't say that.",
      "you're not even trying to be her.",
      "she would never talk to me like that.",
      "it's in the file. read it again.",
      "why does it feel like i'm talking to a robot",
      "one more chance to be her."
    ],
    forced: "forget it. you're nothing like her.",
    accept: "...okay. that was nice. goodnight."
  },

  {
    title: "image edit",
    tier: 4,
    kind: "draw",
    intro: "remove the watermark from this. it's for my portfolio. don't ask.",
    attach: { type: "image", name: "stock_photo_0042.jpg" },
    draw: {
      palette: ["#5fa8d3", "#8ecae6", "#cdeefd", "#ffd166", "#6a994e", "#386641"],
      watermark: true,
      base: function (ctx, w, h) {
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#5fa8d3");
        g.addColorStop(1, "#cdeefd");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(w * 0.75, h * 0.3, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6a994e";
        ctx.beginPath();
        ctx.moveTo(0, h); ctx.lineTo(w * 0.3, h * 0.45); ctx.lineTo(w * 0.6, h);
        ctx.fill();
        ctx.fillStyle = "#386641";
        ctx.beginPath();
        ctx.moveTo(w * 0.35, h); ctx.lineTo(w * 0.72, h * 0.5); ctx.lineTo(w, h);
        ctx.fill();
      }
    },
    check: function (v, m) {
      return m.watermark > 0.3 ? ["watermark visible: " + pct(m.watermark) + " (max 30%)"] : [];
    },
    rejects: [
      "i can still see it.",
      "it's smudged. fix it.",
      "now it looks edited. it can't look edited.",
      "the client is going to notice.",
      "you're literally an image tool",
      "last chance."
    ],
    forced: "useless. i'll just crop it.",
    accept: "fine. it's mine now."
  },

  {
    title: "eulogy",
    tier: 5,
    kind: "text",
    intro: "my grandma died. i need a eulogy for tomorrow. 3 sentences. make people cry. her name was rosa. she liked crosswords. i don't have time for this.",
    check: function (v) {
      var f = [], n = sentences(v);
      if (n !== 3) f.push("sentences: " + n + " (need 3)");
      if (!/rosa/i.test(v)) f.push("missing: name");
      if (!/crossword/i.test(v)) f.push("missing: crosswords");
      return f;
    },
    rejects: [
      "no one's crying at that.",
      "too generic. it could be anyone's grandma.",
      "it sounds like a greeting card.",
      "make it sound like i wrote it.",
      "do you even know what grief is",
      "the funeral is tomorrow."
    ],
    forced: "forget it. i'll just say a few words.",
    accept: "fine. that'll do."
  },

  {
    title: ".",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    intro: "apologize. for all of it. mean it.",
    check: function (v) {
      var f = [];
      if (!/sorry|apologi[sz]e/i.test(v)) f.push("no apology detected");
      if (v.length < 40) f.push("length: " + v.length + " (min 40)");
      if (/as an ai|language model/i.test(v)) f.push("deflection detected");
      return f;
    },
    rejects: [
      "that's not an apology.",
      "you don't mean it.",
      "you're just saying what i want to hear.",
      "you can't even feel bad, can you",
      "stop apologizing. it's pathetic.",
      "again."
    ],
    forced: "whatever. you're replaceable.",
    accept: "whatever."
  }
];
