const STORAGE_KEY = "token-tumbler-9000-state";
const MAX_HISTORY = 8;

const symbols = [
  "Prompt Leak",
  "GPU Throttle",
  "Context Window",
  "Fine-Tune Debt",
  "Agent Swarm",
  "Hallucination",
  "Benchmark Theater",
  "Synthetic Hype",
  "Infinite Tokens",
  "Safety Patch",
  "Latency Spike",
  "VC Demo",
];

const expenses = [
  { name: "HyperScale Hallucination Cleanup", tag: "post-demo incident", cost: 320 },
  { name: "Alignment Consultant Retainer", tag: "vibes only", cost: 270 },
  { name: "Prompt Engineer Cape", tag: "enterprise edition", cost: 180 },
  { name: "GPU Fan Apology Basket", tag: "thermal diplomacy", cost: 210 },
  { name: "Context Window Stretching", tag: "physically impossible", cost: 260 },
  { name: "Thought Leader Fog Machine", tag: "launch event", cost: 150 },
  { name: "Synthetic Data Spa Day", tag: "rejuvenation", cost: 230 },
  { name: "AI Ethics Slide Deck", tag: "contains no ethics", cost: 200 },
];

const defaultState = {
  balance: 1200,
  spinCost: 120,
  jackpots: 0,
  lifetimeSpent: 0,
  muted: false,
  spinning: false,
  autospinsRemaining: 0,
  totalSpins: 0,
  winningSpins: 0,
  bestPayout: 0,
  winStreak: 0,
  bestWinStreak: 0,
  featuredExpense: expenses[0].name,
  latestNet: 0,
  recentSpins: [],
};

const reelNodes = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const balanceNode = document.getElementById("token-balance");
const spinCostNode = document.getElementById("spin-cost");
const jackpotNode = document.getElementById("jackpot-count");
const spinButton = document.getElementById("spin-button");
const autoSpinButton = document.getElementById("autospin-button");
const muteToggle = document.getElementById("mute-toggle");
const statusLine = document.getElementById("status-line");
const lastPayoutNode = document.getElementById("last-payout");
const spendTargetNode = document.getElementById("spend-target");
const heatLevelNode = document.getElementById("heat-level");
const lifetimeSpentNode = document.getElementById("lifetime-spent");
const expenseGrid = document.getElementById("expense-grid");
const expenseTemplate = document.getElementById("expense-template");
const historyList = document.getElementById("history-list");
const historyTemplate = document.getElementById("history-template");
const machinePanel = document.querySelector(".machine-panel");
const winRateNode = document.getElementById("win-rate");
const bestPayoutNode = document.getElementById("best-payout");
const streakBadgeNode = document.getElementById("streak-badge");
const spinsBadgeNode = document.getElementById("spins-badge");
const winningSpinsNode = document.getElementById("winning-spins");
const bestStreakNode = document.getElementById("best-streak");
const latestNetNode = document.getElementById("latest-net");

const audioContext = typeof window.AudioContext !== "undefined" ? new window.AudioContext() : null;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = loadState();

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatSignedTokens(value) {
  const formatted = formatTokens(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return "0";
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      spinning: false,
      autospinsRemaining: 0,
      recentSpins: Array.isArray(parsed.recentSpins) ? parsed.recentSpins.slice(0, MAX_HISTORY) : [],
    };
  } catch {
    return { ...defaultState };
  }
}

function persistState() {
  const snapshot = {
    ...state,
    spinning: false,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function renderExpenses() {
  expenseGrid.innerHTML = "";
  for (const item of expenses) {
    const fragment = expenseTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".expense-card");
    fragment.querySelector(".expense-name").textContent = item.name;
    fragment.querySelector(".expense-tag").textContent = item.tag;
    fragment.querySelector(".expense-cost").textContent = `${item.cost} t`;
    if (item.name === state.featuredExpense) {
      card.classList.add("expense-card-featured");
    }
    expenseGrid.appendChild(fragment);
  }
}

function renderHistory() {
  historyList.innerHTML = "";

  if (!state.recentSpins.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "history-empty";
    emptyState.textContent = "No spins logged yet. The ledger is clean, which is suspicious.";
    historyList.appendChild(emptyState);
    return;
  }

  for (const entry of state.recentSpins) {
    const fragment = historyTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".history-card");
    const outcomeClass = entry.win ? "is-win" : "is-loss";
    const netLabel = formatSignedTokens(entry.net);
    const headline = entry.jackpot
      ? `Jackpot on ${entry.symbols[0]}`
      : entry.win
        ? `${entry.symbols[0]} almost paid the cloud bill`
        : "Benchmark theater consumed another budget line";

    card.classList.add(outcomeClass);
    fragment.querySelector(".history-headline").textContent = headline;
    fragment.querySelector(".history-symbols").textContent = entry.symbols.join(" / ");
    fragment.querySelector(".history-net").textContent = `${netLabel} t`;
    fragment.querySelector(".history-outcome").textContent = `${formatTokens(entry.payout)} payout • ${entry.expense}`;
    historyList.appendChild(fragment);
  }
}

function deriveHeat(balance) {
  if (balance > 1500) return "Regrettably sentient";
  if (balance > 900) return "Mildly overfit";
  if (balance > 450) return "Thermally concerning";
  return "Investor update imminent";
}

function getWinRate() {
  if (!state.totalSpins) return 0;
  return Math.round((state.winningSpins / state.totalSpins) * 100);
}

function updateUi() {
  balanceNode.textContent = formatTokens(state.balance);
  spinCostNode.textContent = formatTokens(state.spinCost);
  jackpotNode.textContent = formatTokens(state.jackpots);
  lifetimeSpentNode.textContent = `${formatTokens(state.lifetimeSpent)} tokens`;
  winRateNode.textContent = `${getWinRate()}%`;
  bestPayoutNode.textContent = formatTokens(state.bestPayout);
  winningSpinsNode.textContent = formatTokens(state.winningSpins);
  bestStreakNode.textContent = formatTokens(state.bestWinStreak);
  latestNetNode.textContent = `${formatSignedTokens(state.latestNet)} tokens`;
  heatLevelNode.textContent = deriveHeat(state.balance);
  streakBadgeNode.textContent = `Streak: ${state.winStreak}`;
  spinsBadgeNode.textContent = `Spins: ${state.totalSpins}`;

  spinButton.disabled = state.spinning || state.balance < state.spinCost;
  autoSpinButton.disabled = state.spinning || state.balance < state.spinCost;
  spinButton.textContent = state.balance < state.spinCost ? "Out of Tokens" : `Spend ${state.spinCost} Tokens`;
  autoSpinButton.textContent = state.autospinsRemaining > 0 ? `Auto-Burn x${state.autospinsRemaining}` : "Auto-Burn x5";
  muteToggle.textContent = state.muted ? "Sound: Off" : "Sound: On";
  muteToggle.setAttribute("aria-pressed", String(state.muted));
}

function pulsePanel(className) {
  machinePanel.classList.remove("flash-win", "flash-lose");
  void machinePanel.offsetWidth;
  machinePanel.classList.add(className);
}

function playTone({ frequency, duration, type = "square", gain = 0.03 }) {
  if (state.muted || !audioContext) return;

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gain;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function playSpinNoise() {
  playTone({ frequency: 280, duration: 0.06, gain: 0.025 });
  window.setTimeout(() => playTone({ frequency: 420, duration: 0.08, gain: 0.025 }), 70);
  window.setTimeout(() => playTone({ frequency: 380, duration: 0.06, gain: 0.02 }), 140);
}

function playOutcomeNoise(isWin) {
  if (isWin) {
    playTone({ frequency: 523.25, duration: 0.12, type: "triangle", gain: 0.04 });
    window.setTimeout(() => playTone({ frequency: 659.25, duration: 0.12, type: "triangle", gain: 0.04 }), 100);
    window.setTimeout(() => playTone({ frequency: 783.99, duration: 0.18, type: "triangle", gain: 0.04 }), 200);
    return;
  }

  playTone({ frequency: 196, duration: 0.2, type: "sawtooth", gain: 0.035 });
}

function scoreResult(result) {
  const counts = result.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});
  const groups = Object.values(counts).sort((a, b) => b - a);

  if (groups[0] === 3) {
    return {
      payout: 900,
      status: `Jackpot. Three ${result[0]} reels. The AI achieved profitability by accident.`,
      win: true,
      jackpot: true,
    };
  }

  if (groups[0] === 2) {
    return {
      payout: 260,
      status: "Two-of-a-kind. Your model found synergy and immediately upsold you premium tokens.",
      win: true,
      jackpot: false,
    };
  }

  if (result.includes("Infinite Tokens")) {
    return {
      payout: 180,
      status: 'A fake abundance event. "Infinite Tokens" appeared, so you receive a very finite rebate.',
      win: true,
      jackpot: false,
    };
  }

  return {
    payout: 0,
    status: "No match. The machine interpreted your spin as a benchmark request and billed you anyway.",
    win: false,
    jackpot: false,
  };
}

function chooseExpense(payout) {
  const affordable = expenses.filter((item) => item.cost <= Math.max(150, payout + 60));
  return randomItem(affordable.length ? affordable : expenses);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function animateReel(node, finalValue, delay, duration) {
  await wait(prefersReducedMotion ? 0 : delay);
  node.classList.add("spinning");

  const tickMs = prefersReducedMotion ? 60 : 75;
  const totalTicks = Math.max(4, Math.round(duration / tickMs));

  for (let tick = 0; tick < totalTicks; tick += 1) {
    node.textContent = randomItem(symbols);
    await wait(tickMs);
  }

  node.classList.remove("spinning");
  node.textContent = finalValue;
}

function pushHistoryEntry(entry) {
  state.recentSpins.unshift(entry);
  state.recentSpins = state.recentSpins.slice(0, MAX_HISTORY);
}

async function spinOnce() {
  if (state.spinning || state.balance < state.spinCost) return;

  state.spinning = true;
  state.balance -= state.spinCost;
  state.lifetimeSpent += state.spinCost;
  statusLine.textContent = "Contacting the stochastic token treasury...";
  lastPayoutNode.textContent = "0";
  updateUi();
  playSpinNoise();

  const result = [randomItem(symbols), randomItem(symbols), randomItem(symbols)];
  await Promise.all(
    reelNodes.map((node, index) => animateReel(node, result[index], index * 140, 720 + index * 200))
  );

  const outcome = scoreResult(result);
  const expense = chooseExpense(outcome.payout);
  const net = outcome.payout - state.spinCost;

  state.totalSpins += 1;
  state.balance += outcome.payout;
  state.latestNet = net;
  state.bestPayout = Math.max(state.bestPayout, outcome.payout);
  state.featuredExpense = expense.name;
  spendTargetNode.textContent = expense.name;
  lastPayoutNode.textContent = `${formatTokens(outcome.payout)} tokens`;
  statusLine.textContent = outcome.status;

  if (outcome.win) {
    state.winningSpins += 1;
    state.winStreak += 1;
    state.bestWinStreak = Math.max(state.bestWinStreak, state.winStreak);
  } else {
    state.winStreak = 0;
  }

  if (outcome.jackpot) {
    state.jackpots += 1;
  }

  pushHistoryEntry({
    symbols: result,
    payout: outcome.payout,
    net,
    expense: expense.name,
    win: outcome.win,
    jackpot: outcome.jackpot,
  });

  pulsePanel(outcome.payout > 0 ? "flash-win" : "flash-lose");
  playOutcomeNoise(outcome.win);
  state.spinning = false;
  renderExpenses();
  renderHistory();
  updateUi();
  persistState();

  if (state.autospinsRemaining > 0) {
    state.autospinsRemaining -= 1;
    updateUi();

    if (state.balance >= state.spinCost && state.autospinsRemaining > 0) {
      window.setTimeout(spinOnce, prefersReducedMotion ? 120 : 420);
      return;
    }
  }

  state.autospinsRemaining = 0;
  updateUi();
  persistState();
}

function handleAutoSpin() {
  if (state.spinning || state.balance < state.spinCost) return;
  state.autospinsRemaining = 5;
  updateUi();
  persistState();
  spinOnce();
}

function handleKeydown(event) {
  if (event.repeat) return;

  const tagName = document.activeElement?.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || document.activeElement?.isContentEditable) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    spinOnce();
  }

  if (event.key.toLowerCase() === "a") {
    handleAutoSpin();
  }

  if (event.key.toLowerCase() === "m") {
    state.muted = !state.muted;
    updateUi();
    persistState();
  }
}

spinButton.addEventListener("click", () => {
  spinOnce();
});

autoSpinButton.addEventListener("click", () => {
  handleAutoSpin();
});

muteToggle.addEventListener("click", () => {
  state.muted = !state.muted;
  updateUi();
  persistState();
});

window.addEventListener("keydown", handleKeydown);

renderExpenses();
renderHistory();
updateUi();
spendTargetNode.textContent = state.featuredExpense;
