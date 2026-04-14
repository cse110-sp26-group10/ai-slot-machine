const SYMBOLS = ["🤖", "💸", "🧠", "🔥", "📉", "🪙"];
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const MAX_FEED_ITEMS = 6;
const STORAGE_KEY = "token-tug-casino-state";

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
];

const tokenBalance = document.getElementById("tokenBalance");
const aiMood = document.getElementById("aiMood");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const message = document.getElementById("message");
const eventFeed = document.getElementById("eventFeed");
const feedItemTemplate = document.getElementById("feedItemTemplate");

let tokens = STARTING_TOKENS;
let spinning = false;

const moods = [
  "Overconfident",
  "Pivoting",
  "Rate Limited",
  "Synergized",
  "Hallucinating",
  "Fundraising",
];

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

function updateUi() {
  tokenBalance.textContent = tokens;
  aiMood.textContent = moods[Math.floor(Math.random() * moods.length)];
  spinButton.disabled = spinning || tokens < SPIN_COST;

  if (tokens < SPIN_COST) {
    message.textContent = "You are out of prompt credits. Please locate fresh optimism and reboot.";
    message.className = "message lose";
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tokens,
    }),
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.tokens === "number") {
      tokens = saved.tokens;
    }
  } catch {
    tokens = STARTING_TOKENS;
  }
}

function addFeedItem(text) {
  const item = feedItemTemplate.content.firstElementChild.cloneNode(true);
  item.textContent = text;
  eventFeed.prepend(item);

  while (eventFeed.children.length > MAX_FEED_ITEMS) {
    eventFeed.removeChild(eventFeed.lastElementChild);
  }
}

function setMessage(text, tone) {
  message.textContent = text;
  message.className = `message ${tone}`.trim();
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
      text: `${spinMessages[combo]} +${tripletPayouts[combo]} tokens.`,
    };
  }

  if (countMatches(result) === 2) {
    return {
      payout: 20,
      tone: "win",
      text: `${nearMissLines[Math.floor(Math.random() * nearMissLines.length)]} +20 tokens.`,
    };
  }

  return {
    payout: 0,
    tone: "lose",
    text: missLines[Math.floor(Math.random() * missLines.length)],
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
  if (spinning || tokens < SPIN_COST) {
    return;
  }

  spinning = true;
  tokens -= SPIN_COST;
  saveState();
  updateUi();
  setMessage("Spinning up the monetization engine...", "");
  pulse([30, 40, 30]);

  const finalResult = reels.map(() => getRandomSymbol());

  await Promise.all(
    reels.map(async (reel, index) => {
      await animateReel(reel, 700 + index * 220);
      reel.textContent = finalResult[index];
    }),
  );

  const outcome = evaluateSpin(finalResult);
  tokens += outcome.payout;
  saveState();
  setMessage(outcome.text, outcome.tone);
  addFeedItem(
    `${finalResult.join(" ")} - ${feedLines[Math.floor(Math.random() * feedLines.length)]}`,
  );
  pulse(outcome.payout > 0 ? [60, 50, 90] : [25]);

  spinning = false;
  updateUi();
}

function resetGame() {
  tokens = STARTING_TOKENS;
  spinning = false;
  reels.forEach((reel, index) => {
    reel.classList.remove("spinning");
    reel.textContent = SYMBOLS[index];
  });
  setMessage(
    "Economy restored. The machine once again believes in sustainable nonsense.",
    "",
  );
  eventFeed.innerHTML = "";
  seedFeed();
  saveState();
  updateUi();
}

function seedFeed() {
  feedLines.slice(0, MAX_FEED_ITEMS).forEach((line, index) => {
    addFeedItem(`${["🤖 💸 🧠", "🔥 📉 🪙", "💸 💸 🤖", "🧠 🔥 📉", "🪙 🤖 💸", "🔥 🧠 🔥"][index]} - ${line}`);
  });
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

loadState();
seedFeed();
updateUi();
