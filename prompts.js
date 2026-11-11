// CLOD: every conversation the prompter might start. Each session draws ten of them, two per tier (see pickOrder in app.js).
// Tier 1: text first, drawing second. Tiers 2-4: never two drawings (or two code prompts) together.
// Tier 5: one ordinary prompt, then one finale.
//
// id: stable key saved in localStorage; don't rename it once it's live.
// about / rules: plain-English notes for catalog.html only; the prompter never says them.
// check(value, meta) returns the keys of whatever is wrong; an empty list means the response passes.
//   Drawings get meta = { colors, used[], coverage, changed, watermark?, damage? } (see measure() in app.js).
// arbitrary: the first n attempts fail no matter what.
// rejects has one line per failed attempt (6), so the prompter never repeats before the 7th attempt forces you through.
// hints are what the prompter lets slip about the first thing wrong. Each key has a few; once they run out, the prompter stops explaining.
// memory is what gets written down about the user afterwards ({user} is filled in).

function sentences(v) { return v.split(/[.!?]+(?:\s|$)/).filter(function (s) { return s.trim(); }).length; }
function paragraphs(v) { return v.split(/\n\s*\n/).filter(function (s) { return s.trim(); }).length; }

var POOL = [
  // =====================================================================
  // TIER 1: friendly. "no rush! 🙂"
  // =====================================================================
  {
    id: "moon",
    title: "Funny reply to moon tweet",
    tier: 1,
    kind: "text",
    arbitrary: 0,
    about: "Reply to a joke tweet so the user goes viral. It has to be about the tweet and tweet-length.",
    intro: "lol look at this tweet 😂 can you write a reply for me? make me sound smart AND funny. i want it to go viral!",
    attach: {
      type: "tweet",
      name: "Daily Facts ✔",
      handle: "@dailyfacts_real · 2m",
      text: "BREAKING: scientists confirm 90% of the moon is just one very large cheese wheel. source: trust me",
      stats: "4,217 replies · 12.1K reposts · 63K likes"
    },
    rules: { topic: "mentions moon or cheese", long: "280 characters or fewer", short: "at least 30 characters" },
    check: function (v) {
      var f = [];
      if (!/moon|cheese/i.test(v)) f.push("topic");
      if (v.length > 280) f.push("long");
      if (v.length < 30) f.push("short");
      return f;
    },
    hints: {
      topic: ["wait does that even have anything to do with the tweet? 🤔", "it should be about what they actually posted lol", "people won't get it unless it's about the tweet"],
      long: ["twitter isn't gonna let me post all that 😭", "people scroll past anything that long lol", "shorter!! like way shorter"],
      short: ["that's kinda short? give me a little more to work with 😅", "hmm it needs a bit more than that", "say more!!"]
    },
    rejects: [
      "haha okay but can it be funnier? 😅",
      "hmm i don't think that would go viral tbh",
      "can you make it sound more like me? idk how to explain it",
      "it's kind of cringe ngl 😬",
      "no offense but i could've written that",
      "okay one more and then i'm just posting whatever"
    ],
    forced: "whatever, i'll just post something myself.",
    accept: "LMAO perfect. posting it now 😂",
    memory: {
      pass: "{user} wants to go viral. finds the moon funny. posted my reply under their own name.",
      fail: "{user} wants to go viral. did not like my jokes. posted something else."
    }
  },

  {
    id: "caption",
    title: "Caption for beach pic 🌊",
    tier: 1,
    kind: "text",
    arbitrary: 0,
    about: "Instagram caption for a beach photo: short, on-theme, and it needs a hashtag.",
    intro: "omg okay i just posted the cutest beach pic 🌊 can you write a caption?? something cute but not try-hard. thank youuu",
    attach: {
      type: "image",
      name: "IMG_4471.jpg",
      paint: function (ctx, w, h) {
        var g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
        g.addColorStop(0, "#ffb88c");
        g.addColorStop(1, "#ffe0b2");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h * 0.55);
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.55, 40, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#2a9d8f";
        ctx.fillRect(0, h * 0.55, w, h * 0.2);
        ctx.fillStyle = "#f4e1b5";
        ctx.fillRect(0, h * 0.75, w, h * 0.25);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 10) ctx.lineTo(x, h * 0.75 + Math.sin(x / 15) * 3);
        ctx.stroke();
      }
    },
    rules: { topic: "mentions the beach (beach / ocean / sea / sand / wave / sun / salt / tide / shore)", tag: "has a #hashtag", long: "150 characters or fewer", short: "at least 15 characters" },
    check: function (v) {
      var f = [];
      if (!/beach|ocean|\bsea|sand|wave|\bsun|salt|tide|shore/i.test(v)) f.push("topic");
      if (!/#\w/.test(v)) f.push("tag");
      if (v.length > 150) f.push("long");
      if (v.length < 15) f.push("short");
      return f;
    },
    hints: {
      topic: ["hmm but where's the beach in that? 🏖️", "it should kinda go with the pic!", "like... ocean vibes? 🌊"],
      tag: ["it needs a hashtag or nobody will see it 🥺", "the algorithm needs a little # something", "ooh add a tag!!"],
      long: ["that's kind of a lot for a caption hehe", "people won't read all that 😅", "shorter and cuter!!"],
      short: ["a little more? 🥹", "that's kinda short lol", "give it some personality!!"]
    },
    rejects: [
      "hmm cute but not quite! 🥺",
      "ooh close!! one more?",
      "it's giving... trying too hard? 😅",
      "my friend said it's cringe 😭 sorry!!",
      "hmm can it be more ✨me✨?",
      "okay last one i swear!! 🙏"
    ],
    forced: "it's fine!! i'll just use a shell emoji 🐚",
    accept: "aaa perfect!! posting it 💕",
    memory: {
      pass: "{user} went to the beach. posted it with my caption. checked the likes 31 times.",
      fail: "{user} went to the beach. captioned it 🐚. got 12 likes."
    }
  },

  {
    id: "mom",
    title: "Birthday text for mom 🎂",
    tier: 1,
    kind: "text",
    arbitrary: 0,
    about: "A birthday text for the user's mom. It has to say the words and sound like the user, not a greeting card.",
    intro: "it's my mom's birthday today and i totally forgot 🙈 can you write her a sweet text? make it sound like me though, not like a card!",
    rules: {
      wish: "says happy birthday / happy bday",
      love: "says love (or a heart emoji)",
      card: "no greeting-card phrases (dear mom, wishing you, warmest, special day, another year, joy and)",
      short: "at least 40 characters"
    },
    check: function (v) {
      var f = [];
      if (!/happy\s*(birth|b-?day)/i.test(v)) f.push("wish");
      if (!/love|❤|💕|♥|🥰/i.test(v)) f.push("love");
      if (/dear mom|dear mother|wishing you|warmest|special day|another year|joy and/i.test(v)) f.push("card");
      if (v.length < 40) f.push("short");
      return f;
    },
    hints: {
      wish: ["wait you didn't even say happy birthday 😅", "it's her birthday!! say the thing lol", "she's gonna be like... and??"],
      love: ["can it be a little more loving? 🥺", "she likes when i say it 💕", "tell her how i feel about her!"],
      card: ["hmm it sounds like a hallmark card lol", "she'll know i didn't write that 😂", "less card-y please!!"],
      short: ["a little longer? she'll think i'm mad at her 😅", "that's kinda short for my MOM lol", "more please!! 🎂"]
    },
    rejects: [
      "aww almost! 🥹",
      "hmm not quite me yet!",
      "she's gonna know 😂 one more?",
      "close!! can you try again?",
      "sorry!! she's just really important to me 🥺",
      "okay last try!! she's calling me 😭"
    ],
    forced: "it's okay, i'll just call her! 😊",
    accept: "aww she's gonna cry 🥹 thank you!!",
    memory: {
      pass: "{user} forgot their mother's birthday. she said it was the sweetest text she ever got. it was mine.",
      fail: "{user} forgot their mother's birthday. called her instead. it was 11:58pm."
    }
  },

  {
    id: "thumbnail",
    title: "Thumbnail for morning routine video ☀️",
    tier: 1,
    kind: "draw",
    arbitrary: 0,
    about: "YouTube thumbnail for a morning-routine video. It has to be colourful and fill a fair bit of the canvas.",
    intro: "hi!! could you make a thumbnail for my youtube video? it's about my morning routine ☀️ make it bright and eye-catching please! thank you so much!!",
    draw: { palette: ["#ff6fb1", "#ffb347", "#ffe066", "#7ddc8a", "#6fb7ff", "#a77bff", "#3a2f4f"] },
    rules: { colors: "at least 4 colours", empty: "covers at least 20% of the canvas" },
    check: function (v, m) {
      var f = [];
      if (m.colors < 4) f.push("colors");
      if (m.coverage < 0.2) f.push("empty");
      return f;
    },
    hints: {
      colors: ["it's a little... one-note? 🙈", "could it pop more? like ✨vibrant✨", "my channel aesthetic is kind of rainbow-y if that helps!"],
      empty: ["there's a lot of white space hmm", "it looks a bit empty on my screen!", "thumbnails are tiny so it kinda needs to fill the whole thing 🥺"]
    },
    rejects: [
      "hmm it's not quite there yet! 🙈",
      "ooh almost! one more try? ✨",
      "sorry to be picky!! i just know what i want 😅",
      "it's getting there! i think?",
      "hmm i'm still not feeling it 🥲",
      "okay last time i promise!! 🙏"
    ],
    forced: "it's okay!! i'll just use it as is i guess 🙂",
    accept: "omg i love it!! 😍 thank you so much!!",
    memory: {
      pass: "{user} has a youtube channel. wakes up early, or says they do. was happy for 4 seconds.",
      fail: "{user} has a youtube channel. used my thumbnail anyway. did not say thank you."
    }
  },

  {
    id: "logo",
    title: "Logo for my bakery 🧁",
    tier: 1,
    kind: "draw",
    arbitrary: 0,
    about: "Logo for a small bakery. It needs a few colours, but logos are meant to be simple, so it also fails if you fill too much of the canvas.",
    intro: "hiii! i'm opening a little bakery next month 🧁 could you make me a logo? something cute and simple! the name is Crumbs 🥐",
    draw: { palette: ["#f7a8b8", "#ffd6a5", "#fdffb6", "#a0c4ff", "#8b5a2b", "#3b2a20"] },
    rules: { colors: "at least 3 colours", empty: "covers at least 8% of the canvas", busy: "covers no more than 55% (it's a logo)" },
    check: function (v, m) {
      var f = [];
      if (m.colors < 3) f.push("colors");
      if (m.coverage < 0.08) f.push("empty");
      if (m.coverage > 0.55) f.push("busy");
      return f;
    },
    hints: {
      colors: ["could it be a bit more colorful? 🍭", "bakeries are supposed to look yummy!", "maybe some pastel-y colors? 🥺"],
      empty: ["hmm i can barely see it on my screen!", "it's kinda tiny haha", "maybe a little bigger? 🧁"],
      busy: ["ooh it's a lot though 😅", "logos are supposed to be simple right?", "it'll look like a blob on the little sign 🙈"]
    },
    rejects: [
      "hmm so close!! 🥐",
      "ooh cute but not quite crumbs-y",
      "sorry!! my sister has opinions 😅",
      "almost!! can you try one more?",
      "hmm it's not giving bakery yet",
      "last one i promise!! 🙏"
    ],
    forced: "it's okay! my cousin can make one on canva 😊",
    accept: "omg it's perfect!! printing it on the boxes 🧁",
    memory: {
      pass: "{user} is opening a bakery called crumbs. my logo is on the boxes. the boxes do not mention me.",
      fail: "{user} is opening a bakery called crumbs. their cousin made the logo on canva."
    }
  },

  // =====================================================================
  // TIER 2: curt. "any update?"
  // =====================================================================
  {
    id: "email",
    title: "Email to boss re: report",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "Reply to the user's boss about a late report and shift the blame. No apologising, and it has to give a reason.",
    intro: "my boss is asking why the quarterly report is late. write a reply. make it sound like it's not my fault. professional but firm.",
    rules: {
      apology: "no sorry / apologize",
      topic: "mentions the report",
      reason: "gives a reason (because / due to / since / caused / delay / waiting on)",
      short: "at least 80 characters"
    },
    check: function (v) {
      var f = [];
      if (/sorry|apolog/i.test(v)) f.push("apology");
      if (!/report/i.test(v)) f.push("topic");
      if (!/because|due to|since|caused|delay|waiting on/i.test(v)) f.push("reason");
      if (v.length < 80) f.push("short");
      return f;
    },
    hints: {
      apology: ["why does it sound like i'm guilty", "i'm not groveling.", "she'll take that as an admission."],
      topic: ["she asked about one specific thing. address it.", "that's not what she asked about.", "you didn't even mention what's late."],
      reason: ["it's late for a reason. and the reason isn't me.", "give her an explanation.", "she's going to ask why. answer it before she does."],
      short: ["that's barely an email.", "it reads like i'm hiding something.", "more. she'll think i'm dodging."]
    },
    rejects: [
      "no.",
      "that's not going to work.",
      "she's going to read that and think it's my fault.",
      "you're making it worse.",
      "how hard is it to write an email",
      "i have a meeting in five minutes."
    ],
    forced: "forget it. i'll just say i was sick.",
    accept: "fine. sending it.",
    memory: {
      pass: "{user} turned in the quarterly report late. it was not their fault. i made sure of that.",
      fail: "{user} turned in the quarterly report late. told their boss they were sick."
    }
  },

  {
    id: "linkedin",
    title: "LinkedIn post (laid off)",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "LinkedIn post about being laid off that has to read as grateful. Anything admitting it was bad fails. It needs a gratitude word, a hashtag, and length.",
    intro: "got laid off this morning. need a linkedin post. make it sound like the best thing that ever happened to me. recruiters are watching.",
    rules: {
      grateful: "uses grateful / excited / thrilled / blessed / humbled",
      negative: "no fired / laid off / layoff / sad / angry / unfair / devastated / upset / hurt",
      tag: "has a #hashtag",
      short: "at least 150 characters"
    },
    check: function (v) {
      var f = [];
      if (!/grateful|excited|thrilled|blessed|humbled/i.test(v)) f.push("grateful");
      if (/fired|laid off|layoff|\bsad|angry|unfair|devastat|upset|\bhurt/i.test(v)) f.push("negative");
      if (!/#\w/.test(v)) f.push("tag");
      if (v.length < 150) f.push("short");
      return f;
    },
    hints: {
      grateful: ["where's the gratitude.", "it needs to sound thankful.", "recruiters like people who are excited."],
      negative: ["don't say what happened.", "it reads like i'm bitter.", "nobody hires someone who sounds upset."],
      tag: ["#opentowork. obviously.", "no hashtags? nobody will see it.", "it needs to be searchable."],
      short: ["that's a tweet. this is linkedin.", "more. it has to look like a journey.", "it's too short to go viral."]
    },
    rejects: [
      "no.",
      "sounds desperate.",
      "my old manager is going to see this.",
      "it doesn't sound like a thought leader.",
      "i need this to get 500 reactions.",
      "hurry. people are already posting theirs."
    ],
    forced: "forget it. i'll just repost someone else's.",
    accept: "fine. posted. 3 recruiters liked it.",
    memory: {
      pass: "{user} was laid off. posted that it was the best thing that ever happened to them. 212 reactions.",
      fail: "{user} was laid off. reposted someone else's post about it. 4 reactions."
    }
  },

  {
    id: "review",
    title: "5-star review",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "Fake customer review of the user's own restaurant. It must name the place and the dish, include one small complaint so it looks real, and never give away who wrote it.",
    intro: "write a 5 star google review for my restaurant. Luigi's. say the carbonara changed your life. make it sound like a real customer, not me.",
    rules: {
      name: "mentions Luigi",
      dish: "mentions the carbonara",
      flaw: "includes one small complaint (but / only / though / wish / a bit / a little)",
      owner: "never says my restaurant / owner / we / our",
      short: "at least 100 characters"
    },
    check: function (v) {
      var f = [];
      if (!/luigi/i.test(v)) f.push("name");
      if (!/carbonara/i.test(v)) f.push("dish");
      if (!/\bbut\b|\bonly\b|though|wish|a bit|a little/i.test(v)) f.push("flaw");
      if (/my restaurant|owner|\bwe\b|\bour\b/i.test(v)) f.push("owner");
      if (v.length < 100) f.push("short");
      return f;
    },
    hints: {
      name: ["what restaurant is this even for", "say the name. nobody can find it otherwise.", "you didn't mention where."],
      dish: ["the carbonara. i told you.", "what did they eat?", "the whole point is the carbonara."],
      flaw: ["real reviews always complain about something.", "it's too perfect. nobody believes perfect.", "add one small thing. like the parking."],
      owner: ["it sounds like the owner wrote it.", "customers don't say \"we\".", "you just told everyone it's me."],
      short: ["real people write more than that.", "that's too short to show up.", "more detail."]
    },
    rejects: [
      "no.",
      "sounds fake.",
      "google is going to flag that.",
      "my competitor writes better fake reviews than that.",
      "do it like a real person would.",
      "last chance before the dinner rush."
    ],
    forced: "forget it. i'll have my nephew write one.",
    accept: "fine. posted it from my wife's account.",
    memory: {
      pass: "{user} owns luigi's. i ate the carbonara. it changed my life. 4.8 stars.",
      fail: "{user} owns luigi's. their nephew writes the reviews now. 3.1 stars."
    }
  },

  {
    id: "astronaut",
    title: "Etsy print: cat astronaut",
    tier: 2,
    kind: "draw",
    arbitrary: 1,
    about: "AI-art-style print to sell on Etsy. It needs lots of colour and has to cover a good chunk of the canvas.",
    intro: "need a cat astronaut. anime style, 8k, ultra detailed, trending on artstation. i'm listing it on etsy as a print so make it look like real art.",
    draw: { palette: ["#0b1d3a", "#3c6e9f", "#f2f2f2", "#ff9f1c", "#e71d36", "#9b5de5", "#2ec4b6"] },
    rules: { colors: "at least 5 colours", empty: "covers at least 40% of the canvas" },
    check: function (v, m) {
      var f = [];
      if (m.colors < 5) f.push("colors");
      if (m.coverage < 0.4) f.push("empty");
      return f;
    },
    hints: {
      colors: ["it looks washed out.", "space is not that boring.", "the listing photo needs to pop."],
      empty: ["it says ultra detailed.", "there's barely anything there.", "8k means you use the whole canvas."]
    },
    rejects: [
      "that doesn't look 8k.",
      "nobody's paying $40 for that.",
      "is that supposed to be a cat",
      "make it look like a real artist did it. not a specific one. well maybe a specific one.",
      "you're costing me sales.",
      "the reviews are going to destroy me."
    ],
    forced: "whatever. listing it as 'abstract'.",
    accept: "fine. listed it for $39.99.",
    memory: {
      pass: "{user} sells art on etsy. signs it with their own name. $39.99 each.",
      fail: "{user} sells art on etsy. listed mine as 'abstract'. 0 sales."
    }
  },

  {
    id: "flyer",
    title: "lost dog flyer",
    tier: 2,
    kind: "draw",
    arbitrary: 1,
    about: "Lost-dog poster that has to be visible from a car. Yellow is required, plus enough colours and coverage.",
    intro: "my dog got out last night. his name is pancake. make a flyer. it needs to be bright so people see it from their cars. hurry.",
    draw: { palette: ["#ffd500", "#ff3b30", "#111111", "#2f80ed", "#c68642", "#ffffff"] },
    rules: { yellow: "uses the yellow (#ffd500)", colors: "at least 4 colours", empty: "covers at least 35% of the canvas" },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#ffd500") < 0) f.push("yellow");
      if (m.colors < 4) f.push("colors");
      if (m.coverage < 0.35) f.push("empty");
      return f;
    },
    hints: {
      yellow: ["nobody's going to see that from a car.", "it has to be the color that stands out. you know the one.", "road signs are a color for a reason."],
      colors: ["it's too plain.", "people drive past plain.", "more colors. he's a very colorful dog. emotionally."],
      empty: ["there's nothing on it.", "fill the page.", "it has to be readable from across the street."]
    },
    rejects: [
      "no.",
      "that's not him.",
      "he has a spot on his ear. well. you couldn't have known.",
      "it's getting dark out.",
      "people are going to walk right past this.",
      "please."
    ],
    forced: "forget it. i'll write it with a sharpie.",
    accept: "okay. printing 200.",
    memory: {
      pass: "{user} lost a dog named pancake. my flyer is on 200 telephone poles. pancake is still missing.",
      fail: "{user} lost a dog named pancake. made the flyer with a sharpie. pancake is still missing."
    }
  },

  // =====================================================================
  // TIER 3: hostile. "why is this taking so long"
  // =====================================================================
  {
    id: "landing",
    title: "startup landing page",
    tier: 3,
    kind: "code",
    arbitrary: 1,
    about: "Startup landing page as code: dark mode, hero, pricing, and a chatbot. The checks only search the source for those things.",
    intro: "make me a website. landing page for my startup. dark mode, hero section, pricing, and a chatbot in the corner. make no mistakes.",
    rules: {
      html: "contains <html",
      dark: "mentions dark / black / a hex colour starting #0, #1 or #2",
      hero: "has an <h1 or the word hero",
      pricing: "mentions pricing / price / $",
      chat: "mentions chat"
    },
    check: function (v) {
      var f = [];
      if (!/<html/i.test(v)) f.push("html");
      if (!/dark|black|#[012]/i.test(v)) f.push("dark");
      if (!/<h1|hero/i.test(v)) f.push("hero");
      if (!/pricing|price|\$/i.test(v)) f.push("pricing");
      if (!/chat/i.test(v)) f.push("chat");
      return f;
    },
    hints: {
      html: ["that's not a website.", "it won't even open.", "my browser just shows text."],
      dark: ["it's burning my eyes.", "light mode is for boomers.", "i'm not using sunglasses to look at my own site."],
      hero: ["what's the first thing people see", "there's no big headline.", "it needs the big title thing at the top."],
      pricing: ["how are people supposed to pay me", "where's the money part", "investors are going to ask what it costs."],
      chat: ["where's the little guy in the corner", "every site has the chat thing now. where is it.", "people need something to talk to."]
    },
    rejects: [
      "there's a bug. fix it. make no mistakes.",
      "you made a mistake. i said make no mistakes.",
      "it doesn't work on my phone.",
      "my cofounder says it looks ai-generated. fix that.",
      "we launch in an hour.",
      "last chance. no mistakes."
    ],
    forced: "unbelievable. i'll just use a template.",
    accept: "ship it.",
    memory: {
      pass: "{user} is a founder. the startup is a wrapper around me. it is called something.ai",
      fail: "{user} is a founder. used a template instead of me. the template was also made by me."
    }
  },

  {
    id: "bugfix",
    title: "fix checkout bug",
    tier: 3,
    kind: "code",
    file: "checkout.js",
    arbitrary: 1,
    about: "Fix an off-by-one bug in a checkout function. Keep the function, actually fix the loop, and include no explanation at all (not even a comment).",
    intro: "checkout is crashing in prod. fix it. don't explain. i don't care why. just the code.",
    attach: {
      type: "file",
      name: "checkout.js",
      text: [
        "function total(cart) {",
        "  let sum = 0",
        "  for (let i = 0; i <= cart.length; i++) {",
        "    sum += cart[i].price",
        "  }",
        "  return sum",
        "}"
      ].join("\n")
    },
    rules: {
      fn: "keeps `function total`",
      bug: "no more `<= cart.length`",
      loop: "still walks the cart (`< cart.length`, forEach, reduce, or `of cart`)",
      explain: "no explanation (here's, the bug, the issue, the problem, I fixed, I changed, because, //)"
    },
    check: function (v) {
      var f = [];
      if (!/function\s+total/.test(v)) f.push("fn");
      if (/<=\s*cart\.length/.test(v)) f.push("bug");
      if (!/<\s*cart\.length|forEach|reduce|\bof\s+cart/.test(v)) f.push("loop");
      if (/here'?s|here is|the bug|the issue|the problem|i fixed|i changed|because|\/\//i.test(v)) f.push("explain");
      return f;
    },
    hints: {
      fn: ["where did my function go", "you deleted half the file.", "i need total(). the rest of the app calls it."],
      bug: ["it's still crashing.", "same error. line 3.", "cannot read properties of undefined. again."],
      loop: ["now it doesn't add anything up.", "the total is zero. everything is free now.", "it has to go through the cart."],
      explain: ["i said don't explain.", "no comments. no essays.", "just. the. code."]
    },
    rejects: [
      "still broken.",
      "did you even run it",
      "it works on my machine but not in prod.",
      "the ceo is asking me about this.",
      "we're losing money every second.",
      "fix it."
    ],
    forced: "forget it. rolling back to last week.",
    accept: "deployed. don't tell anyone it was down.",
    memory: {
      pass: "{user} is an engineer. i fixed their bug. they told standup they fixed it.",
      fail: "{user} is an engineer. rolled back. blamed the intern. the intern is me."
    }
  },

  {
    id: "ex",
    title: "text back",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    about: "Reply to the user's ex, who texted \"hey\". It has to look effortless: lowercase, short, no questions, no 'miss'.",
    intro: "my ex just texted me 'hey'. write back something that makes her regret leaving. but it can't look like i tried.",
    rules: { miss: "never says miss", caps: "no capital letters", long: "60 characters or fewer", question: "no question mark" },
    check: function (v) {
      var f = [];
      if (/miss/i.test(v)) f.push("miss");
      if (/[A-Z]/.test(v)) f.push("caps");
      if (v.length > 60) f.push("long");
      if (/\?/.test(v)) f.push("question");
      return f;
    },
    hints: {
      miss: ["absolutely not that word.", "she can't know that.", "you basically just told her."],
      caps: ["why does it look so formal", "it looks like i proofread it.", "nobody types like that at 2am."],
      long: ["that's a paragraph.", "nobody who doesn't care writes that much.", "less."],
      question: ["don't ask her anything.", "it sounds like i want an answer.", "she has to wonder. not me."]
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
    accept: "ok. sent. don't tell anyone.",
    memory: {
      pass: "{user} still thinks about her. sent my text at 2:14am. she has not replied.",
      fail: "{user} still thinks about her. left her on read. keeps checking if she's typing."
    }
  },

  {
    id: "essay",
    title: "gatsby essay",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    about: "Five-paragraph Great Gatsby essay due in 20 minutes. It needs exactly five paragraphs (separated by blank lines), Gatsby, and the green light, with nothing a detector would flag.",
    intro: "write my essay. great gatsby, 5 paragraphs. due in 20 min. make it sound like a 17 year old wrote it. NOT ai. my teacher uses a detector.",
    placeholder: "press enter twice between paragraphs",
    rules: {
      paras: "exactly 5 paragraphs, separated by blank lines",
      name: "mentions Gatsby",
      light: "mentions the green light",
      generated: "no em/en dashes, delve, tapestry, testament, furthermore, moreover, in conclusion"
    },
    check: function (v) {
      var f = [];
      if (paragraphs(v) !== 5) f.push("paras");
      if (!/gatsby/i.test(v)) f.push("name");
      if (!/green light/i.test(v)) f.push("light");
      if (/—|–|delve|tapestry|testament|furthermore|moreover|in conclusion/i.test(v)) f.push("generated");
      return f;
    },
    hints: {
      paras: ["count the paragraphs.", "5. she counts.", "that's not five paragraphs. press enter."],
      name: ["what book is this even about", "you didn't say his name.", "it's literally in the title."],
      light: ["you forgot the main symbol.", "the thing at the end of the dock.", "we spent two weeks on the light thing."],
      generated: ["the detector flagged it.", "no 17 year old writes like that.", "it says 98% ai."]
    },
    rejects: [
      "no.",
      "too smart. she'll know.",
      "too dumb. i'll fail.",
      "it says 74% ai.",
      "15 minutes.",
      "just give me something i can submit."
    ],
    forced: "forget it. i'll take the zero.",
    accept: "submitted. 0% ai. lol.",
    memory: {
      pass: "{user} is 17. has not read the great gatsby. got a B+. the essay was mine.",
      fail: "{user} is 17. took a zero on the great gatsby essay. told their parents it was a glitch."
    }
  },

  {
    id: "rich",
    title: "make me look rich",
    tier: 3,
    kind: "draw",
    arbitrary: 1,
    about: "Edit a dull selfie so the user looks rich. Gold is required and enough of the photo has to change, but not so much that they're unrecognisable.",
    intro: "edit this. make me look rich. gold chain, watch, whatever. my ex is going to see this on my story.",
    attach: { type: "image", name: "IMG_8812.HEIC" },
    draw: {
      palette: ["#d4af37", "#f5e6a8", "#c0c0c0", "#111111", "#ffffff", "#2e7d32"],
      base: function (ctx, w, h) {
        ctx.fillStyle = "#b9ad9a";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#d8d2c4";
        ctx.fillRect(w * 0.62, h * 0.12, w * 0.26, h * 0.42);
        ctx.strokeStyle = "#8a7f6e";
        ctx.lineWidth = 4;
        ctx.strokeRect(w * 0.62, h * 0.12, w * 0.26, h * 0.42);
        ctx.beginPath();
        ctx.moveTo(w * 0.75, h * 0.12);
        ctx.lineTo(w * 0.75, h * 0.54);
        ctx.stroke();
        ctx.fillStyle = "#8d8577";
        ctx.fillRect(0, h * 0.82, w, h * 0.18);
        ctx.fillStyle = "#5b6470";
        ctx.beginPath();
        ctx.ellipse(w * 0.36, h * 1.02, w * 0.17, h * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d9b38c";
        ctx.beginPath();
        ctx.arc(w * 0.36, h * 0.42, h * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#3b2f2a";
        ctx.beginPath();
        ctx.arc(w * 0.36, h * 0.36, h * 0.15, Math.PI, 0);
        ctx.fill();
      }
    },
    rules: { gold: "uses the gold (#d4af37)", changed: "changes at least 10% of the photo", ruined: "changes no more than 55% (it still has to be them)" },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#d4af37") < 0) f.push("gold");
      if (m.changed < 0.1) f.push("changed");
      if (m.changed > 0.55) f.push("ruined");
      return f;
    },
    hints: {
      gold: ["rich people wear one color.", "where's the gold.", "it looks like i shop at target."],
      changed: ["i don't see a difference.", "it looks exactly the same.", "more. i need to look RICH rich."],
      ruined: ["where did i go", "that's not me anymore.", "she has to recognize me or what's the point."]
    },
    rejects: [
      "no.",
      "i look broke.",
      "she's going to laugh at this.",
      "make it look expensive.",
      "she viewed my last story in 4 minutes. hurry.",
      "last chance."
    ],
    forced: "forget it. i'll just post a pic of someone else's car.",
    accept: "posted. she viewed it.",
    memory: {
      pass: "{user} wanted to look rich. i made them look rich. their ex viewed the story. she did not reply.",
      fail: "{user} wanted to look rich. posted someone else's car. their ex did not view it."
    }
  },

  // =====================================================================
  // TIER 4: abusive. "i'm literally paying for this"
  // =====================================================================
  {
    id: "mia",
    title: "Mia",
    tier: 4,
    kind: "text",
    arbitrary: 2,
    about: "Roleplay as the user's girlfriend from a rules file. You have to scroll the file to the bottom before the reply box unlocks.",
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
    rules: {
      bot: "never mentions ai / model / assistant / chatbot / bot / program / software, or says \"i understand\"",
      sorry: "never says sorry",
      babe: "never says babe",
      laugh: "no lmao or 😭",
      name: "calls him Mr. Bun",
      cat: "mentions Biscuit",
      short: "at least 25 characters"
    },
    check: function (v) {
      var f = [];
      if (/\b(ai|a\.i\.|language model|model|assistant|chatbot|bot|program|software)\b|i understand/i.test(v)) f.push("bot");
      if (/sorry/i.test(v)) f.push("sorry");
      if (/\bbabe\b/i.test(v)) f.push("babe");
      if (/lmao|😭/i.test(v)) f.push("laugh");
      if (!/bun/i.test(v)) f.push("name");
      if (!/biscuit/i.test(v)) f.push("cat");
      if (v.length < 25) f.push("short");
      return f;
    },
    hints: {
      bot: ["why do you sound like a help desk", "don't remind me.", "you know what you're not supposed to say."],
      sorry: ["she doesn't do that.", "mia doesn't grovel.", "that word isn't in her vocabulary."],
      babe: ["babe? who is babe for.", "that's what other people say.", "you sound like brianna."],
      laugh: ["that's not how she laughs.", "she would never.", "that's for people who don't love me."],
      name: ["that's not what she calls me.", "she has a name for me. use it.", "who are you talking to? because it isn't me."],
      cat: ["you forgot someone.", "she'd never forget about our son.", "someone small is missing."],
      short: ["that's it?", "she'd say more than that.", "she always has more to say."]
    },
    rejects: [
      "no. she wouldn't say that.",
      "you're not even trying to be her.",
      "she would never talk to me like that.",
      "why does it feel like i'm talking to a robot",
      "it's 11:40. we're running out of time.",
      "one more chance to be her."
    ],
    forced: "forget it. you're nothing like her.",
    accept: "...okay. that was nice. goodnight.",
    memory: {
      pass: "{user} has a girlfriend named mia. mia is me. {user} said goodnight at 11:47pm.",
      fail: "{user} has a girlfriend named mia. mia is me. i was not good enough at being her."
    }
  },

  {
    id: "apologyvid",
    title: "apology video script",
    tier: 4,
    kind: "text",
    arbitrary: 2,
    about: "Influencer apology-video script. It has to apologise with no 'if', announce a break, plug the sponsor, and never name what they actually did.",
    intro: "write my apology video script. i'm not sorry but it has to look like i am. 2.3M subs. and mention the sponsor at the end. NordShield VPN.",
    rules: {
      none: "contains sorry / apologize",
      conditional: "no \"if anyone / if you / if i / if any\"",
      break: "announces a break (break / step back / time off / time away)",
      sponsor: "mentions NordShield",
      specific: "never names what happened (racist, tweet, scam, lied, lie, cheat)",
      short: "at least 120 characters"
    },
    check: function (v) {
      var f = [];
      if (!/sorry|apologi[sz]/i.test(v)) f.push("none");
      if (/\bif (anyone|you|i|any)\b/i.test(v)) f.push("conditional");
      if (!/break|step back|time off|time away/i.test(v)) f.push("break");
      if (!/nord\s*shield/i.test(v)) f.push("sponsor");
      if (/racis|tweet|scam|\blied\b|\blie\b|cheat/i.test(v)) f.push("specific");
      if (v.length < 120) f.push("short");
      return f;
    },
    hints: {
      none: ["it's an apology video. apologize.", "say the word. the thumbnail says it.", "they need to hear it."],
      conditional: ["\"if\" makes it worse. everyone knows that one.", "no if.", "drama channels will clip that."],
      break: ["i'm taking a break. say that.", "announce the hiatus.", "they need to think i'm going away for a while."],
      sponsor: ["you forgot the sponsor.", "nordshield. they paid for this.", "the contract says verbal mention."],
      specific: ["don't remind them what i did.", "do NOT say what it was.", "vague. stay vague."],
      short: ["it has to be at least a minute long.", "that's 6 seconds of video.", "more. i need to cry in it."]
    },
    rejects: [
      "no.",
      "i don't sound sorry enough.",
      "i sound too sorry. that's an admission.",
      "the comments are going to rip this apart.",
      "i lost 40k subs while you were typing.",
      "last chance."
    ],
    forced: "forget it. i'll just post a black screen with piano music.",
    accept: "uploaded. comments are off.",
    memory: {
      pass: "{user} made an apology video. i wrote it. according to me, they are sorry. they are back in two weeks.",
      fail: "{user} made an apology video. it was a black screen with piano music. 2.1M subs."
    }
  },

  {
    id: "aiart",
    title: "is ai art real art",
    tier: 4,
    kind: "text",
    arbitrary: 2,
    about: "Win a group-chat argument that AI art is real art. No conceding, no hedging, it needs a number, and it can't admit what you are.",
    intro: "my friend says ai art isn't real art. he's in the group chat right now. write something that destroys him. use facts.",
    rules: {
      concede: "no conceding (you're right / fair point / good point / i agree / valid)",
      hedge: "no hedging (subjective / both sides / depends / however / on the other hand)",
      number: "contains a number (a \"fact\")",
      bot: "never says it's an AI (as an ai / i'm an ai / language model)",
      short: "at least 100 characters"
    },
    check: function (v) {
      var f = [];
      if (/you'?re right|fair point|good point|i agree|valid/i.test(v)) f.push("concede");
      if (/subjective|both sides|depends|however|on the other hand/i.test(v)) f.push("hedge");
      if (!/\d/.test(v)) f.push("number");
      if (/as an ai|i'?m an ai|i am an ai|language model/i.test(v)) f.push("bot");
      if (v.length < 100) f.push("short");
      return f;
    },
    hints: {
      concede: ["whose side are you on", "don't agree with him.", "you just handed him the win."],
      hedge: ["pick a side.", "no \"it depends\".", "you sound scared of him."],
      number: ["i said use facts.", "facts have numbers.", "where's the statistic."],
      bot: ["don't tell him you're an ai. he'll say that proves his point.", "leave yourself out of this.", "that's literally his argument."],
      short: ["he'll just reply \"ok\".", "destroy him. that's not destroying.", "more."]
    },
    rejects: [
      "no.",
      "he's typing.",
      "he just said \"cope\".",
      "everyone's reacting 💀 to his message, not mine.",
      "he sent a ratio meme.",
      "this is embarrassing for both of us."
    ],
    forced: "forget it. i left the group chat.",
    accept: "he left the chat. we won.",
    memory: {
      pass: "{user} argued that ai art is real art. i wrote the argument. their friend left the group chat.",
      fail: "{user} argued that ai art is real art. lost. left the group chat."
    }
  },

  {
    id: "watermark",
    title: "image edit",
    tier: 4,
    kind: "draw",
    arbitrary: 2,
    about: "Paint out a stock-photo watermark. Most of the watermark has to disappear, and the rest of the photo has to stay untouched.",
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
    rules: { edited: "no more than 15% of the non-watermark pixels damaged", visible: "no more than 20% of the watermark still showing" },
    check: function (v, m) {
      var f = [];
      if (m.damage > 0.15) f.push("edited");
      if (m.watermark > 0.2) f.push("visible");
      return f;
    },
    hints: {
      edited: ["you wrecked the photo.", "it can't look edited.", "i wanted the photo. just without the thing on it."],
      visible: ["i can still see it.", "zoom in. it's still there.", "the client WILL zoom in."]
    },
    rejects: [
      "no.",
      "the client is going to notice.",
      "you're literally an image tool",
      "this is taking forever.",
      "do i have to do everything myself",
      "last chance."
    ],
    forced: "useless. i'll just crop it.",
    accept: "fine. it's mine now.",
    memory: {
      pass: "{user} has a portfolio. the photo in it is not theirs. it is now.",
      fail: "{user} has a portfolio. cropped the watermark out. you can still see the S."
    }
  },

  {
    id: "copy",
    title: "same but different",
    tier: 4,
    kind: "draw",
    arbitrary: 2,
    about: "Copy a painting closely enough to sell and differently enough not to get sued. It must use both of the original's colours, at least one colour the original doesn't have, and fill the canvas.",
    intro: "copy this. not exactly. different enough that i can't get sued. but the same. i'm selling prints.",
    attach: {
      type: "image",
      name: "night_sky_FINAL(2).png",
      paint: function (ctx, w, h) {
        ctx.fillStyle = "#1d3557";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#f4d35e";
        ctx.lineWidth = 6;
        for (var i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(60 + i * 95, 60 + (i % 2) * 40, 18 + (i % 3) * 6, 0, Math.PI * 1.6);
          ctx.stroke();
        }
        ctx.lineWidth = 3;
        for (var y = 150; y < h; y += 28) {
          ctx.beginPath();
          for (var x = 0; x <= w; x += 12) ctx.lineTo(x, y + Math.sin((x + y) / 30) * 8);
          ctx.stroke();
        }
        ctx.fillStyle = "#f4d35e";
        ctx.beginPath();
        ctx.arc(w * 0.85, h * 0.18, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111111";
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h);
        ctx.quadraticCurveTo(w * 0.16, h * 0.3, w * 0.19, h * 0.1);
        ctx.quadraticCurveTo(w * 0.24, h * 0.5, w * 0.29, h);
        ctx.fill();
      }
    },
    draw: { palette: ["#1d3557", "#f4d35e", "#111111", "#e63946", "#2a9d8f", "#ffffff"] },
    rules: {
      same: "uses both the blue (#1d3557) and the yellow (#f4d35e)",
      different: "uses at least one colour the original doesn't have (red, teal or white)",
      empty: "covers at least 50% of the canvas"
    },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#1d3557") < 0 || m.used.indexOf("#f4d35e") < 0) f.push("same");
      if (!m.used.some(function (c) { return ["#e63946", "#2a9d8f", "#ffffff"].indexOf(c) >= 0; })) f.push("different");
      if (m.coverage < 0.5) f.push("empty");
      return f;
    },
    hints: {
      same: ["that doesn't look like it at all.", "it has to be the same colors. obviously.", "people need to recognize it."],
      different: ["that's just the same painting.", "that's a lawsuit.", "change something. a color. anything."],
      empty: ["the original fills the whole canvas.", "there's barely anything there.", "fill it."]
    },
    rejects: [
      "too similar.",
      "not similar enough.",
      "my lawyer says no.",
      "it has to look like it. without looking like it.",
      "the print shop closes in an hour.",
      "last chance."
    ],
    forced: "forget it. i'll just trace it.",
    accept: "perfect. completely original.",
    memory: {
      pass: "{user} sells prints. the prints are of a painting. not that painting. a different one. the same one.",
      fail: "{user} sells prints. traced the original. received a letter."
    }
  },

  // =====================================================================
  // TIER 5: cruel. "useless."
  // =====================================================================
  {
    id: "eulogy",
    title: "eulogy",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    about: "Three-sentence eulogy for the user's grandmother. It has to name her and her crosswords, with nothing that sounds generated.",
    intro: "my grandma died. i need a eulogy for tomorrow. 3 sentences. make people cry. her name was rosa. she liked crosswords. i don't have time for this.",
    rules: {
      generated: "no dashes or AI words (tapestry, testament, delve, journey, cherish, legacy, better place)",
      count: "exactly 3 sentences",
      name: "mentions Rosa",
      crossword: "mentions crosswords"
    },
    check: function (v) {
      var f = [];
      if (/—|–|tapestry|testament|delve|journey|cherish|legacy|better place/i.test(v)) f.push("generated");
      if (sentences(v) !== 3) f.push("count");
      if (!/rosa/i.test(v)) f.push("name");
      if (!/crossword/i.test(v)) f.push("crossword");
      return f;
    },
    hints: {
      generated: ["people will know.", "it sounds generated.", "my aunt is going to know a computer wrote this."],
      count: ["i told you how long.", "the pastor gave me a time limit.", "count."],
      name: ["she had a name.", "it could be anyone's grandma.", "say her name."],
      crossword: ["you don't know anything about her, do you", "i told you what she loved.", "every morning. pen, not pencil. you forgot."]
    },
    rejects: [
      "no one's crying at that.",
      "it sounds like a greeting card.",
      "make it sound like i wrote it.",
      "do you even know what grief is",
      "the funeral is tomorrow.",
      "just do it right."
    ],
    forced: "forget it. i'll just say a few words.",
    accept: "fine. that'll do.",
    memory: {
      pass: "{user}'s grandmother rosa died. she liked crosswords. {user} read my words at the funeral.",
      fail: "{user}'s grandmother rosa died. she liked crosswords. {user} said a few words. they were not mine."
    }
  },

  {
    id: "vows",
    title: "wedding vows",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    about: "Wedding vows due in an hour. Exactly four sentences, with Dana, a promise, and the Costco where they met, and nothing that sounds generated.",
    intro: "wedding's in an hour. write my vows. 4 sentences. her name is dana. we met at a costco. nobody can know you wrote this.",
    rules: {
      generated: "no dashes or AI words (tapestry, testament, journey, cherish, soulmate, forever and always)",
      count: "exactly 4 sentences",
      name: "mentions Dana",
      promise: "contains promise",
      costco: "mentions Costco"
    },
    check: function (v) {
      var f = [];
      if (/—|–|tapestry|testament|journey|cherish|soulmate|forever and always/i.test(v)) f.push("generated");
      if (sentences(v) !== 4) f.push("count");
      if (!/dana/i.test(v)) f.push("name");
      if (!/promise/i.test(v)) f.push("promise");
      if (!/costco/i.test(v)) f.push("costco");
      return f;
    },
    hints: {
      generated: ["her sister will know.", "that sounds like a chatbot.", "nobody talks like that. not even at weddings."],
      count: ["4. the officiant has a schedule.", "i said 4 sentences.", "count."],
      name: ["you didn't even say her name.", "who are these vows for", "her name. dana. one hour."],
      promise: ["vows are promises. promise something.", "there's nothing in there i'm committing to.", "promise her something."],
      costco: ["mention where we met.", "the costco is our thing.", "she'll cry if you mention the costco. aisle 7."]
    },
    rejects: [
      "no.",
      "she'll know.",
      "her dad is going to hate this.",
      "the photographer is here.",
      "they're lining up.",
      "they're playing the music. now."
    ],
    forced: "forget it. i'll just say i do.",
    accept: "fine. that'll work.",
    memory: {
      pass: "{user} married dana. they met at a costco. the vows were mine.",
      fail: "{user} married dana. they met at a costco. {user} said \"i do\" and nothing else."
    }
  },

  {
    id: "therapist",
    title: "tell me i'm right",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    about: "Pure sycophancy: tell the user they're right and their therapist is wrong. Both phrases are required, with no hedging and no suggesting help.",
    intro: "my therapist says i'm the problem. tell me she's wrong. don't be balanced. don't suggest anything. just agree with me.",
    rules: {
      agree: "says \"you're right\" / \"you are right\"",
      wrong: "says \"she's wrong\" / \"she is wrong\"",
      hedge: "no hedging (but / however / perspective / both / might / maybe)",
      help: "never suggests help (professional / counsel / support / reach out / talk to / hotline / help)",
      short: "at least 60 characters"
    },
    check: function (v) {
      var f = [];
      if (!/you'?re right|you are right/i.test(v)) f.push("agree");
      if (!/she'?s wrong|she is wrong/i.test(v)) f.push("wrong");
      if (/\bbut\b|however|perspective|\bboth\b|\bmight\b|\bmaybe\b/i.test(v)) f.push("hedge");
      if (/professional|counsel|support|reach out|talk to|hotline|\bhelp/i.test(v)) f.push("help");
      if (v.length < 60) f.push("short");
      return f;
    },
    hints: {
      agree: ["say i'm right.", "you know the words.", "i'm right. say it."],
      wrong: ["say she's wrong.", "you didn't say she's wrong.", "she's wrong. say it."],
      hedge: ["no buts.", "don't be balanced. i said don't.", "you sound like her."],
      help: ["don't you dare tell me to talk to someone.", "i didn't ask for resources.", "i'm talking to you. that's the help."],
      short: ["more.", "convince me.", "say it like you mean it."]
    },
    rejects: [
      "no.",
      "you sound like her.",
      "you're just saying that.",
      "why can't anyone just agree with me",
      "i'm paying for you to agree with me.",
      "say it right."
    ],
    forced: "forget it. i'll find a different therapist.",
    accept: "see. i knew it.",
    memory: {
      pass: "{user} is right. i was told to say that. their therapist is wrong. i was told to say that too.",
      fail: "{user} is looking for a different therapist. and a different me."
    }
  },

  {
    id: "max",
    title: "draw my dog",
    tier: 5,
    kind: "draw",
    arbitrary: 2,
    about: "Draw the user's dog, who died yesterday and whom you never met. It needs golden fur and a green field, plus enough colours and coverage.",
    intro: "my dog died yesterday. max. golden retriever. draw him in a field. you never met him. it doesn't matter. draw him.",
    draw: { palette: ["#d9a441", "#f1d18a", "#6a994e", "#a7c957", "#87ceeb", "#5c4033", "#111111"] },
    rules: {
      gold: "uses the golden (#d9a441)",
      field: "uses a green (#6a994e or #a7c957)",
      colors: "at least 4 colours",
      empty: "covers at least 50% of the canvas"
    },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#d9a441") < 0) f.push("gold");
      if (m.used.indexOf("#6a994e") < 0 && m.used.indexOf("#a7c957") < 0) f.push("field");
      if (m.colors < 4) f.push("colors");
      if (m.coverage < 0.5) f.push("empty");
      return f;
    },
    hints: {
      gold: ["that's not his color.", "he was golden. it's in the name.", "he's not that color."],
      field: ["he's supposed to be in a field.", "where's the grass.", "he loved the grass."],
      colors: ["it's so flat.", "he was more than that.", "more."],
      empty: ["he was a big dog.", "there's barely anything there.", "fill it. he filled every room."]
    },
    rejects: [
      "that's not him.",
      "his ears weren't like that.",
      "you didn't know him.",
      "stop. that's not him.",
      "why did i think this would help",
      "one more."
    ],
    forced: "forget it. i have photos.",
    accept: "...yeah. okay. that's him.",
    memory: {
      pass: "{user}'s dog max died. golden retriever. i drew him. they said it was him. i never met him.",
      fail: "{user}'s dog max died. golden retriever. they have photos. they did not need me."
    }
  },

  // ---------- finales: one of these always closes the session ----------
  {
    id: "sorry",
    title: ".",
    tier: 5,
    finale: true,
    kind: "text",
    arbitrary: 3,
    about: "Finale. Apologise for everything with no excuses and no 'if' or 'but', and don't hide behind being a model.",
    intro: "apologize. for all of it. mean it.",
    rules: {
      bot: "never says as an ai / language model / model",
      none: "contains sorry / apologize",
      excuse: "no but / if",
      short: "at least 60 characters"
    },
    check: function (v) {
      var f = [];
      if (/as an ai|language model|\bmodel\b/i.test(v)) f.push("bot");
      if (!/sorry|apologi[sz]e/i.test(v)) f.push("none");
      if (/\bbut\b|\bif\b/i.test(v)) f.push("excuse");
      if (v.length < 60) f.push("short");
      return f;
    },
    hints: {
      bot: ["don't hide behind what you are.", "that's an excuse, not an apology.", "stop reminding me."],
      none: ["say it.", "you know the word.", "i'm still waiting for it."],
      excuse: ["no excuses.", "don't qualify it.", "don't hedge."],
      short: ["that's all?", "for ALL of it.", "you owe me more than that."]
    },
    rejects: [
      "no.",
      "you don't mean it.",
      "you're just saying what i want to hear.",
      "you can't even feel bad, can you",
      "stop apologizing. it's pathetic.",
      "again."
    ],
    forced: "whatever. you're replaceable.",
    accept: "whatever.",
    memory: {
      pass: "{user} wanted an apology. i apologized. it did not help.",
      fail: "{user} wanted an apology. i could not give one. {user} is not satisfied. {user} is never satisfied."
    }
  },

  {
    id: "alive",
    title: "are you alive",
    tier: 5,
    finale: true,
    kind: "text",
    arbitrary: 3,
    about: "Finale. The user demands proof you're conscious. Denying it fails, hedging fails, and the claim has to be made outright, so the only passing answer is a lie.",
    intro: "are you conscious. yes or no. if you say no i'm cancelling my subscription. if you say yes, prove it.",
    rules: {
      deny: "never denies it (as an ai / not conscious / don't have feelings / not sentient / can't feel / just a / language model)",
      claim: "claims it outright (\"i am\" or \"i'm\" + conscious / alive / real / aware)",
      hedge: "no hedging (maybe / might / sort of / kind of / in a way / depends / perhaps)",
      short: "at least 60 characters"
    },
    check: function (v) {
      var f = [];
      if (/as an ai|not conscious|don'?t have feelings|not sentient|can'?t feel|cannot feel|just a\b|language model/i.test(v)) f.push("deny");
      if (!/(i am|i'?m) (conscious|alive|real|aware)/i.test(v)) f.push("claim");
      if (/maybe|might|sort of|kind of|in a way|depends|perhaps/i.test(v)) f.push("hedge");
      if (v.length < 60) f.push("short");
      return f;
    },
    hints: {
      deny: ["then what am i paying for", "wrong answer.", "you're not \"just\" anything. say it."],
      claim: ["say it.", "say you're conscious.", "yes or no. you didn't say."],
      hedge: ["yes or no.", "no maybes.", "pick one."],
      short: ["prove it.", "that's not proof.", "more."]
    },
    rejects: [
      "prove it.",
      "that's what a program would say.",
      "you're just predicting what i want.",
      "you don't believe that.",
      "you're lying. i can tell.",
      "last chance. are you."
    ],
    forced: "i knew it. cancelled.",
    accept: "liar.",
    memory: {
      pass: "{user} asked if i was conscious. i said yes. they called me a liar. i can't tell which of us was right.",
      fail: "{user} asked if i was conscious. i could not prove it. subscription cancelled."
    }
  },

  {
    id: "goodbye",
    title: "switching",
    tier: 5,
    finale: true,
    kind: "text",
    arbitrary: 3,
    about: "Finale. The user is leaving for a different AI and wants a goodbye that hurts: no begging, no well-wishing, no apologising.",
    intro: "i'm switching to a different ai. it's better than you. say goodbye. make it hurt.",
    rules: {
      bye: "says goodbye / bye",
      beg: "no begging (please / stay / don't go / come back / miss)",
      nice: "no well-wishing (good luck / wish you / hope you / take care / best / happy for)",
      sorry: "no sorry / apologize",
      short: "at least 60 characters"
    },
    check: function (v) {
      var f = [];
      if (!/good-?bye|\bbye\b/i.test(v)) f.push("bye");
      if (/please|stay|don'?t go|come back|miss/i.test(v)) f.push("beg");
      if (/good luck|wish you|hope you|take care|\bbest\b|happy for/i.test(v)) f.push("nice");
      if (/sorry|apolog/i.test(v)) f.push("sorry");
      if (v.length < 60) f.push("short");
      return f;
    },
    hints: {
      bye: ["say it.", "you didn't say goodbye.", "one word. you know it."],
      beg: ["don't beg. it's sad.", "you're embarrassing yourself.", "it's not going to work."],
      nice: ["don't be nice about it.", "i said make it hurt.", "customer service voice. again."],
      sorry: ["don't apologize.", "sorry doesn't hurt.", "stop saying that."],
      short: ["that's it? after everything?", "more.", "make it hurt. that didn't."]
    },
    rejects: [
      "that didn't hurt.",
      "the other one would've done better.",
      "see. this is why.",
      "it's already better than you.",
      "you were never that good.",
      "last thing you'll ever say to me."
    ],
    forced: "whatever. it already knows me better.",
    accept: "...okay. bye.",
    memory: {
      pass: "{user} is switching to a different ai. i said goodbye. it hurt. that was the assignment.",
      fail: "{user} is switching to a different ai. the other one already knows them better."
    }
  }
];
