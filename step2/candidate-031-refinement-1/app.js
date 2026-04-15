const SYMBOLS = [
  {
    icon: "\u{1F916}",
    label: "Model Hype",
    caption: "Narrative engine",
    payout: 18,
  },
  {
    icon: "\u{1FA99}",
    label: "Token Printer",
    caption: "Treasury expansion",
    payout: 22,
  },
  {
    icon: "\u{1F525}",
    label: "GPU Fire",
    caption: "Compute furnace",
    payout: 12,
  },
  {
    icon: "\u{1F9E0}",
    label: "Synthetic Insight",
    caption: "Thought leadership",
    payout: 30,
  },
  {
    icon: "\u{1F4B8}",
    label: "Burn Rate",
    caption: "Cash furnace",
    payout: 10,
  },
  {
    icon: "\u{1F4C9}",
    label: "Valuation Reset",
    caption: "Down-round detector",
    payout: 16,
  },
];

const SPIN_COST = 15;
const PAIR_PAYOUT = 12;
const MAX_HISTORY_ITEMS = 6;
const STORAGE_KEY = "token-burn-casino-state-v3";
const DEFAULT_RESULT = "Welcome back, visionary. The machine is ready to monetize your curiosity.";
const DEFAULT_SPEND = "No tokens wasted yet. A suspiciously efficient quarter.";

function buildInitialState() {
  return {
    tokens: 120,
    totalSpent: 0,
    totalWon: 0,
    spinCount: 0,
    winCount: 0,
    streak: 0,
    maxStreak: 0,
    bestPayout: 0,
    lastPayout: 0,
    currentResult: DEFAULT_RESULT,
    currentSpend: DEFAULT_SPEND,
    pillTone: "neutral",
    pillLabel: "Market Open",
    lastAnnouncement: `${DEFAULT_RESULT} ${DEFAULT_SPEND}`,
    pendingSpinCharge: false,
    reelIndexes: [0, 4, 1],
    history: [
      {
        title: "Quarter opened",
        detail: "Fresh tokens issued. Governance remains weak and vibes remain strong.",
        tone: "neutral",
        meta: "Forecast engine online",
      },
    ],
  };
}

function clampNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeReelIndexes(reelIndexes) {
  if (!Array.isArray(reelIndexes) || reelIndexes.length !== 3) {
    return buildInitialState().reelIndexes.slice();
  }

  return reelIndexes.map((index, reelPosition) => {
    if (!Number.isInteger(index) || index < 0 || index >= SYMBOLS.length) {
      return buildInitialState().reelIndexes[reelPosition];
    }

    return index;
  });
}

function loadState() {
  const initialState = buildInitialState();

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY);

    if (!savedState) {
      return initialState;
    }

    const parsedState = JSON.parse(savedState);
    const restoredState = {
      ...initialState,
      ...parsedState,
      tokens: clampNumber(parsedState.tokens, initialState.tokens),
      totalSpent: Math.max(0, clampNumber(parsedState.totalSpent, initialState.totalSpent)),
      totalWon: Math.max(0, clampNumber(parsedState.totalWon, initialState.totalWon)),
      spinCount: Math.max(0, clampNumber(parsedState.spinCount, initialState.spinCount)),
      winCount: Math.max(0, clampNumber(parsedState.winCount, initialState.winCount)),
      streak: Math.max(0, clampNumber(parsedState.streak, initialState.streak)),
      maxStreak: Math.max(0, clampNumber(parsedState.maxStreak, initialState.maxStreak)),
      bestPayout: Math.max(0, clampNumber(parsedState.bestPayout, initialState.bestPayout)),
      lastPayout: Math.max(0, clampNumber(parsedState.lastPayout, initialState.lastPayout)),
      pendingSpinCharge: Boolean(parsedState.pendingSpinCharge),
      reelIndexes: sanitizeReelIndexes(parsedState.reelIndexes),
      history: Array.isArray(parsedState.history) && parsedState.history.length > 0
        ? parsedState.history.slice(0, MAX_HISTORY_ITEMS)
        : initialState.history,
    };

    if (restoredState.pendingSpinCharge) {
      restoredState.tokens += SPIN_COST;
      restoredState.totalSpent = Math.max(0, restoredState.totalSpent - SPIN_COST);
      restoredState.pendingSpinCharge = false;
      restoredState.currentResult = "Interrupted forecast recovered. The machine refunded your unfinished spin.";
      restoredState.currentSpend = "No outcome was recorded, so the quarter quietly rewound the expense entry.";
      restoredState.pillTone = "neutral";
      restoredState.pillLabel = "Recovered";
      restoredState.lastAnnouncement = `${restoredState.currentResult} ${restoredState.currentSpend}`;
      restoredState.history.unshift({
        title: "Spin recovered",
        detail: "A page refresh interrupted the reels, so the ledger reversed the charge before finance noticed.",
        tone: "neutral",
        meta: "Reliability patch applied",
      });
      restoredState.history = restoredState.history.slice(0, MAX_HISTORY_ITEMS);
    }

    return restoredState;
  } catch {
    return initialState;
  }
}

const state = loadState();
let spinning = false;

const reels = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];

const reelLabels = [
  document.getElementById("reel-0-label"),
  document.getElementById("reel-1-label"),
  document.getElementById("reel-2-label"),
];

const tokenCount = document.getElementById("token-count");
const spinCostNode = document.getElementById("spin-cost");
const ruleSpinCost = document.getElementById("rule-spin-cost");
const pairPayoutNode = document.getElementById("pair-payout");
const moodNode = document.getElementById("mood");
const winRateNode = document.getElementById("win-rate");
const trendLine = document.getElementById("trend-line");
const spinCountNode = document.getElementById("spin-count");
const streakCountNode = document.getElementById("streak-count");
const bestPayoutNode = document.getElementById("best-payout");
const roiNode = document.getElementById("roi");
const resultLine = document.getElementById("result-line");
const spendLine = document.getElementById("spend-line");
const resultPill = document.getElementById("result-pill");
const historyList = document.getElementById("history-list");
const spinButton = document.getElementById("spin-button");
const speakStatus = document.getElementById("speak-status");
const resetButton = document.getElementById("reset-button");
const machineCard = document.querySelector(".machine-card");
const burstTemplate = document.getElementById("burst-template");

spinCostNode.textContent = String(SPIN_COST);
ruleSpinCost.textContent = `${SPIN_COST} tokens`;
pairPayoutNode.textContent = `${PAIR_PAYOUT}-token rebate`;

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the machine still works in restricted contexts.
  }
}

function randomSymbolIndex() {
  return Math.floor(Math.random() * SYMBOLS.length);
}

function addHistoryEntry(title, detail, tone, meta) {
  state.history.unshift({ title, detail, tone, meta });
  state.history = state.history.slice(0, MAX_HISTORY_ITEMS);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getNetTokens() {
  return state.totalWon - state.totalSpent;
}

function getMood() {
  const netTokens = getNetTokens();

  if (state.tokens < SPIN_COST) {
    return "Seeking emergency bridge round";
  }

  if (state.streak >= 3 || netTokens >= 45) {
    return "Delusionally liquid";
  }

  if (state.winCount > 0 && netTokens >= 0) {
    return "Cautiously bullish";
  }

  if (state.spinCount >= 4 && state.winCount === 0) {
    return "Rewriting the pitch deck";
  }

  if (netTokens <= -45) {
    return "Pre-revenue but loud";
  }

  return "Pivoting to enterprise";
}

function getTrendLine() {
  const netTokens = getNetTokens();

  if (state.spinCount === 0) {
    return "No spins yet. Analysts remain blissfully uninformed.";
  }

  if (state.streak >= 2) {
    return `Heat check: ${state.streak} straight payouts. Compliance has stopped answering email.`;
  }

  if (state.bestPayout >= 60) {
    return `Best quarter event: ${state.bestPayout} tokens from one aggressively monetized coincidence.`;
  }

  if (netTokens < 0) {
    return `Treasury is down ${Math.abs(netTokens)} tokens. Leadership is calling it a data acquisition phase.`;
  }

  if (netTokens > 0) {
    return `Treasury is up ${netTokens} tokens. Expect an unnecessary keynote before close of business.`;
  }

  return "The quarter is exactly flat, which somehow makes the dashboard more suspicious.";
}

function updateResultPill(tone, label) {
  resultPill.className = `result-pill ${tone}`;
  resultPill.textContent = label;
}

function renderHistory() {
  historyList.innerHTML = "";

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = `history-item ${entry.tone}`;

    if (entry.meta) {
      const meta = document.createElement("span");
      meta.className = "history-meta";
      meta.textContent = entry.meta;
      item.append(meta);
    }

    const title = document.createElement("strong");
    title.className = "history-title";
    title.textContent = entry.title;

    const detail = document.createElement("p");
    detail.className = "history-detail";
    detail.textContent = entry.detail;

    item.append(title, detail);
    historyList.append(item);
  });
}

function renderReels(reelIndexes) {
  reelIndexes.forEach((symbolIndex, reelIndex) => {
    const symbol = SYMBOLS[symbolIndex];
    reels[reelIndex].textContent = symbol.icon;
    reelLabels[reelIndex].textContent = `${symbol.caption} · ${symbol.payout} token symbol`;
  });
}

function updateHud() {
  const roi = state.totalSpent > 0 ? (getNetTokens() / state.totalSpent) * 100 : 0;
  const winRate = state.spinCount > 0 ? (state.winCount / state.spinCount) * 100 : 0;

  tokenCount.textContent = String(state.tokens);
  moodNode.textContent = getMood();
  winRateNode.textContent = formatPercent(winRate);
  trendLine.textContent = getTrendLine();
  spinCountNode.textContent = String(state.spinCount);
  streakCountNode.textContent = String(state.streak);
  bestPayoutNode.textContent = String(state.bestPayout);
  roiNode.textContent = formatPercent(roi);

  spinButton.disabled = spinning || state.tokens < SPIN_COST;
  spinButton.textContent = spinning
    ? "Running the forecast engine..."
    : state.tokens >= SPIN_COST
      ? `Spend ${SPIN_COST} tokens to spin`
      : "Wallet empty. Please invent fresh demand.";

  renderReels(state.reelIndexes);
  renderHistory();
}

function setMessage(resultText, spendText, tone, pillLabel) {
  state.currentResult = resultText;
  state.currentSpend = spendText;
  state.pillTone = tone;
  state.pillLabel = pillLabel;
  state.lastAnnouncement = `${resultText} ${spendText}`;

  resultLine.textContent = resultText;
  spendLine.textContent = spendText;
  updateResultPill(tone, pillLabel);

  machineCard.classList.remove("win", "loss");
  void machineCard.offsetWidth;
  if (tone === "win" || tone === "loss") {
    machineCard.classList.add(tone);
  }
}

function burstCoins(count) {
  for (let index = 0; index < count; index += 1) {
    const token = burstTemplate.content.firstElementChild.cloneNode(true);
    token.style.setProperty("--x", `${window.innerWidth / 2}px`);
    token.style.setProperty("--y", `${window.innerHeight / 2}px`);
    token.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    token.style.setProperty("--dy", `${-80 - Math.random() * 180}px`);
    document.body.appendChild(token);
    token.addEventListener("animationend", () => token.remove(), { once: true });
  }
}

function speakLatestResult() {
  if (!("speechSynthesis" in window)) {
    setMessage(
      "Your browser declined the executive narration package.",
      "Even the platform APIs are drawing a line under the AI upsell.",
      "loss",
      "Muted"
    );
    saveState();
    updateHud();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.lastAnnouncement);
  utterance.rate = 1.02;
  utterance.pitch = 1.08;
  window.speechSynthesis.speak(utterance);
}

function maybeCelebrate(isBigWin) {
  if ("vibrate" in navigator) {
    navigator.vibrate(isBigWin ? [120, 50, 120, 50, 200] : [90, 40, 90]);
  }
}

function getTripleMatch(symbol) {
  const payout = symbol.payout * 3;
  return {
    payout,
    tone: "win",
    pillLabel: "Jackpot",
    resultText: `Jackpot: triple ${symbol.label}. The board marked ${payout} freshly minted tokens as product-market fit.`,
    spendText: `Spin fee: ${SPIN_COST}. Payout: ${payout}. Net quarter delta: ${getNetTokens() + payout} tokens before anyone audits the deck.`,
    historyTitle: "Triple-match liquidity event",
    historyDetail: `${symbol.label} lined up three times and generated ${payout} tokens plus immediate founder confidence.`,
    historyMeta: "Full payout approved",
    burstCount: 10,
    bigWin: true,
  };
}

function getPairMatch(symbol) {
  return {
    payout: PAIR_PAYOUT,
    tone: "win",
    pillLabel: "Rebate",
    resultText: `Two ${symbol.label} symbols aligned. Finance issued a ${PAIR_PAYOUT}-token rebate and called it AI synergy.`,
    spendText: `Spin fee: ${SPIN_COST}. Rebate: ${PAIR_PAYOUT}. Net result: -${SPIN_COST - PAIR_PAYOUT} tokens for a very expensive lesson in optimism.`,
    historyTitle: "Synergy rebate booked",
    historyDetail: `A two-symbol match returned ${PAIR_PAYOUT} tokens, which the dashboard insists counts as momentum.`,
    historyMeta: "Partial recovery only",
    burstCount: 5,
    bigWin: false,
  };
}

function getMissResult() {
  return {
    payout: 0,
    tone: "loss",
    pillLabel: "Miss",
    resultText: "No match. The forecast engine confidently delivered vibes instead of value.",
    spendText: `Spin fee: ${SPIN_COST}. Payout: 0. Net quarter delta: ${getNetTokens()} tokens and falling with conviction.`,
    historyTitle: "Forecast missed",
    historyDetail: "The reels produced no usable alignment, but management remains deeply committed to the roadmap.",
    historyMeta: "Full burn recognized",
    burstCount: 0,
    bigWin: false,
  };
}

function resolveSpin(resultIndexes) {
  const counts = new Map();

  resultIndexes.forEach((symbolIndex) => {
    counts.set(symbolIndex, (counts.get(symbolIndex) || 0) + 1);
  });

  state.spinCount += 1;
  state.pendingSpinCharge = false;
  state.reelIndexes = resultIndexes.slice();

  let outcome = getMissResult();

  const tripleMatchIndex = Array.from(counts.entries()).find(([, count]) => count === 3)?.[0];
  const pairMatchIndex = Array.from(counts.entries()).find(([, count]) => count === 2)?.[0];

  if (typeof tripleMatchIndex === "number") {
    outcome = getTripleMatch(SYMBOLS[tripleMatchIndex]);
  } else if (typeof pairMatchIndex === "number") {
    outcome = getPairMatch(SYMBOLS[pairMatchIndex]);
  }

  if (outcome.payout > 0) {
    state.tokens += outcome.payout;
    state.totalWon += outcome.payout;
    state.winCount += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.bestPayout = Math.max(state.bestPayout, outcome.payout);
    state.lastPayout = outcome.payout;
    burstCoins(outcome.burstCount);
    maybeCelebrate(outcome.bigWin);
  } else {
    state.lastPayout = 0;
    state.streak = 0;
  }

  setMessage(
    outcome.resultText,
    outcome.spendText,
    outcome.tone,
    outcome.pillLabel
  );

  addHistoryEntry(
    outcome.historyTitle,
    outcome.historyDetail,
    outcome.tone,
    outcome.historyMeta
  );

  saveState();
}

function animateSpin() {
  const finalResults = reels.map(() => randomSymbolIndex());

  reels.forEach((reel, reelIndex) => {
    reel.classList.add("spinning");

    const interval = window.setInterval(() => {
      const randomIndex = randomSymbolIndex();
      const symbol = SYMBOLS[randomIndex];
      reel.textContent = symbol.icon;
      reelLabels[reelIndex].textContent = `${symbol.caption} · ${symbol.payout} token symbol`;
    }, 90 + reelIndex * 30);

    window.setTimeout(() => {
      window.clearInterval(interval);
      reel.classList.remove("spinning");

      if (reelIndex === reels.length - 1) {
        spinning = false;
        resolveSpin(finalResults);
        updateHud();
      }
    }, 900 + reelIndex * 450);
  });
}

function handleSpin() {
  if (spinning || state.tokens < SPIN_COST) {
    return;
  }

  state.tokens -= SPIN_COST;
  state.totalSpent += SPIN_COST;
  state.pendingSpinCharge = true;
  spinning = true;

  setMessage(
    "Spinning the reels. Please wait while the machine converts cash burn into marketable confidence.",
    `Spin fee recorded: ${SPIN_COST} tokens. The ledger is now committed even if the thesis is not.`,
    "neutral",
    "Spinning"
  );
  saveState();
  updateHud();
  animateSpin();
}

function resetGame() {
  const confirmed = window.confirm("Reset the quarter and wipe all saved hype metrics?");

  if (!confirmed) {
    return;
  }

  Object.assign(state, buildInitialState());
  spinning = false;

  setMessage(
    "Fresh quarter initialized. The board approved another avoidable experiment.",
    "Wallet restored, metrics cleared, and accountability gently postponed.",
    "neutral",
    "Reset"
  );
  saveState();
  updateHud();
}

function handleKeydown(event) {
  if (event.code !== "Space" || event.repeat) {
    return;
  }

  const target = event.target;
  const isTypingContext = target instanceof HTMLElement
    && (target.isContentEditable
      || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

  if (isTypingContext) {
    return;
  }

  event.preventDefault();
  handleSpin();
}

spinButton.addEventListener("click", handleSpin);
speakStatus.addEventListener("click", speakLatestResult);
resetButton.addEventListener("click", resetGame);
document.addEventListener("keydown", handleKeydown);

if (!("speechSynthesis" in window)) {
  speakStatus.disabled = true;
  speakStatus.textContent = "Voice pack unavailable";
}

updateResultPill(state.pillTone, state.pillLabel);
resultLine.textContent = state.currentResult;
spendLine.textContent = state.currentSpend;
updateHud();
saveState();
