const symbols = [
  { label: "404", weight: 1, triple: 260, pair: 70 },
  { label: "GPU", weight: 1, triple: 240, pair: 65 },
  { label: "LOL", weight: 2, triple: 180, pair: 45 },
  { label: "LAG", weight: 2, triple: 160, pair: 35 },
  { label: "HYPE", weight: 2, triple: 150, pair: 30 },
  { label: "TOKEN", weight: 1, triple: 320, pair: 90 },
  { label: "BOT", weight: 2, triple: 170, pair: 40 },
  { label: "COPE", weight: 1, triple: 280, pair: 80 }
  { label: "GPU", weight: 1, triple: 300, pair: 70 },
  { label: "404", weight: 1, triple: 280, pair: 65 },
  { label: "HYPE", weight: 2, triple: 170, pair: 35 },
  { label: "BOT", weight: 2, triple: 160, pair: 30 },
  { label: "COPE", weight: 1, triple: 260, pair: 75 },
  { label: "LAG", weight: 2, triple: 150, pair: 28 },
  { label: "PROMPT", weight: 1, triple: 320, pair: 88 },
  { label: "TOKEN", weight: 1, triple: 360, pair: 95 }
];

const startingState = {
  balance: 120,
  cost: 15,
  balance: 150,
  cost: 20,
  lastWin: 0,
  streak: 0,
  spins: 0,
  bestWin: 0,
  netTotal: 0,
  chaos: 18,
  feed: ["The casino booted successfully and immediately requested more GPU budget."],
  spinning: false
};

const storageKey = "token-tumbler-state";
const storageKey = "token-trough-state";
const numberFormatter = new Intl.NumberFormat("en-US");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const roastMessages = {
  broke: [
    "You ran out of tokens. The AI has classified this as a user-funded training event.",
    "No tokens left. The machine suggests an exciting new monetization tier called 'please wait'."
    "You are out of tokens. The AI has promoted you to unpaid infrastructure.",
    "Wallet empty. The machine recommends upgrading to the Enterprise Desperation tier."
  ],
  loss: [
    "No match. The model spent your tokens on vibes and cache misses.",
    "A clean miss. Somewhere an AI startup just called this sustainable revenue.",
    "Nothing lined up. The reels generated pure enterprise-grade nonsense."
    "No match. Your tokens were reinvested into an unnecessarily cinematic demo.",
    "Complete miss. The AI called that burn 'customer education'.",
    "Nothing lined up. The machine converted your budget into executive optimism."
  ],
  pair: [
    "Two matched. The machine issued a partial refund to maintain the illusion of fairness.",
    "Close enough for a token rebate. Congratulations on your near-synergy.",
    "Pair landed. The AI returned a few tokens after an inspiring internal memo."
    "Two matched. You received a tiny refund and a very large buzzword deck.",
    "Pair hit. The machine returned some tokens to preserve user retention metrics.",
    "Partial payout. Somewhere a founder just whispered 'flywheel.'"
  ],
  triple: [
    "Jackpot. The machine has declared you temporarily aligned with shareholder value.",
    "Three of a kind. Enjoy this rare moment where the AI gives back more than a slogan.",
    "Perfect match. Even the algorithm had to admit that was kind of sick."
    "Jackpot. The machine briefly remembered what value feels like.",
    "Three of a kind. Even the AI had to stop posturing and pay you.",
    "Big win. The casino regrets this display of measurable usefulness."
  ],
  streak: [
    "Win streak active. The machine is preparing a think piece about your exceptional prompting.",
    "Another win. Venture capital can probably smell this run from orbit.",
    "You keep hitting. The AI has moved you from 'user' to 'concerning anomaly'."
    "Another win. The machine has begun a thread about your elite prompting aura.",
    "Streak alive. Investors are nodding without understanding why.",
    "You keep winning. The AI is preparing a defensive blog post."
  ],
  share: [
    "Your token tragedy has been packaged for social distribution.",
    "The brag report is ready. Please weaponize it responsibly."
  ]
};

const balanceElement = document.getElementById("balance");
const costElement = document.getElementById("cost");
const lastWinElement = document.getElementById("last-win");
const netTotalElement = document.getElementById("net-total");
const streakElement = document.getElementById("streak");
const spinCountElement = document.getElementById("spin-count");
const bestWinElement = document.getElementById("best-win");
const chaosBarElement = document.getElementById("chaos-bar");
const chaosLabelElement = document.getElementById("chaos-label");
const messageElement = document.getElementById("message");
const eventFeedElement = document.getElementById("event-feed");
const spinButton = document.getElementById("spin-button");
const shareButton = document.getElementById("share-button");
const resetButton = document.getElementById("reset-button");

const savedState = loadState();
      balance: Number.isFinite(parsed.balance) ? parsed.balance : startingState.balance,
      cost: Number.isFinite(parsed.cost) ? parsed.cost : startingState.cost,
      lastWin: Number.isFinite(parsed.lastWin) ? parsed.lastWin : startingState.lastWin,
      streak: Number.isFinite(parsed.streak) ? parsed.streak : startingState.streak
      streak: Number.isFinite(parsed.streak) ? parsed.streak : startingState.streak,
      spins: Number.isFinite(parsed.spins) ? parsed.spins : startingState.spins,
      bestWin: Number.isFinite(parsed.bestWin) ? parsed.bestWin : startingState.bestWin,
      netTotal: Number.isFinite(parsed.netTotal) ? parsed.netTotal : startingState.netTotal,
      chaos: Number.isFinite(parsed.chaos) ? parsed.chaos : startingState.chaos,
      feed: Array.isArray(parsed.feed) ? parsed.feed.slice(0, 6) : startingState.feed
    };
  } catch {
    return null;
    balance: state.balance,
    cost: state.cost,
    lastWin: state.lastWin,
    streak: state.streak
    streak: state.streak,
    spins: state.spins,
    bestWin: state.bestWin,
    netTotal: state.netTotal,
    chaos: state.chaos,
    feed: state.feed
  };

  try {
  return symbols[symbols.length - 1];
}

function getChaosLabel() {
  if (state.chaos < 26) {
    return "Calm-ish";
  }
  if (state.chaos < 51) {
    return "Pitch Deck";
  }
  if (state.chaos < 76) {
    return "Hallucinating";
  }
  return "Full Demo Mode";
}

function renderFeed() {
  eventFeedElement.innerHTML = "";
  state.feed.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    eventFeedElement.appendChild(item);
  });
}

function updateDashboard() {
  balanceElement.textContent = numberFormatter.format(state.balance);
  costElement.textContent = numberFormatter.format(state.cost);
  lastWinElement.textContent = numberFormatter.format(state.lastWin);
  netTotalElement.textContent = `${state.netTotal >= 0 ? "+" : ""}${numberFormatter.format(state.netTotal)}`;
  streakElement.textContent = numberFormatter.format(state.streak);
  spinCountElement.textContent = numberFormatter.format(state.spins);
  bestWinElement.textContent = numberFormatter.format(state.bestWin);
  chaosBarElement.style.width = `${state.chaos}%`;
  chaosLabelElement.textContent = getChaosLabel();

  spinButton.disabled = state.spinning || state.balance < state.cost;
  shareButton.disabled = state.spinning;
  if (state.balance < state.cost) {
    messageElement.textContent = pickRandomMessage("broke");
  }

  renderFeed();
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function pushFeed(message) {
  state.feed = [message, ...state.feed].slice(0, 6);
}

function celebrateWin(payout) {
  if ("vibrate" in navigator) {
    const pattern = payout >= 200 ? [120, 40, 120] : [70];
    navigator.vibrate(pattern);
    navigator.vibrate(payout >= 250 ? [100, 35, 100, 35, 180] : [70]);
  }

  if ("speechSynthesis" in window && payout >= 250) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Jackpot. The machine regrets your competence.");
    utterance.rate = 1;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function scoreResult(results) {
}

async function animateReels(finalSymbols) {
  for (const reel of reelElements) {
    reel.classList.add("spinning");
  }
  reelElements.forEach((reel) => reel.classList.add("spinning"));

  for (let step = 0; step < 10; step += 1) {
  const animationSteps = prefersReducedMotion ? 3 : 10;
  for (let step = 0; step < animationSteps; step += 1) {
    for (const reel of reelElements) {
      reel.textContent = weightedPick().label;
    }
    await sleep(90 + step * 18);
    await sleep(prefersReducedMotion ? 40 : 90 + step * 18);
  }

  for (let i = 0; i < reelElements.length; i += 1) {
    reelElements[i].textContent = finalSymbols[i].label;
    await sleep(150);
    await sleep(prefersReducedMotion ? 0 : 150);
  }

  for (const reel of reelElements) {
    reel.classList.remove("spinning");
  }
  reelElements.forEach((reel) => reel.classList.remove("spinning"));
}

async function spin() {

  state.spinning = true;
  state.balance -= state.cost;
  state.netTotal -= state.cost;
  state.lastWin = 0;
  messageElement.textContent = "Processing token burn... the machine is pretending this is innovation.";
  messageElement.textContent = "Burning tokens now. The machine is calling this a premium reasoning pass.";
  pushFeed(`Spent ${state.cost} tokens to request a miracle from the AI slot cabinet.`);
  updateDashboard();

  const results = [weightedPick(), weightedPick(), weightedPick()];
  const { payout, type } = scoreResult(results);
  state.balance += payout;
  state.lastWin = payout;
  state.spins += 1;
  state.bestWin = Math.max(state.bestWin, payout);
  state.netTotal += payout;
  state.streak = payout > 0 ? state.streak + 1 : 0;
  state.cost = Math.min(40, 15 + state.streak * 2);
  state.chaos = Math.max(8, Math.min(100, state.chaos + (payout > 0 ? -8 : 14)));
  state.cost = Math.min(55, 20 + state.streak * 3 + Math.floor(state.spins / 4));
  state.spinning = false;
  saveState();

  const baseMessage = state.streak > 1 && payout > 0
    ? pickRandomMessage("streak")
    : " Payout: 0 tokens.";

  messageElement.textContent = `${baseMessage}${summary}${payoutSummary}`;
  pushFeed(`${results.map((symbol) => symbol.label).join(" / ")} produced ${payout} tokens. The machine described it as "alignment."`);
  if (payout > 0) {
    celebrateWin(payout);
  }
