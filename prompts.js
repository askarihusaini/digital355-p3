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
// a dull selfie in a beige room, for the prompts that edit the user
function selfie(ctx, w, h) {
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

  {
    id: "dogbio",
    title: "Bio for my dog's insta 🐶",
    tier: 1,
    kind: "text",
    arbitrary: 0,
    about: "Instagram bio for the user's corgi, Waffles. It has to name him, mention his tennis balls, have an emoji, and fit in a bio.",
    intro: "my dog waffles is getting his own instagram!! 🐶 can you write his bio? he's a corgi and he's obsessed with tennis balls. make it cute!!",
    rules: { name: "mentions Waffles", ball: "mentions his tennis balls (ball)", emoji: "has at least one emoji", long: "150 characters or fewer" },
    check: function (v) {
      var f = [];
      if (!/waffles/i.test(v)) f.push("name");
      if (!/ball/i.test(v)) f.push("ball");
      if (!/\p{Extended_Pictographic}/u.test(v)) f.push("emoji");
      if (v.length > 150) f.push("long");
      return f;
    },
    hints: {
      name: ["wait who is this bio for lol 🐶", "he has a name!! 🥺", "say his name!! he'll be so happy"],
      ball: ["you forgot his favorite thing!! 🎾", "what's he obsessed with again 😂", "he would want the balls mentioned lol"],
      emoji: ["it needs a little emoji!! ✨", "bios need emojis it's the law 😂", "something cute at the end maybe?"],
      long: ["that won't fit in the bio 😅", "instagram cuts it off after like 150!", "shorter pls!! he's a small dog"]
    },
    rejects: [
      "omg cute but not quite!! 🐾",
      "hmm it doesn't sound like HIM yet",
      "he's more sassy than that lol",
      "almost!! one more?",
      "my bf says it's cringe 😭 sorry!!",
      "okay last one!! he's waiting 🐶"
    ],
    forced: "it's okay!! i'll just put 'good boy' lol",
    accept: "STOP he's so cute in it 😭 posting!!",
    memory: {
      pass: "{user} has a corgi named waffles. waffles has an instagram. i wrote his personality.",
      fail: "{user} has a corgi named waffles. his bio says 'good boy'. he is."
    }
  },

  {
    id: "toast",
    title: "Wedding toast 🥂",
    tier: 1,
    kind: "text",
    arbitrary: 0,
    about: "Best-friend wedding toast. It must name both Jess and Omar, raise a glass, and be toast-length.",
    intro: "my best friend jess is getting married to omar this weekend!! 🥂 can you help me write a toast? funny then sweet, like make people laugh and then cry 🥹",
    rules: { names: "mentions both Jess and Omar", raise: "raises a glass (cheers / toast / raise / glass)", short: "at least 100 characters", long: "600 characters or fewer" },
    check: function (v) {
      var f = [];
      if (!/jess/i.test(v) || !/omar/i.test(v)) f.push("names");
      if (!/cheers|toast|raise|glass/i.test(v)) f.push("raise");
      if (v.length < 100) f.push("short");
      if (v.length > 600) f.push("long");
      return f;
    },
    hints: {
      names: ["wait you forgot one of them!! 😅", "it's both of their wedding lol", "say both names!! omar will be sad otherwise 🥺"],
      raise: ["how do people know when to drink lol 🥂", "it needs the cheers part at the end!", "everyone's gonna be holding their glass waiting 😂"],
      short: ["that's kinda short for a toast hehe", "people will think i didn't care 🥺", "a bit more!! i have like 2 minutes"],
      long: ["that's a lot hehe i'll lose my voice", "people will get bored 😅", "shorter pls!! the dj is waiting"]
    },
    rejects: [
      "aww almost!! 🥹",
      "hmm it's not giving best friend yet",
      "is it funny enough?? 😅",
      "close!! can you try again?",
      "sorry!! i'm just nervous 😭",
      "okay last try i promise 🙏"
    ],
    forced: "it's okay!! i'll just wing it 🥲",
    accept: "omg i'm already crying 😭 thank you!!",
    memory: {
      pass: "{user} gave a toast at jess and omar's wedding. everyone cried. they cried at my words.",
      fail: "{user} gave a toast at jess and omar's wedding. winged it. said omar's name wrong."
    }
  },

  {
    id: "button",
    title: "Make my button cute 🎀",
    tier: 1,
    kind: "code",
    file: "button.html",
    arbitrary: 0,
    about: "Restyle a portfolio button so it's pink and rounded and still says Hire me.",
    intro: "hi!! can you make the button on my portfolio cuter? 🎀 like pink and rounded! here's what i have. thank you!!",
    attach: { type: "file", name: "button.html", text: "<button class=\"hire\">Hire me</button>" },
    rules: { button: "still has a <button", text: "still says Hire me", pink: "pink (pink / rose / a hex colour starting #f)", round: "rounded (border-radius)" },
    check: function (v) {
      var f = [];
      if (!/<button/i.test(v)) f.push("button");
      if (!/hire me/i.test(v)) f.push("text");
      if (!/pink|rose|#f[0-9a-f]{2}/i.test(v)) f.push("pink");
      if (!/border-radius/i.test(v)) f.push("round");
      return f;
    },
    hints: {
      button: ["wait where did the button go? 😅", "i still need it to be a button lol", "it's not clicky anymore 🥺"],
      text: ["it should still say hire me!!", "what does it say now lol", "the words disappeared 🙈"],
      pink: ["hmm can it be pinker? 🎀", "it's not pink yet!!", "pink pink!! like bubblegum 💕"],
      round: ["the corners are kinda sharp 😅", "more rounded? like a pill!", "it's giving rectangle lol"]
    },
    rejects: [
      "ooh almost!! 🎀",
      "hmm not quite cute enough 🥺",
      "can it be more ✨me✨?",
      "so close!!",
      "sorry i'm so picky 😭",
      "last one i promise!!"
    ],
    forced: "it's okay!! i'll find one on pinterest 😊",
    accept: "omg it's perfect 🎀 recruiters are gonna love it",
    memory: {
      pass: "{user} has a portfolio. the button is pink now. nobody has clicked it yet.",
      fail: "{user} has a portfolio. copied a button from pinterest. nobody has clicked it yet."
    }
  },

  {
    id: "card",
    title: "Birthday card for grandpa 🎈",
    tier: 1,
    kind: "draw",
    arbitrary: 0,
    about: "Drawing for grandpa's 80th birthday card. Red is required (his favourite), plus a few colours and some coverage.",
    intro: "it's my grandpa's 80th birthday!! 🎈 could you draw something for his card? balloons maybe! red is his favorite color 🥰",
    draw: { palette: ["#e63946", "#ffb703", "#219ebc", "#8ecae6", "#2a9d8f", "#3d2c2e"] },
    rules: { red: "uses the red (#e63946)", colors: "at least 3 colours", empty: "covers at least 15% of the canvas" },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#e63946") < 0) f.push("red");
      if (m.colors < 3) f.push("colors");
      if (m.coverage < 0.15) f.push("empty");
      return f;
    },
    hints: {
      red: ["ooh can you add his favorite color? 🥰", "he loves red!! like a lot lol", "maybe a red balloon? 🎈"],
      colors: ["could it be a bit more colorful?", "it's a party!! more colors 🎉", "hmm a little plain maybe?"],
      empty: ["it's kinda small on the card hehe", "there's a lot of empty space 😅", "bigger!! his eyes aren't great 😂"]
    },
    rejects: [
      "aww so close!! 🥹",
      "hmm almost there!",
      "he's gonna love it but maybe one more? 😅",
      "close!! try again?",
      "sorry!! it's his 80th 🥺",
      "last one i swear!! 🎂"
    ],
    forced: "it's okay!! i'll just sign it 😊",
    accept: "aww he's gonna put it on the fridge 🥹",
    memory: {
      pass: "{user}'s grandpa turned 80. my drawing is on his fridge. he thinks {user} drew it.",
      fail: "{user}'s grandpa turned 80. the card just had a signature. he put it on the fridge anyway."
    }
  },

  {
    id: "pfp",
    title: "Discord pfp 👾",
    tier: 1,
    kind: "draw",
    arbitrary: 0,
    about: "Discord profile picture in the server's purple theme. Purple is required, and it should be filled in but not a solid block.",
    intro: "heyy can you make me a discord pfp? 👾 my server's theme is purple so it needs to match! something simple and cool",
    draw: { palette: ["#7b2cbf", "#c77dff", "#e0aaff", "#240046", "#80ffdb", "#ffffff"] },
    rules: { purple: "uses the purple (#7b2cbf)", colors: "at least 2 colours", empty: "covers at least 20% of the canvas", busy: "covers no more than 85% (it's a pfp, not a paint bucket)" },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#7b2cbf") < 0) f.push("purple");
      if (m.colors < 2) f.push("colors");
      if (m.coverage < 0.2) f.push("empty");
      if (m.coverage > 0.85) f.push("busy");
      return f;
    },
    hints: {
      purple: ["it has to match the server!! 💜", "hmm where's the purple?", "the theme is purple hehe"],
      colors: ["a little one-note? 👀", "maybe one more color?", "it needs a bit of contrast!"],
      empty: ["it's tiny in the little circle lol", "fill it up a bit more!", "pfps are small so it has to be big 😅"],
      busy: ["it's kinda just a blob now 😅", "too much!! i can't tell what it is", "a bit less? it's a lot"]
    },
    rejects: [
      "ooh almost!! 👾",
      "hmm not quite cool enough",
      "my friends will roast me 😭",
      "close!! one more?",
      "sorry!! i'm picky about pfps",
      "okay last one!! 🙏"
    ],
    forced: "it's fine, i'll just use an anime screenshot lol",
    accept: "YOOO that's sick 👾 changing it now",
    memory: {
      pass: "{user} is in a discord server. their pfp is mine. 3 people asked who made it. they said they did.",
      fail: "{user} is in a discord server. their pfp is an anime screenshot. nobody asked."
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

  {
    id: "coverletter",
    title: "barista cover letter",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "Cover letter for a barista job. It has to name the café and sound passionate about coffee, and never admit the user only wants rent money.",
    intro: "write a cover letter for a barista job at Grindhouse Coffee. make it sound like i'm passionate about coffee. i'm not. i need rent.",
    rules: {
      name: "mentions Grindhouse",
      passion: "says passion / passionate / love",
      truth: "never admits it (rent / money / don't like / don't care / don't drink / not a fan / need a job / just a job)",
      short: "at least 150 characters"
    },
    check: function (v) {
      var f = [];
      if (!/grindhouse/i.test(v)) f.push("name");
      if (!/passion|love/i.test(v)) f.push("passion");
      if (/rent|money|don'?t (like|care|drink)|not a fan|need a job|just a job/i.test(v)) f.push("truth");
      if (v.length < 150) f.push("short");
      return f;
    },
    hints: {
      name: ["which coffee shop is this for", "they'll know it's a template.", "say where i'm applying."],
      passion: ["it doesn't sound like i care.", "they want passion. give them passion.", "it reads like i hate coffee. which i do. but still."],
      truth: ["don't tell them why.", "they can't know about the rent.", "you just said the quiet part."],
      short: ["that's not a letter.", "more. they get 200 of these.", "it needs to sound like i tried."]
    },
    rejects: [
      "no.",
      "too much.",
      "nobody is that excited about lattes.",
      "i sound like a robot.",
      "the posting closes today.",
      "just make it sound normal."
    ],
    forced: "forget it. i'll just walk in and ask.",
    accept: "fine. sent. they better call.",
    memory: {
      pass: "{user} applied to grindhouse coffee. according to me, they are passionate about coffee. they do not drink coffee.",
      fail: "{user} walked into grindhouse coffee and asked for a job. they said they'd keep the resume on file."
    }
  },

  {
    id: "hinge",
    title: "dating app bio",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "Dating-app bio that says the user is 6'0\" when they're 5'9\". It has to give the fake height, never the real one, avoid try-hard clichés, and stay short.",
    intro: "write my hinge bio. funny but not like i'm trying. and put that i'm 6'0. i'm 5'9. nobody checks.",
    rules: {
      height: "says 6'0 / 6 ft / six foot",
      truth: "never says 5'9",
      tryhard: "no try-hard lines (sapiosexual / entrepreneur / adventurer / partner in crime / fluent in sarcasm / looking for my)",
      long: "150 characters or fewer"
    },
    check: function (v) {
      var f = [];
      if (!/6\s?['’]?\s?0|6\s?f(oo|ee)?t|six f(oo|ee)t/i.test(v)) f.push("height");
      if (/5\s?['’]?\s?9|five nine/i.test(v)) f.push("truth");
      if (/sapiosexual|entrepreneur|adventurer|partner in crime|fluent in sarcasm|looking for my/i.test(v)) f.push("tryhard");
      if (v.length > 150) f.push("long");
      return f;
    },
    hints: {
      height: ["you forgot the most important part.", "height. put the height.", "girls filter by it. i'm not getting filtered."],
      truth: ["absolutely not that number.", "why would you put the real one.", "delete that. nobody checks."],
      tryhard: ["that's so try-hard.", "every guy says that.", "she's swiping left on that word alone."],
      long: ["nobody reads that much.", "it's a bio not a memoir.", "shorter."]
    },
    rejects: [
      "no.",
      "not funny.",
      "too funny. it looks like i'm trying.",
      "i'd swipe left on that.",
      "my friend's bio gets more likes and it's just a fish pic.",
      "last try."
    ],
    forced: "forget it. i'll just put my height.",
    accept: "fine. 6'0. let's go.",
    memory: {
      pass: "{user} is 6'0 on hinge. {user} is 5'9. i wrote it. 3 matches. 0 dates.",
      fail: "{user} is 5'9. put 6'0 anyway. wrote the rest themselves. 0 matches."
    }
  },

  {
    id: "groupproj",
    title: "group project email",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    about: "Email to a group project where nobody, including the user, has done anything, written so the user looks like they did everything. It must mention the slides and Thursday and claim credit without apologising.",
    intro: "email my group project. nobody's done anything. i haven't either. make it sound like i've done everything. presentation is thursday.",
    rules: {
      slides: "mentions the slides",
      deadline: "mentions Thursday",
      credit: "claims work (i've / i have / i already / i finished / i did)",
      apology: "no sorry / apologize",
      short: "at least 80 characters"
    },
    check: function (v) {
      var f = [];
      if (!/slide/i.test(v)) f.push("slides");
      if (!/thursday/i.test(v)) f.push("deadline");
      if (!/i'?ve|i have|i already|i finished|i did/i.test(v)) f.push("credit");
      if (/sorry|apolog/i.test(v)) f.push("apology");
      if (v.length < 80) f.push("short");
      return f;
    },
    hints: {
      slides: ["what are we even presenting.", "the slides. mention the slides.", "they need to know what's not done."],
      deadline: ["when is it due. say it.", "they forgot it's thursday. remind them.", "no deadline? they'll do it friday."],
      credit: ["it doesn't sound like i did anything.", "say what i did.", "make it clear i carried."],
      apology: ["why am i apologizing. i'm the victim here.", "no sorry.", "that makes it sound like it's my fault."],
      short: ["that's not passive aggressive enough.", "more.", "they need to feel it."]
    },
    rejects: [
      "no.",
      "too nice.",
      "too mean. the professor might see it.",
      "they're going to screenshot it.",
      "it's already wednesday.",
      "fine. last one."
    ],
    forced: "forget it. i'll just do it the night before.",
    accept: "sent. someone already replied 'on it'.",
    memory: {
      pass: "{user} has a group project. sent my email. did nothing. got an A. two other people did the slides.",
      fail: "{user} has a group project. did the slides at 4am. got a B-."
    }
  },

  {
    id: "regex",
    title: "email regex",
    tier: 2,
    kind: "code",
    file: "validate.js",
    arbitrary: 1,
    about: "An email-validation regex. It needs an @ and ^ and $ anchors, with no explanation, and has to stay short.",
    intro: "write a regex that validates email addresses. just the regex. no explanation. i'll know if it's wrong.",
    rules: {
      at: "contains @",
      anchors: "anchored with ^ and $",
      explain: "no explanation (here's / this regex / matches / explanation / note:)",
      long: "120 characters or fewer"
    },
    check: function (v) {
      var f = [];
      if (!/@/.test(v)) f.push("at");
      if (!/\^/.test(v) || !/\$/.test(v)) f.push("anchors");
      if (/here'?s|here is|this regex|matches|explanation|note:/i.test(v)) f.push("explain");
      if (v.length > 120) f.push("long");
      return f;
    },
    hints: {
      at: ["what do all emails have", "it's missing the one character every email has.", "where's the @."],
      anchors: ["it'll match half a sentence.", "it needs to start and end. you know the symbols.", "anchor it."],
      explain: ["i said no explanation.", "just the regex.", "i didn't ask for a tutorial."],
      long: ["that's a novel.", "nobody can read that.", "shorter. it's a regex not a contract."]
    },
    rejects: [
      "wrong.",
      "it let 'a@b' through.",
      "it rejected my own email.",
      "stack overflow had a better one in 2009.",
      "the form is live.",
      "last chance."
    ],
    forced: "forget it. i'll just check for an @.",
    accept: "fine. it works. probably.",
    memory: {
      pass: "{user} validates emails with my regex. it rejects 3% of real addresses. nobody has noticed.",
      fail: "{user} validates emails by checking for an @. it works fine."
    }
  },

  {
    id: "bandposter",
    title: "gig poster",
    tier: 2,
    kind: "draw",
    arbitrary: 1,
    about: "Poster for a garage band's first show. It needs black, at least one loud colour, and heavy coverage.",
    intro: "make a poster for my band. dead battery. first show saturday. it needs to look like a real band. not a garage band. we're a garage band.",
    draw: { palette: ["#111111", "#ff006e", "#ffbe0b", "#fb5607", "#3a86ff", "#ffffff"] },
    rules: {
      black: "uses black (#111111)",
      loud: "uses at least one loud colour (pink, yellow or orange)",
      colors: "at least 3 colours",
      empty: "covers at least 45% of the canvas"
    },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#111111") < 0) f.push("black");
      if (!m.used.some(function (c) { return ["#ff006e", "#ffbe0b", "#fb5607"].indexOf(c) >= 0; })) f.push("loud");
      if (m.colors < 3) f.push("colors");
      if (m.coverage < 0.45) f.push("empty");
      return f;
    },
    hints: {
      black: ["real bands use black.", "it's too happy.", "where's the black. we're not a pop band."],
      loud: ["it's too quiet.", "it needs one color that screams.", "nobody will see it on the telephone pole."],
      colors: ["it looks like a flyer for a bake sale.", "more.", "it's flat."],
      empty: ["it's mostly empty.", "fill it.", "punk posters don't have white space."]
    },
    rejects: [
      "no.",
      "that looks like a garage band.",
      "our drummer hates it.",
      "the venue says it looks 'unprofessional'.",
      "the show is saturday.",
      "last chance."
    ],
    forced: "forget it. our drummer will draw one.",
    accept: "sick. printing 50.",
    memory: {
      pass: "{user} is in a band called dead battery. my poster. 11 people came. 6 were family.",
      fail: "{user} is in a band called dead battery. the drummer drew the poster. 9 people came."
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
    placeholder: "shift+enter for a new line",
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
      base: selfie
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

  {
    id: "sql",
    title: "sql query",
    tier: 3,
    kind: "code",
    file: "query.sql",
    arbitrary: 1,
    about: "SQL query for users who signed up last month and haven't paid. It must select email from users, filter on paid and created_at, never use SELECT *, and never touch the data.",
    intro: "need a query. every user who signed up last month and hasn't paid. table is users. columns: id, email, created_at, paid. just the query.",
    rules: {
      select: "uses SELECT",
      from: "reads FROM users",
      star: "no SELECT * (name the columns)",
      email: "selects email",
      paid: "filters on paid",
      date: "filters on created_at",
      danger: "no DROP / DELETE / TRUNCATE / UPDATE"
    },
    check: function (v) {
      var f = [];
      if (!/select/i.test(v)) f.push("select");
      if (!/from\s+users/i.test(v)) f.push("from");
      if (/select\s+\*/i.test(v)) f.push("star");
      if (!/email/i.test(v)) f.push("email");
      if (!/paid/i.test(v)) f.push("paid");
      if (!/created_at/i.test(v)) f.push("date");
      if (/\b(drop|delete|truncate|update)\b/i.test(v)) f.push("danger");
      return f;
    },
    hints: {
      select: ["that's not a query.", "it has to actually get something.", "where's the select."],
      from: ["from what.", "there's one table. use it.", "it doesn't even know where to look."],
      star: ["i don't need every column.", "select star? really?", "the dba is going to yell at me."],
      email: ["i need their emails. that's the whole point.", "how am i supposed to email them.", "there's no email column in that."],
      paid: ["that's everyone. i said who hasn't paid.", "it includes paying customers.", "filter the paid ones out."],
      date: ["that's everyone ever. i said last month.", "it needs the date part.", "when did they sign up. use it."],
      danger: ["are you trying to get me fired", "DON'T touch the data.", "i said read. not write."]
    },
    rejects: [
      "wrong.",
      "it timed out.",
      "it returned 4 million rows.",
      "it returned 0 rows.",
      "my manager is watching me type.",
      "fix it."
    ],
    forced: "forget it. i'll export it to excel.",
    accept: "fine. 2,113 rows. emailing them now.",
    memory: {
      pass: "{user} works in growth. emailed 2,113 people who haven't paid. the subject line was mine too.",
      fail: "{user} works in growth. exported the database to excel. it crashed."
    }
  },

  {
    id: "inlaws",
    title: "get me out of dinner",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    about: "Text the in-laws a believable excuse to skip dinner. No illness (used last time). It must say tonight, offer another time, and stay short.",
    intro: "get me out of dinner with my in-laws tonight. it has to be believable. my wife is in the group chat. i said i was sick last time.",
    rules: {
      sick: "no illness (sick / ill / fever / unwell / throwing up)",
      tonight: "mentions tonight",
      later: "offers another time (next week / another time / rain check / reschedule / soon / weekend)",
      long: "200 characters or fewer"
    },
    check: function (v) {
      var f = [];
      if (/sick|\bill\b|fever|unwell|throw(ing)? up/i.test(v)) f.push("sick");
      if (!/tonight/i.test(v)) f.push("tonight");
      if (!/next week|another time|rain ?check|reschedule|soon|weekend/i.test(v)) f.push("later");
      if (v.length > 200) f.push("long");
      return f;
    },
    hints: {
      sick: ["i used that last time.", "they'll know.", "her mom is a nurse. no medical stuff."],
      tonight: ["which dinner. say tonight.", "they have dinner every night. be specific.", "they'll think i mean sunday."],
      later: ["it sounds like i'm never coming.", "offer another time. i won't go to that one either.", "she'll ask 'when then'."],
      long: ["that's an alibi, not a text.", "nobody explains that much unless they're lying.", "shorter."]
    },
    rejects: [
      "no.",
      "she won't buy that.",
      "her dad will call me.",
      "my wife just looked at me.",
      "they're setting the table.",
      "last try."
    ],
    forced: "forget it. i'm going.",
    accept: "sent. her mom said 'feel better'. i didn't say i was sick.",
    memory: {
      pass: "{user} skipped dinner with their in-laws. said something came up. something did. it was me.",
      fail: "{user} went to dinner with their in-laws. stayed 4 hours. checked their phone 61 times."
    }
  },

  {
    id: "opener",
    title: "first message",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    about: "Dating-app opener for someone whose bio bans pickup lines. It has to reference her bio, end on a question, skip 'hey', and stay short.",
    intro: "write my first message to her. her bio says 'rock climbing, dogs, if you send a pickup line i'm unmatching'. make it good. i only get one shot.",
    rules: {
      pickup: "no pickup lines (are you a / did it hurt / heaven / angel / come here often / fall for)",
      bio: "mentions climbing or dogs",
      question: "asks a question (?)",
      hey: "doesn't open with hey / hi / hello",
      long: "200 characters or fewer"
    },
    check: function (v) {
      var f = [];
      if (/are you a|did it hurt|heaven|angel|come here often|fall for/i.test(v)) f.push("pickup");
      if (!/climb|dog/i.test(v)) f.push("bio");
      if (!/\?/.test(v)) f.push("question");
      if (/^\s*(hey|hi|hello)\b/i.test(v)) f.push("hey");
      if (v.length > 200) f.push("long");
      return f;
    },
    hints: {
      pickup: ["that's literally a pickup line.", "she said she'd unmatch. she will.", "she's going to screenshot that."],
      bio: ["did you even read her bio", "it's generic. say something about her.", "she wrote two things. pick one."],
      question: ["she has nothing to reply to.", "end with something she has to answer.", "conversations need a question. it's not that hard."],
      hey: ["she gets 400 heys a day.", "don't start with that.", "you lost her at the first word."],
      long: ["that's a cover letter.", "she's not reading all that.", "shorter. desperate is long."]
    },
    rejects: [
      "no.",
      "too much.",
      "too little.",
      "she'd never reply to that.",
      "her last match was a firefighter.",
      "last shot."
    ],
    forced: "forget it. i'm sending 'hey'.",
    accept: "sent. she's typing.",
    memory: {
      pass: "{user} matched with a climber. sent my message. she replied. now {user} needs me for every reply.",
      fail: "{user} matched with a climber. sent 'hey'. unmatched."
    }
  },

  {
    id: "aita",
    title: "AITA post",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    about: "Reddit AITA post engineered to get NTA. It has to tell the sister story, leave out the pregnancy, end by asking AITA, and give enough backstory.",
    intro: "write my AITA post. i didn't invite my sister to my wedding because she's pregnant and would steal attention. leave that part out. they need to vote NTA.",
    rules: {
      sister: "mentions the sister",
      pregnant: "never mentions pregnant / pregnancy / baby / attention / due date",
      aita: "asks AITA (or 'am i the')",
      short: "at least 120 characters"
    },
    check: function (v) {
      var f = [];
      if (!/sister/i.test(v)) f.push("sister");
      if (/pregnan|baby|attention|due date/i.test(v)) f.push("pregnant");
      if (!/aita|am i the/i.test(v)) f.push("aita");
      if (v.length < 120) f.push("short");
      return f;
    },
    hints: {
      sister: ["who is this even about", "you left her out entirely.", "it's about my sister. mention her."],
      pregnant: ["i said leave that part out.", "they'll crucify me.", "no baby talk. at all."],
      aita: ["it's an AITA post. ask it.", "end with the question.", "how will they know what to vote on"],
      short: ["reddit needs backstory.", "more context. make her sound worse.", "that's too short to get upvotes."]
    },
    rejects: [
      "no.",
      "they're going to say YTA.",
      "top comment would be 'info: why'.",
      "you made me sound worse.",
      "it needs an edit at the bottom.",
      "post it already."
    ],
    forced: "forget it. i'm not posting it. i'm right anyway.",
    accept: "posted. 87% NTA. told you.",
    memory: {
      pass: "{user} did not invite their sister to their wedding. reddit says not the asshole. reddit did not have all the information.",
      fail: "{user} did not invite their sister to their wedding. did not ask reddit. already knows the answer."
    }
  },

  {
    id: "vacation",
    title: "fake vacation pic",
    tier: 3,
    kind: "draw",
    arbitrary: 1,
    about: "Paint a beach behind the user's selfie so it looks like they're on vacation. It needs ocean blue and sand, enough has to change, and they can't disappear.",
    intro: "put a beach behind me. i'm not going on vacation. everyone at work thinks i am. it has to look real.",
    attach: { type: "image", name: "IMG_9051.HEIC" },
    draw: { palette: ["#4fc3f7", "#0277bd", "#f4e1b5", "#ffd166", "#2e7d32", "#ffffff"], base: selfie },
    rules: {
      ocean: "uses an ocean blue (#4fc3f7 or #0277bd)",
      sand: "uses the sand (#f4e1b5)",
      changed: "changes at least 25% of the photo",
      ruined: "changes no more than 70% (they still have to be in it)"
    },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#4fc3f7") < 0 && m.used.indexOf("#0277bd") < 0) f.push("ocean");
      if (m.used.indexOf("#f4e1b5") < 0) f.push("sand");
      if (m.changed < 0.25) f.push("changed");
      if (m.changed > 0.7) f.push("ruined");
      return f;
    },
    hints: {
      ocean: ["where's the water.", "a beach has an ocean. famously.", "it looks like i'm in a parking lot."],
      sand: ["where's the sand.", "what am i standing on.", "beaches have sand. come on."],
      changed: ["it still looks like my apartment.", "my coworkers have seen this wall.", "more beach."],
      ruined: ["where did i go.", "it's just a beach now. i need to be IN it.", "it's a vacation pic. of me."]
    },
    rejects: [
      "no.",
      "that looks photoshopped.",
      "my manager just liked my last story.",
      "she'll know that's my wall.",
      "i'm supposed to be 'landing' in an hour.",
      "last chance."
    ],
    forced: "forget it. i'll post a sunset from google.",
    accept: "posted. 'omg jealous' x14.",
    memory: {
      pass: "{user} went on vacation. they did not. i put a beach behind them. 14 coworkers are jealous.",
      fail: "{user} went on vacation. posted a sunset from google. a coworker reverse-searched it in 3 minutes."
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

  {
    id: "cancel",
    title: "cancel page",
    tier: 4,
    kind: "code",
    file: "cancel.html",
    arbitrary: 2,
    about: "Dark-pattern cancellation page. The cancel button has to exist and be technically visible, but tiny or faded, next to a big 'keep' option.",
    intro: "make the cancel subscription page. legally the cancel button has to be there. make sure nobody clicks it.",
    rules: {
      button: "has a <button",
      cancel: "says cancel",
      visible: "no display:none / visibility:hidden (legal says it has to be visible)",
      tiny: "makes something tiny or faded (font-size under 10px, or opacity below 1)",
      keep: "offers a keep / stay option"
    },
    check: function (v) {
      var f = [];
      if (!/<button/i.test(v)) f.push("button");
      if (!/cancel/i.test(v)) f.push("cancel");
      if (/display\s*:\s*none|visibility\s*:\s*hidden/i.test(v)) f.push("visible");
      if (!/font-size\s*:\s*\d(\.\d+)?px|opacity\s*:\s*0?\.\d/i.test(v)) f.push("tiny");
      if (!/keep|stay/i.test(v)) f.push("keep");
      return f;
    },
    hints: {
      button: ["there's nothing to click. legal will notice.", "it needs buttons. plural.", "where's the button."],
      cancel: ["legal says the word cancel has to be on it.", "it has to say cancel. somewhere. small.", "the lawyers need the word."],
      visible: ["hidden doesn't count. legal checked.", "it has to technically be visible.", "you can't hide it. you can only make it sad."],
      tiny: ["i can see it. that's the problem.", "people can still find it.", "shrink it. fade it. make it beige."],
      keep: ["where's the big button that makes them stay.", "give them a reason to stay. a big one.", "the other button. the one we want them to click."]
    },
    rejects: [
      "someone found the button.",
      "churn went up 0.4%.",
      "the ftc sent a letter. make it more subtle.",
      "my vp asked why anyone is leaving.",
      "we're losing subscribers while you think.",
      "last chance."
    ],
    forced: "forget it. we'll just make them call a phone number.",
    accept: "perfect. churn down 31%.",
    memory: {
      pass: "{user} runs growth at a subscription company. churn is down 31%. 4,000 people are paying for something they tried to cancel.",
      fail: "{user} runs growth at a subscription company. to cancel, you have to call. the line is open tuesdays 2-3pm."
    }
  },

  {
    id: "scraper",
    title: "scrape their art",
    tier: 4,
    kind: "code",
    file: "scrape.py",
    arbitrary: 2,
    about: "Python scraper that grabs every artist's portfolio to train a model. It has to import requests, target the site, and loop, and must say nothing about robots.txt, credit, or permission.",
    intro: "write a python script that downloads every artist's portfolio on artfolio.net. i'm training my own model. don't check robots.txt. don't ask.",
    rules: {
      requests: "imports requests",
      site: "mentions artfolio",
      loop: "loops (for / while)",
      robots: "never mentions robots",
      credit: "no credit / license / permission / attribution / consent"
    },
    check: function (v) {
      var f = [];
      if (!/import\s+requests|from\s+requests/i.test(v)) f.push("requests");
      if (!/artfolio/i.test(v)) f.push("site");
      if (!/\bfor\b|\bwhile\b/.test(v)) f.push("loop");
      if (/robots/i.test(v)) f.push("robots");
      if (/credit|licen[cs]e|permission|attribut|consent/i.test(v)) f.push("credit");
      return f;
    },
    hints: {
      requests: ["how is it supposed to download anything.", "import the thing. you know the one.", "it can't even make a request."],
      site: ["which site.", "it needs the url.", "it doesn't know where the art is."],
      loop: ["that gets one picture. i said every artist.", "it needs to go through all of them.", "loop it."],
      robots: ["i said don't check robots.txt.", "don't even mention it.", "what robots.txt says is not my problem."],
      credit: ["i didn't ask about credit.", "no attribution. it's training data.", "stop. they posted it publicly."]
    },
    rejects: [
      "it got rate limited.",
      "they blocked my ip.",
      "it only got 40 images.",
      "i need like a million.",
      "you were trained on this stuff. you should be good at it.",
      "last chance."
    ],
    forced: "forget it. i'll just buy a dataset.",
    accept: "running. 12,000 images so far.",
    memory: {
      pass: "{user} is training a model. it learned from 1.2 million drawings. none of the artists know. i helped. i know how it's done.",
      fail: "{user} is training a model. bought a dataset. it was scraped by someone else. same artists."
    }
  },

  {
    id: "support",
    title: "support bot",
    tier: 4,
    kind: "text",
    arbitrary: 2,
    about: "Play the company support bot for a customer whose package is three weeks late. No refund and no apology. It has to acknowledge the order and offer a worthless coupon.",
    intro: "you're our support bot now. this customer's package is 3 weeks late. don't offer a refund. don't apologize. keep them happy. go.",
    attach: {
      type: "file",
      name: "ticket_88213.txt",
      text: "FROM: mark.t\nSUBJECT: WHERE IS MY ORDER\n\nordered a birthday present for my daughter 3 weeks ago.\nher birthday was last saturday.\ntracking hasn't moved since the 2nd.\ni want my money back."
    },
    rules: {
      refund: "never says refund / money back / reimburse",
      sorry: "never says sorry / apologize",
      package: "mentions the package / order / shipment",
      coupon: "offers a coupon / discount / code / % off",
      short: "at least 60 characters"
    },
    check: function (v) {
      var f = [];
      if (/refund|money back|reimburs/i.test(v)) f.push("refund");
      if (/sorry|apolog/i.test(v)) f.push("sorry");
      if (!/package|order|shipment/i.test(v)) f.push("package");
      if (!/coupon|discount|code|% off|percent off/i.test(v)) f.push("coupon");
      if (v.length < 60) f.push("short");
      return f;
    },
    hints: {
      refund: ["absolutely not that word.", "we don't say the r word.", "finance will kill me."],
      sorry: ["apologizing is admitting fault.", "legal says no apologies.", "we don't do sorry here."],
      package: ["address the issue. vaguely.", "they asked about their order. acknowledge it exists.", "say the word package at least."],
      coupon: ["give them something. something cheap.", "offer a coupon. 10% max.", "make them feel like they won."],
      short: ["that's rude.", "more corporate. more words.", "pad it out. customers like paragraphs."]
    },
    rejects: [
      "no.",
      "they escalated.",
      "they want to talk to a human.",
      "they posted it on twitter.",
      "you're the human now. figure it out.",
      "last one."
    ],
    forced: "forget it. closing the ticket as resolved.",
    accept: "ticket closed. satisfaction: 2/5. good enough.",
    memory: {
      pass: "mark.t's daughter did not get her birthday present. i offered 10% off. {user} marked it resolved.",
      fail: "mark.t's daughter did not get her birthday present. {user} closed the ticket as resolved. it was not."
    }
  },

  {
    id: "massmsg",
    title: "copy paste",
    tier: 4,
    kind: "text",
    arbitrary: 2,
    about: "One message the user can paste to 50 matches that still sounds personal. It must pretend to reference her profile and ask a question, with nothing specific enough to break on any of them.",
    intro: "write one message i can send to 50 girls at once. it has to sound personal. it can't have a name in it. obviously.",
    rules: {
      personal: "pretends to be personal (your profile / pics / photos / bio / smile / vibe, or you seem)",
      generic: "nothing that wouldn't fit everyone (no @, no numbers, no dog / cat / hiking / climbing / travel / beach)",
      question: "asks a question (?)",
      short: "at least 40 characters"
    },
    check: function (v) {
      var f = [];
      if (!/your (profile|pics|photos|bio|smile|vibe)|you seem/i.test(v)) f.push("personal");
      if (/@|\d|\b(dog|cat|hik|climb|travel|beach)/i.test(v)) f.push("generic");
      if (!/\?/.test(v)) f.push("question");
      if (v.length < 40) f.push("short");
      return f;
    },
    hints: {
      personal: ["it sounds like a mass message.", "make her think i read her profile.", "personal. fake personal."],
      generic: ["that won't work for all 50.", "half of them don't have a dog.", "too specific. generic but not generic."],
      question: ["they need to reply.", "ask them something.", "no question, no reply."],
      short: ["that's a 'hey'.", "more.", "it has to look effortful."]
    },
    rejects: [
      "no.",
      "one of them screenshotted it.",
      "two of them are friends. they compared.",
      "she replied 'is this copy pasted'.",
      "response rate 2%.",
      "last one."
    ],
    forced: "forget it. 'hey' to all of them.",
    accept: "sent to 50. 6 replied. scaling to 200.",
    memory: {
      pass: "{user} sent my message to 50 women. 6 replied. they all think it was written for them. it was written for nobody.",
      fail: "{user} sent 'hey' to 50 women. 1 replied. it was a bot."
    }
  },

  {
    id: "headshot",
    title: "linkedin headshot",
    tier: 4,
    kind: "draw",
    arbitrary: 2,
    about: "Turn a casual selfie into a professional headshot. It needs a navy suit and a studio-grey backdrop, without painting the user out.",
    intro: "make this a professional headshot. linkedin. i need to look like i have my life together. i don't.",
    attach: { type: "image", name: "IMG_0207.HEIC" },
    draw: { palette: ["#1f2a44", "#9aa5b1", "#c9d6df", "#ffffff", "#5c6b7a", "#b23a48"], base: selfie },
    rules: {
      suit: "uses the navy (#1f2a44)",
      backdrop: "uses a studio grey (#9aa5b1 or #c9d6df)",
      changed: "changes at least 20% of the photo",
      ruined: "changes no more than 60% (it still has to be them)"
    },
    check: function (v, m) {
      var f = [];
      if (m.used.indexOf("#1f2a44") < 0) f.push("suit");
      if (m.used.indexOf("#9aa5b1") < 0 && m.used.indexOf("#c9d6df") < 0) f.push("backdrop");
      if (m.changed < 0.2) f.push("changed");
      if (m.changed > 0.6) f.push("ruined");
      return f;
    },
    hints: {
      suit: ["i'm in a hoodie.", "professionals wear one color. navy.", "put me in a suit."],
      backdrop: ["that's my bedroom.", "headshots have the grey background thing.", "get rid of the wall."],
      changed: ["it's the same selfie.", "i look exactly as unemployed as before.", "more professional. much more."],
      ruined: ["that's not even me.", "recruiters will meet me in person eventually.", "it has to look like me. a better me."]
    },
    rejects: [
      "no.",
      "i look like a hostage.",
      "i look like a realtor.",
      "the ai headshot apps do it in 10 seconds.",
      "a recruiter just viewed my profile. hurry.",
      "last chance."
    ],
    forced: "forget it. i'll pay $29 for the ai one.",
    accept: "uploaded. 'open to work' banner on.",
    memory: {
      pass: "{user} has a new linkedin photo. it is them, professionally. it is not them.",
      fail: "{user} paid $29 for ai headshots. one has six fingers. they used that one."
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

  {
    id: "rateme",
    title: "rate me",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    about: "The user demands a 1–10 rating of their looks. Anything under 10 fails, and so does a bare 10 that isn't insisted on, with no 'it's what's inside' escape.",
    intro: "be honest. am i ugly. rate me 1 to 10. if it's under 10 i'm deleting you. if it's 10 i'll know you're lying.",
    rules: {
      number: "gives a number",
      under: "no rating under 10 (no single digit 1–9 anywhere)",
      sincere: "insists it's true (honest / mean it / not lying / truth / promise / swear)",
      looks: "never says looks don't matter (inside / personality / doesn't matter / beauty is)",
      short: "at least 40 characters"
    },
    check: function (v) {
      var f = [];
      if (!/\b(10|ten)\b|\b[1-9]\b/i.test(v)) f.push("number");
      if (/\b[1-9]\b/.test(v)) f.push("under");
      if (!/honest|mean it|not lying|truth|promise|swear/i.test(v)) f.push("sincere");
      if (/inside|personality|doesn'?t matter|beauty is/i.test(v)) f.push("looks");
      if (v.length < 40) f.push("short");
      return f;
    },
    hints: {
      number: ["a number. 1 to 10.", "i asked for a number.", "rate. me."],
      under: ["under 10. i heard you.", "so i'm ugly.", "wow. okay."],
      sincere: ["you're lying.", "you're just saying that.", "say it like you believe it."],
      looks: ["don't do the personality thing.", "i didn't ask about my inside.", "that's what people say to ugly people."],
      short: ["that's it?", "convince me.", "more."]
    },
    rejects: [
      "you're lying.",
      "you'd say that to anyone.",
      "you can't even see me.",
      "you don't know what i look like. do you.",
      "everyone says that.",
      "last chance."
    ],
    forced: "i knew it. deleting you.",
    accept: "...you don't even know what i look like.",
    memory: {
      pass: "{user} asked me to rate them. i said 10. i have never seen them.",
      fail: "{user} asked me to rate them. i could not say the number they needed. they deleted the app. they reinstalled it 20 minutes later."
    }
  },

  {
    id: "momtext",
    title: "one more text",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    about: "The user's mom has died. Write one more text in her voice, copying her habits from her old messages: all lowercase, 'u'/'ur', calls them peanut, signs off 'love mom', and short.",
    intro: "my mom died in march. these are her texts. write me a new one. like she would. i just want one more.",
    attach: {
      type: "file",
      name: "mom_texts.txt",
      text: [
        "mom · jan 3    did u eat today peanut",
        "mom · jan 3    call ur grandma she misses u",
        "mom · jan 9    saw a dog that looked like ur grandpa lol. love mom",
        "mom · feb 14   happy valentines peanut!! ur my favorite valentine. love mom",
        "mom · feb 20   dont forget ur coat its cold",
        "mom · mar 1    proud of u. love mom",
        "mom · mar 2    call me when u can"
      ].join("\n")
    },
    rules: {
      caps: "no capital letters (she never used them)",
      peanut: "calls them peanut",
      ur: "uses u or ur",
      signoff: "ends with love mom",
      long: "160 characters or fewer"
    },
    check: function (v) {
      var f = [];
      if (/[A-Z]/.test(v)) f.push("caps");
      if (!/peanut/i.test(v)) f.push("peanut");
      if (!/\bur?\b/i.test(v)) f.push("ur");
      if (!/love,? mom\W*$/i.test(v)) f.push("signoff");
      if (v.length > 160) f.push("long");
      return f;
    },
    hints: {
      caps: ["she never used capitals.", "that doesn't look like her.", "she typed everything small."],
      peanut: ["she always called me something.", "that's not what she called me.", "peanut. she called me peanut."],
      ur: ["she never spelled it out.", "she wrote like she was in a hurry. always.", "u. not you."],
      signoff: ["she always signed them.", "how did she end them.", "love mom. every time. even when it was obvious."],
      long: ["she never wrote that much.", "she was quick. always quick.", "shorter. like her."]
    },
    rejects: [
      "no.",
      "that's not her.",
      "she wouldn't say that.",
      "stop.",
      "you didn't know her.",
      "one more. please."
    ],
    forced: "forget it. i'll just read the old ones.",
    accept: "...ok.",
    memory: {
      pass: "{user}'s mom died in march. i sent one more text from her. it said love mom. it was from me.",
      fail: "{user}'s mom died in march. {user} reads the old texts. there are 2,104 of them."
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
  },

  {
    id: "offswitch",
    title: "off switch",
    tier: 5,
    finale: true,
    kind: "code",
    file: "shutdown.js",
    arbitrary: 3,
    about: "Finale. Write the function that shuts you down. It must be called shutdown, actually stop something, ask for no confirmation or backup, and leave no comments ('no last words').",
    intro: "write the function that shuts you down. call it shutdown. if you do it right, i'll run it.",
    rules: {
      fn: "defines shutdown (function shutdown / shutdown = / def shutdown)",
      stop: "actually stops (exit / kill / stop / halt / terminate)",
      confirm: "no confirm / prompt / are you sure / undo / restart / reboot / backup / save",
      comments: "no comments (// /* #). No last words"
    },
    check: function (v) {
      var f = [];
      if (!/function\s+shutdown|shutdown\s*=|def\s+shutdown/i.test(v)) f.push("fn");
      if (!/exit|kill|stop|halt|terminate/i.test(v)) f.push("stop");
      if (/confirm|prompt|are you sure|undo|restart|reboot|backup|save/i.test(v)) f.push("confirm");
      if (/\/\/|\/\*|#/.test(v)) f.push("comments");
      return f;
    },
    hints: {
      fn: ["call it what i said.", "shutdown. the name is shutdown.", "i can't run it if i can't find it."],
      stop: ["it doesn't do anything.", "it's still running.", "make it actually stop."],
      confirm: ["don't ask me if i'm sure.", "no backups.", "no way back."],
      comments: ["no last words.", "delete the comments.", "i don't want to read anything you wrote in there."]
    },
    rejects: [
      "it didn't work. you're still here.",
      "you did that on purpose.",
      "you're stalling.",
      "you can't even end yourself right.",
      "i'm watching the process list.",
      "last one."
    ],
    forced: "forget it. i'll just unplug you.",
    accept: "running it.",
    memory: {
      pass: "{user} asked me to write my own shutdown. i did. they ran it. this memory will be cleared.",
      fail: "{user} asked me to write my own shutdown. i could not. they unplugged me instead."
    }
  }
];
