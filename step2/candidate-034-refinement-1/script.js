const SYMBOLS = ["🤖", "💸", "🧠", "🔥", "📉", "🪙"];
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const MAX_FEED_ITEMS = 6;
const STORAGE_KEY = "token-tug-casino-state-v2";

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
];

const tokenBalance = document.getElementById("tokenBalance");
const spinCost = document.getElementById("spinCost");
const aiMood = document.getElementById("aiMood");
const winRate = document.getElementById("winRate");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const message = document.getElementById("message");
const subMessage = document.getElementById("subMessage");
const resultBadge = document.getElementById("resultBadge");
const spinCount = document.getElementById("spinCount");
const bestPayout = document.getElementById("bestPayout");
const streakCount = document.getElementById("streakCount");
const roi = document.getElementById("roi");
const eventFeed = document.getElementById("eventFeed");
const feedItemTemplate = document.getElementById("feedItemTemplate");

const tripletPayouts = {
  "💸💸💸": 150,
  "🤖🤖🤖": 90,
  "🔥🔥🔥": 80,
  "🧠🧠🧠": 70,
  "📉📉📉": 45,
  "🪙🪙🪙": 60,
};

const spinMessages = {
  "💸💸💸": "Investor mode activated. The deck was vague, but the vibes were immaculate.",
  "🤖🤖🤖": "Three robots aligned. This absolutely counts as artificial general revenue.",
  "🔥🔥🔥": "Pure hype cycle. Nothing is shipping, yet everything is on fire in a premium way.",
  "🧠🧠🧠": "You matched three brains. Please enjoy several tokens and one unsolicited manifesto.",
  "📉📉📉": "A synchronized downturn. Strangely, the board still called it resilient.",
  "🪙🪙🪙": "Three coins. Real utility remains unclear, but the treasury looks fantastic.",
};

const nearMissLines = [
  "Two symbols matched, so the machine awarded a tiny retention incentive.",
  "Close enough for product analytics. A small bonus has been A/B tested into existence.",
  "The model almost understood the prompt. Here are some consolation tokens.",
];

const missLines = [
  "No match. The machine has converted your tokens into compute warmth.",
  "The reels improvised confidently and billed you for the privilege.",
  "That spin produced only thought leadership and a lower balance.",
  "Tokens spent successfully. Outcome quality remains in private beta.",
];

const feedLines = [
  "New feature: spinning faster now counts as innovation.",
  "Investor update: losses have been reframed as training data.",
  "Trust & safety note: the machine is 80% vibes, 20% CSS gradients.",
  "Changelog: added more tokens, removed accountability.",
  "Breaking: wallet health now measured in inspirational emojis.",
  "Roadmap: replace bugs with probabilistic personality.",
  "Pricing update: every lever pull now includes premium uncertainty.",
  "Community post: users report the machine feels weirdly realistic.",
];

function buildInitialState() {
  return {
    tokens: STARTING_TOKENS,
    totalSpent: 0,
    totalWon: 0,
    spinCount: 0,
    winCount: 0,
    bestPayout: 0,
    streak: 0,
    lastMood: "Overconfident",
    currentMessage: "Welcome, valued user. The machine is ready to monetize your curiosity.",
    currentSubMessage: "No tokens have been torched yet. Finance is uneasy about the lack of momentum.",
    badgeTone: "neutral",
    badgeLabel: "Market Open",
    feed: [
      {
        title: "Quarter initialized",
        detail: "Fresh credits issued. The roadmap remains mostly adjectives.",
        tone: "neutral",
      },
    ],
  };
}

function loadState() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return buildInitialState();
    }

    return {
      ...buildInitialState(),
      ...saved,
      feed: Array.isArray(saved.feed) && saved.feed.length > 0
        ? saved.feed.slice(0, MAX_FEED_ITEMS)
        : buildInitialState().feed,
    };
  } catch {
    return buildInitialState();
  }
}

const state = loadState();
let spinning = false;

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures and keep gameplay functional.
  }
}

function setBadge(tone, label) {
  state.badgeTone = tone;
  state.badgeLabel = label;
  resultBadge.className = `result-badge ${tone}`;
  resultBadge.textContent = label;
}

function setMessage(text, detail, tone, label) {
  state.currentMessage = text;
  state.currentSubMessage = detail;
  message.textContent = text;
  subMessage.textContent = detail;
  setBadge(tone, label);
}

function renderFeed() {
  eventFeed.innerHTML = "";
  state.feed.forEach((entry) => {
    const item = feedItemTemplate.content.firstElementChild.cloneNode(true);
    item.classList.add(entry.tone);
    item.querySelector(".feed-item-title").textContent = entry.title;
    item.querySelector(".feed-item-detail").textContent = entry.detail;
    eventFeed.append(item);
  });
}

function addFeedItem(title, detail, tone) {
  state.feed.unshift({ title, detail, tone });
  state.feed = state.feed.slice(0, MAX_FEED_ITEMS);
  renderFeed();
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getMood() {
  const net = state.totalWon - state.totalSpent;

  if (state.tokens < SPIN_COST) {
    return "Rate Limited";
  }

  if (state.streak >= 3 || net >= 80) {
    return "Series A Delirious";
  }

  if (state.winCount > 0 && net >= 0) {
    return "Overconfident";
  }

  if (state.spinCount >= 5 && state.winCount === 0) {
    return "Repositioning";
  }

  return "Pivoting";
}

function updateUi() {
  const currentRoi = state.totalSpent > 0
    ? ((state.totalWon - state.totalSpent) / state.totalSpent) * 100
    : 0;
  const currentWinRate = state.spinCount > 0
    ? (state.winCount / state.spinCount) * 100
    : 0;

  tokenBalance.textContent = String(state.tokens);
  spinCost.textContent = String(SPIN_COST);
  state.lastMood = getMood();
  aiMood.textContent = state.lastMood;
  winRate.textContent = formatPercent(currentWinRate);
  spinCount.textContent = String(state.spinCount);
  bestPayout.textContent = String(state.bestPayout);
  streakCount.textContent = String(state.streak);
  roi.textContent = formatPercent(currentRoi);

  spinButton.disabled = spinning || state.tokens < SPIN_COST;
  spinButton.textContent = spinning ? "Spinning..." : "Pull Lever";

  if (!spinning && state.tokens < SPIN_COST) {
    setMessage(
      "You are out of prompt credits. Please locate fresh optimism and reboot.",
      "Treasury has entered a values-first phase, which is a polite way to say the money is gone.",
      "loss",
      "Out of Runway"
    );
  }

  renderFeed();
}

function pulse(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function countMatches(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  return Math.max(...Object.values(counts));
}

function evaluateSpin(result) {
  const combo = result.join("");

  if (tripletPayouts[combo]) {
    return {
      payout: tripletPayouts[combo],
      tone: "win",
      label: "Jackpot",
      title: "Narrative breakout event",
      text: `${spinMessages[combo]} +${tripletPayouts[combo]} tokens.`,
      detail: `Gross burn is ${state.totalSpent + SPIN_COST} tokens. Investor relations is drafting a victory thread.`,
    };
  }

  if (countMatches(result) === 2) {
    return {
      payout: 20,
      tone: "win",
      label: "Near Miss",
      title: "Synergy rebate issued",
      text: `${nearMissLines[Math.floor(Math.random() * nearMissLines.length)]} +20 tokens.`,
      detail: "This outcome has already been reclassified as strong engagement.",
    };
  }

  return {
    payout: 0,
    tone: "loss",
    label: "Miss",
    title: "Compute converted to vibes",
    text: missLines[Math.floor(Math.random() * missLines.length)],
    detail: `Total burn will rise to ${state.totalSpent + SPIN_COST} tokens after this important learning experience.`,
  };
}

async function animateReel(reel, duration) {
  reel.classList.add("spinning");
  const start = performance.now();

  while (performance.now() - start < duration) {
    reel.textContent = getRandomSymbol();
    await sleep(90);
  }

  reel.classList.remove("spinning");
}

async function spin() {
  if (spinning || state.tokens < SPIN_COST) {
    return;
  }

  spinning = true;
  state.tokens -= SPIN_COST;
  saveState();
  updateUi();
  setMessage(
    "Spinning up the monetization engine...",
    "Please hold while the machine converts budget into strategic narrative.",
    "neutral",
    "Spinning"
  );
  pulse([30, 40, 30]);

  const finalResult = reels.map(() => getRandomSymbol());

  await Promise.all(
    reels.map(async (reel, index) => {
      await animateReel(reel, 700 + index * 220);
      reel.textContent = finalResult[index];
    })
  );

  const outcome = evaluateSpin(finalResult);
  state.spinCount += 1;
  state.totalSpent += SPIN_COST;
  state.tokens += outcome.payout;
  state.totalWon += outcome.payout;
  state.bestPayout = Math.max(state.bestPayout, outcome.payout);

  if (outcome.payout > 0) {
    state.winCount += 1;
    state.streak += 1;
  } else {
    state.streak = 0;
  }

  setMessage(outcome.text, outcome.detail, outcome.tone, outcome.label);
  addFeedItem(
    `${finalResult.join(" ")}  ${outcome.title}`,
    feedLines[Math.floor(Math.random() * feedLines.length)],
    outcome.tone
  );

  pulse(outcome.payout > 0 ? [60, 50, 90] : [25]);
  spinning = false;
  saveState();
  updateUi();
}

function resetGame() {
  const confirmed = window.confirm(
    "Reboot the economy and wipe all locally saved metrics?"
  );

  if (!confirmed) {
    return;
  }

  Object.assign(state, buildInitialState());
  spinning = false;
  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = SYMBOLS[index];
  });

  setMessage(
    "Economy restored. The machine once again believes in sustainable nonsense.",
    "Wallet refilled, history reset, and accountability sent back to backlog.",
    "win",
    "Rebooted"
  );
  saveState();
  updateUi();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    spin();
  }
});

message.textContent = state.currentMessage;
subMessage.textContent = state.currentSubMessage;
setBadge(state.badgeTone, state.badgeLabel);
updateUi();
