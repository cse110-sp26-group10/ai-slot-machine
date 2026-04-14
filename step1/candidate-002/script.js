const SYMBOLS = [
  "prompt",
  "hallucination",
  "synergy",
  "latency",
  "vibes",
  "fine-tune",
  "middleware",
  "tokens",
  "benchmark",
  "slop",
];

const DEFAULT_STATE = {
  tokens: 120,
  bestWin: 0,
};

const SPIN_COST = 15;
const STORAGE_KEY = "token-tugger-3000";

const reels = Array.from({ length: 3 }, (_, index) =>
  document.getElementById(`reel${index}`)
);

const tokenCount = document.getElementById("tokenCount");
const bestWin = document.getElementById("bestWin");
const spinCost = document.getElementById("spinCost");
const confidenceMeter = document.getElementById("confidenceMeter");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const toastTemplate = document.getElementById("toastTemplate");

let state = loadState();
let spinning = false;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE };
    }

    const parsed = JSON.parse(raw);
    return {
      tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : DEFAULT_STATE.tokens,
      bestWin: Number.isFinite(parsed.bestWin) ? parsed.bestWin : DEFAULT_STATE.bestWin,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function updateUi() {
  tokenCount.textContent = String(state.tokens);
  bestWin.textContent = String(state.bestWin);
  spinCost.textContent = String(SPIN_COST);
  confidenceMeter.value = Math.max(4, Math.min(99, Math.round((state.tokens / 120) * 100)));
  spinButton.disabled = spinning || state.tokens < SPIN_COST;

  if (state.tokens < SPIN_COST) {
    message.innerHTML =
      "Wallet empty. The model apologizes and recommends purchasing a larger context window.";
  }
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function animateReel(reel, duration) {
  reel.classList.add("spinning");
  const start = performance.now();

  while (performance.now() - start < duration) {
    reel.textContent = randomSymbol();
    await wait(85);
  }

  reel.classList.remove("spinning");
}

function scoreSpin(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const hasThree = values[0] === 3;
  const hasPair = values[0] === 2;
  const hallucinationBonus = results.includes("hallucination") ? 45 : 0;

  if (hasThree) {
    return {
      winnings: 90 + hallucinationBonus,
      tone: "jackpot",
      text: `Triple match. The machine fabricated confidence and paid you ${90 + hallucinationBonus} tokens.`,
    };
  }

  if (hasPair) {
    return {
      winnings: 30 + hallucinationBonus,
      tone: "pair",
      text: `Two symbols matched, which is basically state-of-the-art. You recover ${30 + hallucinationBonus} tokens.`,
    };
  }

  if (hallucinationBonus > 0) {
    return {
      winnings: hallucinationBonus,
      tone: "hallucination",
      text: "No alignment, but a wild hallucination slipped through compliance and dropped 45 tokens.",
    };
  }

  return {
    winnings: 0,
    tone: "miss",
    text: "The reels produced premium nonsense. Tokens gone. Insight pending.",
  };
}

function highlightWinners(results) {
  reels.forEach((reel, index) => {
    const matches = results.filter((symbol) => symbol === results[index]).length;
    reel.classList.toggle("winner", matches > 1);
  });
}

function announceToast(text) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = text;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

async function spin() {
  if (spinning || state.tokens < SPIN_COST) {
    return;
  }

  spinning = true;
  state.tokens -= SPIN_COST;
  reels.forEach((reel) => reel.classList.remove("winner"));
  updateUi();
  saveState();

  await Promise.all(
    reels.map((reel, index) => animateReel(reel, 750 + index * 220))
  );

  const results = reels.map(() => randomSymbol());
  reels.forEach((reel, index) => {
    reel.textContent = results[index];
  });

  highlightWinners(results);

  const outcome = scoreSpin(results);
  state.tokens += outcome.winnings;
  state.bestWin = Math.max(state.bestWin, outcome.winnings);
  message.textContent = outcome.text;

  if (outcome.tone === "jackpot") {
    announceToast("Jackpot: the benchmark chart is finally upward.");
  } else if (outcome.tone === "hallucination") {
    announceToast("Wild hallucination detected. Finance approved it anyway.");
  }

  saveState();
  updateUi();
  spinning = false;
  updateUi();
}

function resetGame() {
  state = { ...DEFAULT_STATE };
  saveState();
  reels.forEach((reel, index) => {
    reel.textContent = SYMBOLS[index];
    reel.classList.remove("winner");
  });
  message.textContent =
    "Wallet reset. New tokens acquired through totally sustainable venture funding.";
  announceToast("Fresh tokens minted.");
  updateUi();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

updateUi();
