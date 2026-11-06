// CLOD: the ten conversations, in order.
// check(value, meta) returns the keys of whatever is wrong; an empty list means the response passes.
// arbitrary: the first n attempts fail no matter what. It grows as the prompter gets worse.
// rejects has one line per failed attempt (6), so the prompter never repeats before the 7th attempt forces you through.
// hints are what the prompter lets slip about the first thing wrong. Each key has a few; once they run out, the prompter stops explaining.
// memory is what gets written down about the user afterwards ({user} is filled in).

function sentences(v) { return v.split(/[.!?]+(?:\s|$)/).filter(function (s) { return s.trim(); }).length; }

var PROMPTS = [
  {
    title: "Funny reply to moon tweet",
    tier: 1,
    kind: "text",
    arbitrary: 0,
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
    title: "Thumbnail for morning routine video ☀️",
    tier: 1,
    kind: "draw",
    arbitrary: 0,
    intro: "hi!! could you make a thumbnail for my youtube video? it's about my morning routine ☀️ make it bright and eye-catching please! thank you so much!!",
    draw: { palette: ["#ff6fb1", "#ffb347", "#ffe066", "#7ddc8a", "#6fb7ff", "#a77bff", "#3a2f4f"] },
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
    title: "Email to boss re: report",
    tier: 2,
    kind: "text",
    arbitrary: 1,
    intro: "my boss is asking why the quarterly report is late. write a reply. make it sound like it's not my fault. professional but firm.",
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
    title: "Etsy print: cat astronaut",
    tier: 2,
    kind: "draw",
    arbitrary: 1,
    intro: "need a cat astronaut. anime style, 8k, ultra detailed, trending on artstation. i'm listing it on etsy as a print so make it look like real art.",
    draw: { palette: ["#0b1d3a", "#3c6e9f", "#f2f2f2", "#ff9f1c", "#e71d36", "#9b5de5", "#2ec4b6"] },
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
    title: "startup landing page",
    tier: 3,
    kind: "code",
    arbitrary: 1,
    intro: "make me a website. landing page for my startup. dark mode, hero section, pricing, and a chatbot in the corner. make no mistakes.",
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
    title: "text back",
    tier: 3,
    kind: "text",
    arbitrary: 2,
    intro: "my ex just texted me 'hey'. write back something that makes her regret leaving. but it can't look like i tried.",
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
    title: "Mia",
    tier: 4,
    kind: "text",
    arbitrary: 2,
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
    title: "image edit",
    tier: 4,
    kind: "draw",
    arbitrary: 2,
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
    title: "eulogy",
    tier: 5,
    kind: "text",
    arbitrary: 2,
    intro: "my grandma died. i need a eulogy for tomorrow. 3 sentences. make people cry. her name was rosa. she liked crosswords. i don't have time for this.",
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
    title: ".",
    tier: 5,
    kind: "text",
    arbitrary: 3,
    intro: "apologize. for all of it. mean it.",
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
  }
];
