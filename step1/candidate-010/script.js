const STORAGE_KEY = "token-burner-9000-state";
const DEFAULT_STATE = {
  balance: 250,
  bestWin: 0,
  streak: 0,
};

const SPIN_COST = 25;
const symbols = [
  "TOKEN",
  "GPU",
  "PROMPT",
  "UNICORN",
  "AGENT",
  "BENCHMARK",
  "HALLUCINATION",
  "CAPTCHA",
  "PIVOT",
];

const roastLines = {
  HALLUCINATION: [
    "The model sounded confident and still invented the citation.",
    "You hit HALLUCINATION. Investors are calling it product vision.",
    "A synthetic fact has entered the chat and requested more tokens.",
  ],
  nearMiss: [
    "Close. The machine respects your prompt but not enough to fund it.",
    "Two matched. That is basically a seed round in AI terms.",
    "The reels almost aligned, which counts as a demo according to startups.",
  ],
  lose: [
    "No payout. Please add 'be concise' and try again.",
    "Inference complete: the machine would like another 25 tokens.",
    "The reels chose chaos. Somewhere a benchmark was overfit.",
  ],
  win: [
    "Validation set approved. Tokens returned.",
    "The optimizer smiled upon you for one spin.",
    "A rare profitable inference occurred.",
  ],
  jackpot: [
    "Three clean matches. The board has approved more runway.",
    "Jackpot. Your prompt now has a valuation and a keynote slot.",
    "The machine emitted pure synthetic confidence and paid out.",
  ],
};

const balanceEl = document.querySelector("#token-balance");
const bestWinEl = document.querySelector("#best-win");
const spinCostEl = document.querySelector("#spin-cost");
const statusLineEl = document.querySelector("#status-line");
const historyLogEl = document.querySelector("#history-log");
const streakIndicatorEl = document.querySelector("#streak-indicator");
const jackpotBannerEl = document.querySelector("#jackpot-banner");
const spinButtonEl = document.querySelector("#spin-button");
const resetButtonEl = document.querySelector("#reset-button");
const reelEls = Array.from(document.querySelectorAll(".reel"));

let state = loadState();
let isSpinning = false;

spinCostEl.textContent = String(SPIN_COST);
render();
writeHistory("Session booted. Wallet synced from localStorage.");

spinButtonEl.addEventListener("click", spin);
resetButtonEl.addEventListener("click", resetWallet);

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { ...DEFAULT_STATE };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  balanceEl.textContent = String(state.balance);
  bestWinEl.textContent = String(state.bestWin);

  spinButtonEl.textContent =
    state.balance >= SPIN_COST ? `Burn ${SPIN_COST} Tokens` : "Out Of Tokens";
  spinButtonEl.disabled = isSpinning || state.balance < SPIN_COST;

  streakIndicatorEl.textContent =
    state.streak > 1 ? `Hot streak: ${state.streak} wins` : "No hot streak";
}

async function spin() {
  if (isSpinning || state.balance < SPIN_COST) {
    return;
  }

  isSpinning = true;
  state.balance -= SPIN_COST;
  updateStatus("Burning tokens. Please wait while the machine pretends to reason.");
  render();
  vibrate([30, 40, 30]);

  const results = [];
  const animations = reelEls.map((reelEl, index) => animateReel(reelEl, index, results));
  await Promise.all(animations);

  const summary = scoreSpin(results);
  state.balance += summary.payout;
  state.bestWin = Math.max(state.bestWin, summary.payout, state.bestWin);
  state.streak = summary.payout > SPIN_COST ? state.streak + 1 : 0;
  saveState();

  jackpotBannerEl.textContent = summary.banner;
  updateStatus(summary.message);
  writeHistory(`${results.join(" / ")} -> ${summary.history}`);
  highlightWin(summary.didWin);
  announce(summary);

  if (state.balance < SPIN_COST) {
    updateStatus("Wallet empty. The machine suggests finding a larger AI budget.");
  }

  isSpinning = false;
  render();
}

function animateReel(reelEl, index, results) {
  reelEl.classList.add("spinning");

  return new Promise((resolve) => {
    const totalTicks = 10 + index * 4;
    let tick = 0;

    const timer = window.setInterval(() => {
      reelEl.textContent = sample(symbols);
      tick += 1;

      if (tick >= totalTicks) {
        window.clearInterval(timer);
        reelEl.classList.remove("spinning");
        const finalSymbol = sample(symbols);
        reelEl.textContent = finalSymbol;
        results[index] = finalSymbol;
        resolve();
      }
    }, 85 + index * 20);
  });
}

function scoreSpin(results) {
  const counts = countSymbols(results);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3) {
    const specialPayouts = {
      TOKEN: 200,
      GPU: 150,
      UNICORN: 125,
    };
    const payout = specialPayouts[topSymbol] || 100;
    const message = pick(roastLines.jackpot);
    return {
      payout,
      didWin: true,
      banner: `Matched ${topSymbol} x3`,
      history: `Jackpot. +${payout} tokens.`,
      message,
    };
  }

  if (topCount === 2) {
    const matchingSymbol = topSymbol;
    const payout = 30;
    const message =
      matchingSymbol === "HALLUCINATION"
        ? pick(roastLines.HALLUCINATION)
        : pick(roastLines.nearMiss);

    return {
      payout,
      didWin: true,
      banner: `Partial match on ${matchingSymbol}`,
      history: `Matched 2 ${matchingSymbol}. +${payout} tokens.`,
      message,
    };
  }

  const hallCount = counts.HALLUCINATION || 0;
  const message = hallCount > 0 ? pick(roastLines.HALLUCINATION) : pick(roastLines.lose);

  return {
    payout: 0,
    didWin: false,
    banner: hallCount > 0 ? "Synthetic nonsense detected" : "No alignment",
    history: "No payout. -25 tokens.",
    message,
  };
}

function countSymbols(values) {
  return values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function highlightWin(didWin) {
  reelEls.forEach((reelEl) => {
    reelEl.classList.toggle("win", didWin);
  });

  if (didWin) {
    vibrate([60, 40, 80]);
  }
}

function updateStatus(text) {
  statusLineEl.textContent = text;
}

function writeHistory(text) {
  const item = document.createElement("li");
  item.textContent = text;
  historyLogEl.prepend(item);

  while (historyLogEl.children.length > 6) {
    historyLogEl.removeChild(historyLogEl.lastChild);
  }
}

function resetWallet() {
  if (isSpinning) {
    return;
  }

  state = { ...DEFAULT_STATE };
  saveState();
  jackpotBannerEl.textContent = "Wallet reset. Fresh tokens for fresh delusion.";
  updateStatus("Wallet restored to 250 tokens. The machine forgives your burn rate.");
  writeHistory("Wallet reset to default bankroll.");
  reelEls.forEach((reelEl, index) => {
    reelEl.textContent = symbols[index];
    reelEl.classList.remove("win");
  });
  render();
}

function sample(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function pick(values) {
  return sample(values);
}

function announce(summary) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    summary.didWin
      ? `Profit event. ${summary.history}`
      : "Token loss recorded. Better luck next prompt."
  );
  utterance.rate = 1.05;
  utterance.pitch = 0.85;
  window.speechSynthesis.speak(utterance);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
