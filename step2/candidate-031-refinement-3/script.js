const SYMBOLS = [
  { text: "GPU", caption: "Capital-intensive flex", payout: 18 },
  { text: "AGI", caption: "Timeline aggressively vague", payout: 36 },
  { text: "LLM", caption: "Autocomplete with a keynote", payout: 16 },
  { text: "TOKEN", caption: "Treasury by PowerPoint", payout: 20 },
  { text: "HALLUCINATION", caption: "Demo-grade creativity", payout: 26 },
  { text: "PIVOT", caption: "Roadmap emergency exit", payout: 12 },
];

const CONFIG = {
  startingWallet: 150,
  spinCost: 15,
  pairPayout: 10,
  historyLimit: 8,
  storageKey: "vc-funding-simulator-state-v1",
  spinLoops: [10, 14, 18],
  reelDelayMs: 95,
  reelSettleMs: 120,
};

const DEFAULT_COPY = {
  pill: "Market Idle",
  result: "The machine is calibrated and ready to convert vibes into valuation.",
  summary: "No burn yet. Finance has briefly achieved inner peace.",
};

function createInitialState() {
  return {
    wallet: CONFIG.startingWallet,
    spinCount: 0,
    totalSpent: 0,
    totalWon: 0,
    winStreak: 0,
    bestHit: 0,
    soundOn: true,
    pendingCharge: false,
    reels: [0, 1, 0],
    statusTone: "neutral",
    statusLabel: DEFAULT_COPY.pill,
    resultLine: DEFAULT_COPY.result,
    summaryLine: DEFAULT_COPY.summary,
    history: [
      {
        tone: "neutral",
        title: "Launch memo",
        net: 0,
        message: "The board approved another AI slot machine because saying no would imply governance.",
        meta: "Simulator online",
      },
    ],
  };
}

function safeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function clampReels(reels) {
  const defaults = createInitialState().reels;

  if (!Array.isArray(reels) || reels.length !== 3) {
    return defaults.slice();
  }

  return reels.map((value, index) => (
    Number.isInteger(value) && value >= 0 && value < SYMBOLS.length ? value : defaults[index]
  ));
}

function loadState() {
  const fallback = createInitialState();

  try {
    const raw = window.localStorage.getItem(CONFIG.storageKey);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const restored = {
      ...fallback,
      ...parsed,
      wallet: Math.max(0, safeNumber(parsed.wallet, fallback.wallet)),
      spinCount: Math.max(0, safeNumber(parsed.spinCount, fallback.spinCount)),
      totalSpent: Math.max(0, safeNumber(parsed.totalSpent, fallback.totalSpent)),
      totalWon: Math.max(0, safeNumber(parsed.totalWon, fallback.totalWon)),
      winStreak: Math.max(0, safeNumber(parsed.winStreak, fallback.winStreak)),
      bestHit: Math.max(0, safeNumber(parsed.bestHit, fallback.bestHit)),
      soundOn: parsed.soundOn !== false,
      pendingCharge: Boolean(parsed.pendingCharge),
      reels: clampReels(parsed.reels),
      history: Array.isArray(parsed.history) && parsed.history.length > 0
        ? parsed.history.slice(0, CONFIG.historyLimit)
        : fallback.history,
    };

    if (restored.pendingCharge) {
      restored.wallet += CONFIG.spinCost;
      restored.totalSpent = Math.max(0, restored.totalSpent - CONFIG.spinCost);
      restored.pendingCharge = false;
      restored.statusTone = "neutral";
      restored.statusLabel = "Recovered";
      restored.resultLine = "The browser interrupted a spin, so the ledger quietly reversed the burn.";
      restored.summaryLine = "No result was recorded. Finance now calls this reliability engineering.";
      restored.history.unshift({
        tone: "neutral",
        title: "Interrupted spin refunded",
        net: 0,
        message: "A mid-spin refresh looked bad in the logs, so the simulator issued a graceful rollback.",
        meta: "Recovery event",
      });
      restored.history = restored.history.slice(0, CONFIG.historyLimit);
    }

    return restored;
  } catch {
    return fallback;
  }
}

const state = loadState();

const elements = {
  wallet: document.getElementById("wallet-value"),
  spinCost: document.getElementById("spin-cost-value"),
  mood: document.getElementById("mood-value"),
  spinCount: document.getElementById("spin-count-value"),
  bestHit: document.getElementById("best-hit-value"),
  winStreak: document.getElementById("win-streak-value"),
  pairPayout: document.getElementById("pair-payout-value"),
  statusPill: document.getElementById("status-pill"),
  resultLine: document.getElementById("result-line"),
  summaryLine: document.getElementById("summary-line"),
  trendLine: document.getElementById("trend-line"),
  historyList: document.getElementById("history-list"),
  spinButton: document.getElementById("spin-button"),
  resetButton: document.getElementById("reset-button"),
  soundButton: document.getElementById("sound-button"),
  machinePanel: document.querySelector(".machine-panel"),
  reels: [
    { symbol: document.getElementById("reel-0"), caption: document.getElementById("reel-0-caption") },
    { symbol: document.getElementById("reel-1"), caption: document.getElementById("reel-1-caption") },
    { symbol: document.getElementById("reel-2"), caption: document.getElementById("reel-2-caption") },
  ],
};

let isSpinning = false;

elements.spinCost.textContent = String(CONFIG.spinCost);
elements.pairPayout.textContent = `${CONFIG.pairPayout} token pity check`;

function saveState() {
  try {
    window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the app still runs in restricted contexts.
  }
}

function randomSymbolIndex() {
  return Math.floor(Math.random() * SYMBOLS.length);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getNetChange() {
  return state.totalWon - state.totalSpent;
}

function formatNetChange(amount) {
  if (amount > 0) {
    return `+${amount} tokens`;
  }

  if (amount < 0) {
    return `-${Math.abs(amount)} tokens`;
  }

  return "0 tokens";
}

function getMood() {
  const net = getNetChange();

  if (state.wallet < CONFIG.spinCost) {
    return "Bridge-round desperate";
  }

  if (state.winStreak >= 3 || net >= 45) {
    return "Series A feral";
  }

  if (net >= 0 && state.spinCount > 0) {
    return "Seed-round euphoric";
  }

  if (state.spinCount >= 5 && state.totalWon === 0) {
    return "Explaining churn as strategy";
  }

  if (net <= -45) {
    return "Pre-revenue but loud";
  }

  return "Pivoting with confidence";
}

function getTrendLine() {
  const net = getNetChange();

  if (state.spinCount === 0) {
    return "No spins yet. The roadmap remains unchallenged.";
  }

  if (state.winStreak >= 2) {
    return `${state.winStreak} wins in a row. Someone already drafted the TechCrunch quote.`;
  }

  if (state.bestHit >= 75) {
    return `Best hit so far: ${state.bestHit} tokens from a coincidence now labeled defensibility.`;
  }

  if (net > 0) {
    return `Treasury up ${net} tokens. Leadership has scheduled a thought-leadership dinner.`;
  }

  if (net < 0) {
    return `Treasury down ${Math.abs(net)} tokens. This is being reframed as aggressive learning.`;
  }

  return "Exactly flat, which somehow feels less believable than a jackpot.";
}

function setStatus({ tone, label, result, summary }) {
  state.statusTone = tone;
  state.statusLabel = label;
  state.resultLine = result;
  state.summaryLine = summary;

  elements.statusPill.className = `status-pill ${tone}`;
  elements.statusPill.textContent = label;
  elements.resultLine.textContent = result;
  elements.summaryLine.textContent = summary;

  elements.machinePanel.classList.remove("win", "loss");
  void elements.machinePanel.offsetWidth;
  if (tone === "win" || tone === "loss") {
    elements.machinePanel.classList.add(tone);
  }
}

function addHistoryEntry(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, CONFIG.historyLimit);
}

function renderHistory() {
  elements.historyList.innerHTML = "";

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = `history-item ${entry.tone}`;

    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = entry.meta;

    const title = document.createElement("strong");
    title.className = "history-title";
    title.textContent = entry.title;

    const message = document.createElement("p");
    message.className = "history-message";
    message.textContent = entry.message;

    const net = document.createElement("p");
    net.className = "history-net";
    net.textContent = `Net token change: ${formatNetChange(entry.net)}`;

    item.append(meta, title, message, net);
    elements.historyList.append(item);
  });
}

function renderReels(reelIndexes) {
  reelIndexes.forEach((symbolIndex, reelIndex) => {
    const symbol = SYMBOLS[symbolIndex];
    const reel = elements.reels[reelIndex];
    reel.symbol.textContent = symbol.text;
    reel.caption.textContent = `${symbol.caption} · ${symbol.payout} token upside`;
  });
}

function renderControls() {
  elements.spinButton.disabled = isSpinning || state.wallet < CONFIG.spinCost;
  elements.spinButton.textContent = isSpinning
    ? "Burning Tokens..."
    : state.wallet >= CONFIG.spinCost
      ? `Burn ${CONFIG.spinCost} Tokens`
      : "Wallet Empty";

  elements.soundButton.textContent = state.soundOn ? "Sound On" : "Sound Off";
  elements.soundButton.setAttribute("aria-pressed", String(state.soundOn));
}

function renderDashboard() {
  elements.wallet.textContent = String(state.wallet);
  elements.mood.textContent = getMood();
  elements.spinCount.textContent = String(state.spinCount);
  elements.bestHit.textContent = String(state.bestHit);
  elements.winStreak.textContent = String(state.winStreak);
  elements.trendLine.textContent = getTrendLine();

  renderReels(state.reels);
  renderHistory();
  renderControls();
}

function playTone(frequency, duration, type, gainValue) {
  if (!state.soundOn) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  if (!playTone.audioContext) {
    playTone.audioContext = new AudioContextClass();
  }

  const context = playTone.audioContext;
  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playSpinTick() {
  playTone(190, 0.07, "square", 0.03);
}

function playWinSound(bigWin) {
  playTone(bigWin ? 660 : 520, 0.14, "triangle", 0.05);
  window.setTimeout(() => playTone(bigWin ? 880 : 660, 0.18, "triangle", 0.05), 90);
}

function playLossSound() {
  playTone(170, 0.14, "sawtooth", 0.04);
  window.setTimeout(() => playTone(130, 0.18, "sawtooth", 0.035), 95);
}

function buildOutcome(reelIndexes) {
  const counts = new Map();

  reelIndexes.forEach((index) => {
    counts.set(index, (counts.get(index) || 0) + 1);
  });

  const tripleEntry = [...counts.entries()].find(([, count]) => count === 3);
  if (tripleEntry) {
    const symbol = SYMBOLS[tripleEntry[0]];
    const payout = symbol.payout * 3;
    return {
      tone: "win",
      label: "Securing VC Funding",
      payout,
      net: payout - CONFIG.spinCost,
      title: `Funding secured on ${symbol.text}`,
      result: `Securing VC Funding. Triple ${symbol.text} convinced investors this machine has moat.`,
      summary: `Spin cost ${CONFIG.spinCost}. Payout ${payout}. Legal is calling this a valuation event.`,
      message: `Three ${symbol.text} symbols aligned and instantly converted jargon into runway.`,
      bigWin: true,
    };
  }

  const pairEntry = [...counts.entries()].find(([, count]) => count === 2);
  if (pairEntry) {
    const symbol = SYMBOLS[pairEntry[0]];
    return {
      tone: "win",
      label: "Soft Commit",
      payout: CONFIG.pairPayout,
      net: CONFIG.pairPayout - CONFIG.spinCost,
      title: `Term sheet maybe for ${symbol.text}`,
      result: `Two ${symbol.text} symbols matched. A fund offered encouragement instead of conviction.`,
      summary: `Spin cost ${CONFIG.spinCost}. Rebate ${CONFIG.pairPayout}. The pitch deck survives another day.`,
      message: `A partial match triggered a pity check and several promising follow-up emails.`,
      bigWin: false,
    };
  }

  return {
    tone: "loss",
    label: "Model Collapse",
    payout: 0,
    net: -CONFIG.spinCost,
    title: "Demo imploded mid-pitch",
    result: "Model Collapse. The reels produced pure narrative debt and no usable hype.",
    summary: `Spin cost ${CONFIG.spinCost}. Payout 0. Leadership insists the failure was actually frontier behavior.`,
    message: "Nothing aligned except the excuses. Product now blames the dataset, infra, and moon phase.",
    bigWin: false,
  };
}

async function animateReel(reelIndex, finalSymbolIndex) {
  const reel = elements.reels[reelIndex];
  const loopCount = CONFIG.spinLoops[reelIndex];

  reel.symbol.classList.add("spinning");
  reel.symbol.parentElement.classList.remove("settled");

  for (let step = 0; step < loopCount; step += 1) {
    const preview = SYMBOLS[randomSymbolIndex()];
    reel.symbol.textContent = preview.text;
    reel.caption.textContent = `${preview.caption} · ${preview.payout} token upside`;
    playSpinTick();
    await wait(CONFIG.reelDelayMs + reelIndex * 18);
  }

  const finalSymbol = SYMBOLS[finalSymbolIndex];
  reel.symbol.classList.remove("spinning");
  reel.symbol.textContent = finalSymbol.text;
  reel.caption.textContent = `${finalSymbol.caption} · ${finalSymbol.payout} token upside`;
  reel.symbol.parentElement.classList.add("settled");
  await wait(CONFIG.reelSettleMs);
  reel.symbol.parentElement.classList.remove("settled");
}

async function animateSpin(finalReels) {
  for (let reelIndex = 0; reelIndex < finalReels.length; reelIndex += 1) {
    await animateReel(reelIndex, finalReels[reelIndex]);
  }
}

async function handleSpin() {
  if (isSpinning || state.wallet < CONFIG.spinCost) {
    return;
  }

  isSpinning = true;
  state.wallet -= CONFIG.spinCost;
  state.totalSpent += CONFIG.spinCost;
  state.pendingCharge = true;

  setStatus({
    tone: "neutral",
    label: "Burning Capital",
    result: "The reels are spinning up a fresh batch of investor-friendly nonsense.",
    summary: `Spin cost ${CONFIG.spinCost} booked immediately. Accountability remains asynchronous.`,
  });
  renderDashboard();
  saveState();

  const finalReels = Array.from({ length: 3 }, () => randomSymbolIndex());
  await animateSpin(finalReels);

  state.pendingCharge = false;
  state.spinCount += 1;
  state.reels = finalReels.slice();

  const outcome = buildOutcome(finalReels);
  if (outcome.payout > 0) {
    state.wallet += outcome.payout;
    state.totalWon += outcome.payout;
    state.winStreak += 1;
    state.bestHit = Math.max(state.bestHit, outcome.payout);
    playWinSound(outcome.bigWin);
  } else {
    state.winStreak = 0;
    playLossSound();
  }

  setStatus({
    tone: outcome.tone,
    label: outcome.label,
    result: outcome.result,
    summary: outcome.summary,
  });

  addHistoryEntry({
    tone: outcome.tone,
    title: outcome.title,
    net: outcome.net,
    message: outcome.message,
    meta: `Spin #${state.spinCount}`,
  });

  isSpinning = false;
  renderDashboard();
  saveState();
}

function resetGame() {
  const confirmed = window.confirm("Reset the wallet, stats, and saved spin history?");
  if (!confirmed) {
    return;
  }

  Object.assign(state, createInitialState());
  isSpinning = false;

  setStatus({
    tone: "neutral",
    label: "Fresh Quarter",
    result: "The wallet has been reset and the board has learned absolutely nothing.",
    summary: "Runway restored. The satire engine is ready for another avoidable cycle.",
  });

  renderDashboard();
  saveState();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  renderControls();
  saveState();
}

function handleKeydown(event) {
  if (event.code !== "Space" || event.repeat) {
    return;
  }

  const target = event.target;
  const isTypingContext = target instanceof HTMLElement
    && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

  if (isTypingContext) {
    return;
  }

  event.preventDefault();
  handleSpin();
}

elements.spinButton.addEventListener("click", handleSpin);
elements.resetButton.addEventListener("click", resetGame);
elements.soundButton.addEventListener("click", toggleSound);
document.addEventListener("keydown", handleKeydown);

setStatus({
  tone: state.statusTone,
  label: state.statusLabel,
  result: state.resultLine,
  summary: state.summaryLine,
});
renderDashboard();
saveState();
