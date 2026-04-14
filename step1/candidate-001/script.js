const SYMBOLS = [
  "TOKEN",
  "GPU",
  "404",
  "HYPE",
  "PROMPT",
  "CACHE",
  "BOT",
  "VC",
];

const STORAGE_KEY = "token-tugger-state";
const JACKPOT = 250;
const STARTING_TOKENS = 120;

const tokenCount = document.getElementById("token-count");
const spinCost = document.getElementById("spin-cost");
const jackpotValue = document.getElementById("jackpot-value");
const messageBoard = document.getElementById("message-board");
const spinButton = document.getElementById("spin-button");
const leverButton = document.getElementById("lever-button");
const resetButton = document.getElementById("reset-button");
const betRange = document.getElementById("bet-range");
const reels = [...document.querySelectorAll(".reel")];
const symbols = reels.map((reel) => reel.querySelector(".symbol"));
const streakPill = document.getElementById("streak-pill");
const feed = document.getElementById("event-feed");
const feedTemplate = document.getElementById("feed-item-template");

const snark = {
  jackpot: [
    "Triple TOKEN. The machine briefly respected you.",
    "A flawless token sweep. Venture capitalists are already writing fan fiction.",
    "Jackpot. The hype cycle has chosen a new champion and, tragically, it's you.",
  ],
  bigWin: [
    "Matching reels. Even the benchmark report looked honest for a second.",
    "Strong win. Somewhere, an AI founder just added 'economy architect' to their bio.",
    "Three matching symbols. The machine is clearly trying to raise its next round.",
  ],
  twoToken: [
    "Two TOKENs. Barely enough to buy another round of synthetic confidence.",
    "Partial token refund awarded. The machine calls this 'user retention.'",
    "Close enough for a rebound. Product managers will call it delight.",
  ],
  pity: [
    "Three different disasters. Enjoy a pity rebate and a recycled keynote slogan.",
    "Total chaos. The platform API has issued a small apology credit.",
    "Mismatch across the board. Even the model card looks embarrassed.",
  ],
  loss: [
    "No win. The machine thanks you for supporting inference costs.",
    "Bust. Your tokens have been reinvested into vibes and GPU heat.",
    "Loss recorded. Somewhere a chatbot just promised to do better next quarter.",
  ],
};

const state = loadState();
let spinning = false;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { tokens: STARTING_TOKENS, bet: 15, streak: 0, history: [] };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : STARTING_TOKENS,
      bet: Number.isFinite(parsed.bet) ? parsed.bet : 15,
      streak: Number.isFinite(parsed.streak) ? parsed.streak : 0,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 8) : [],
    };
  } catch {
    return { tokens: STARTING_TOKENS, bet: 15, streak: 0, history: [] };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setMessage(text) {
  messageBoard.textContent = text;
}

function updateStatus() {
  tokenCount.textContent = state.tokens;
  spinCost.textContent = state.bet;
  jackpotValue.textContent = JACKPOT;
  betRange.value = state.bet;

  spinButton.disabled = spinning || state.tokens < state.bet;
  leverButton.disabled = spinning || state.tokens < state.bet;

  if (state.streak >= 2) {
    streakPill.textContent = `${state.streak} hot wins`;
    streakPill.style.background = "rgba(140, 233, 154, 0.12)";
    streakPill.style.color = "var(--mint)";
  } else if (state.streak <= -2) {
    streakPill.textContent = `${Math.abs(state.streak)} spin skid`;
    streakPill.style.background = "rgba(255, 107, 107, 0.12)";
    streakPill.style.color = "var(--danger)";
  } else {
    streakPill.textContent = "Cold streak";
    streakPill.style.background = "rgba(255, 255, 255, 0.08)";
    streakPill.style.color = "var(--ink)";
  }
}

function addFeedEntry(text) {
  const fragment = feedTemplate.content.cloneNode(true);
  const time = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  fragment.querySelector(".feed-time").textContent = time;
  fragment.querySelector(".feed-text").textContent = text;
  feed.prepend(fragment);

  while (feed.children.length > 6) {
    feed.removeChild(feed.lastElementChild);
  }

  state.history = [...feed.querySelectorAll(".feed-text")].map((item) => item.textContent);
}

function restoreFeed() {
  state.history.slice().reverse().forEach((text) => addFeedEntry(text));
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function calculateOutcome(results, bet) {
  const [a, b, c] = results;
  const allEqual = a === b && b === c;
  const tokenCountInReels = results.filter((value) => value === "TOKEN").length;

  if (allEqual && a === "TOKEN") {
    return { payout: JACKPOT, type: "jackpot", message: choice(snark.jackpot) };
  }

  if (allEqual) {
    return { payout: 90, type: "bigWin", message: choice(snark.bigWin) };
  }

  if (tokenCountInReels >= 2) {
    return { payout: 45, type: "twoToken", message: choice(snark.twoToken) };
  }

  if (new Set(results).size === 3) {
    return { payout: 10, type: "pity", message: choice(snark.pity) };
  }

  return {
    payout: 0,
    type: "loss",
    message: `${choice(snark.loss)} You burned ${bet} tokens for science.`,
  };
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function pulseShell(className) {
  document.body.classList.remove("flash-win", "flash-lose");
  void document.body.offsetWidth;
  document.body.classList.add(className);
  setTimeout(() => document.body.classList.remove(className), 520);
}

function animateReel(reel, symbolNode, delay) {
  reel.classList.add("spinning");

  return new Promise((resolve) => {
    let ticks = 0;
    const interval = setInterval(() => {
      symbolNode.textContent = randomSymbol();
      ticks += 1;
    }, 90);

    setTimeout(() => {
      clearInterval(interval);
      reel.classList.remove("spinning");
      resolve();
    }, delay + 420);
  });
}

async function spin() {
  if (spinning || state.tokens < state.bet) {
    if (state.tokens < state.bet) {
      setMessage("Out of tokens. Reset the wallet and pretend the metrics still matter.");
    }
    return;
  }

  spinning = true;
  state.tokens -= state.bet;
  updateStatus();
  persistState();

  leverButton.classList.remove("pulled");
  void leverButton.offsetWidth;
  leverButton.classList.add("pulled");
  setMessage("Reels spinning. Please wait while the machine generates synthetic suspense.");
  vibrate([40, 30, 70]);

  const finalResults = [randomSymbol(), randomSymbol(), randomSymbol()];
  const animations = reels.map((reel, index) =>
    animateReel(reel, symbols[index], index * 180).then(() => {
      symbols[index].textContent = finalResults[index];
    })
  );

  await Promise.all(animations);

  const outcome = calculateOutcome(finalResults, state.bet);
  state.tokens += outcome.payout;
  state.streak = outcome.payout > 0 ? Math.max(1, state.streak + 1) : Math.min(-1, state.streak - 1);

  const summary = `${finalResults.join(" • ")} | ${outcome.message}`;
  setMessage(summary);
  addFeedEntry(summary);
  persistState();
  updateStatus();

  if (outcome.payout > 0) {
    pulseShell("flash-win");
    vibrate([90, 40, 120]);
  } else {
    pulseShell("flash-lose");
    vibrate(120);
  }

  spinning = false;
  updateStatus();
}

function resetGame() {
  state.tokens = STARTING_TOKENS;
  state.bet = 15;
  state.streak = 0;
  state.history = [];
  feed.innerHTML = "";
  setMessage("Wallet reset. Fresh tokens have been minted from pure denial.");
  addFeedEntry("System reset. A brand-new pile of speculative tokens has arrived.");
  persistState();
  updateStatus();
}

betRange.addEventListener("input", (event) => {
  state.bet = Number(event.target.value);
  setMessage(`Spin cost updated to ${state.bet}. The machine appreciates your increased burn rate.`);
  persistState();
  updateStatus();
});

spinButton.addEventListener("click", spin);
leverButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

restoreFeed();
updateStatus();
setMessage("Press spin to convert optimism into platform credits.");
