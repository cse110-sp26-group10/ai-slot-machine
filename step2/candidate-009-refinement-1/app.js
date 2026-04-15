const STORAGE_KEY = "token-tumbler-9000-state";
const MAX_HISTORY = 8;
const AUTO_SPIN_BATCH = 5;
const SPIN_COST = 120;

const PAYOUTS = {
  jackpot: 960,
  matchTwo: 240,
  infiniteTokens: 160,
};

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
  spinCost: SPIN_COST,
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

function clampNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function sanitizeHistoryEntry(entry) {
  if (!entry || !Array.isArray(entry.symbols)) {
    return null;
  }

  return {
    symbols: entry.symbols.slice(0, 3).map((symbol) => String(symbol)),
    payout: Math.max(0, clampNumber(entry.payout)),
    net: clampNumber(entry.net),
    expense: typeof entry.expense === "string" ? entry.expense : expenses[0].name,
    win: Boolean(entry.win),
    jackpot: Boolean(entry.jackpot),
    reason: typeof entry.reason === "string" ? entry.reason : "Budget volatility event",
  };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw);
    const recentSpins = Array.isArray(parsed.recentSpins)
      ? parsed.recentSpins.map(sanitizeHistoryEntry).filter(Boolean).slice(0, MAX_HISTORY)
      : [];

    return {
      ...defaultState,
      ...parsed,
      balance: Math.max(0, clampNumber(parsed.balance, defaultState.balance)),
      spinCost: SPIN_COST,
      jackpots: Math.max(0, clampNumber(parsed.jackpots)),
      lifetimeSpent: Math.max(0, clampNumber(parsed.lifetimeSpent)),
      muted: Boolean(parsed.muted),
      spinning: false,
      autospinsRemaining: 0,
      totalSpins: Math.max(0, clampNumber(parsed.totalSpins)),
      winningSpins: Math.max(0, clampNumber(parsed.winningSpins)),
      bestPayout: Math.max(0, clampNumber(parsed.bestPayout)),
      winStreak: Math.max(0, clampNumber(parsed.winStreak)),
      bestWinStreak: Math.max(0, clampNumber(parsed.bestWinStreak)),
      featuredExpense: expenses.some((item) => item.name === parsed.featuredExpense)
        ? parsed.featuredExpense
        : defaultState.featuredExpense,
      latestNet: clampNumber(parsed.latestNet),
      recentSpins,
    };
  } catch {
    return { ...defaultState };
  }
}

function persistState() {
  try {
    const snapshot = {
      ...state,
      spinCost: SPIN_COST,
      spinning: false,
      autospinsRemaining: 0,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    statusLine.textContent = "Local storage declined the paperwork. Session continues in temporary memory.";
  }
}

function getWinRate() {
  if (!state.totalSpins) {
    return 0;
  }
  return Math.round((state.winningSpins / state.totalSpins) * 100);
}

function deriveHeat(balance) {
  if (balance >= 1600) return "Regrettably sentient";
  if (balance >= 900) return "Mildly overfit";
  if (balance >= 400) return "Thermally concerning";
  return "Investor update imminent";
}

function describeFeaturedExpense(expense) {
  if (expense.cost <= SPIN_COST * 1.5) {
    return `${expense.name} is back on the budget because optimism remains unregulated.`;
  }
  if (expense.cost <= SPIN_COST * 2) {
    return `${expense.name} just cleared procurement with zero follow-up questions.`;
  }
  return `${expense.name} is the latest executive priority despite obvious warning signs.`;
}

function getHeadline(entry) {
  if (entry.jackpot) {
    return `Full refund on ${entry.symbols[0]}`;
  }
  if (entry.win) {
    return entry.reason;
  }
  return "The machine logged another strategic burn";
}

function renderExpenses() {
  expenseGrid.innerHTML = "";

  for (const item of expenses) {
    const fragment = expenseTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".expense-card");
    fragment.querySelector(".expense-name").textContent = item.name;
    fragment.querySelector(".expense-tag").textContent = item.tag;
    fragment.querySelector(".expense-cost").textContent = `${formatTokens(item.cost)} t`;

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
    emptyState.textContent = "No spins logged yet. Finance loves a blank ledger, which is why it cannot be trusted.";
    historyList.appendChild(emptyState);
    return;
  }

  for (const entry of state.recentSpins) {
    const fragment = historyTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".history-card");
    const statusText = entry.jackpot
      ? "full refund"
      : entry.win
        ? "partial refund"
        : "fully billed";

    card.classList.add(entry.win ? "is-win" : "is-loss");
    if (entry.jackpot) {
      card.classList.add("is-jackpot");
    }

    fragment.querySelector(".history-headline").textContent = getHeadline(entry);
    fragment.querySelector(".history-symbols").textContent = entry.symbols.join(" / ");
    fragment.querySelector(".history-net").textContent = `${formatSignedTokens(entry.net)} t`;
    fragment.querySelector(".history-outcome").textContent = `${formatTokens(entry.payout)} rebate | ${statusText}`;
    historyList.appendChild(fragment);
  }
}

function updateUi() {
  balanceNode.textContent = formatTokens(state.balance);
  spinCostNode.textContent = formatTokens(SPIN_COST);
  jackpotNode.textContent = formatTokens(state.jackpots);
  lifetimeSpentNode.textContent = `${formatTokens(state.lifetimeSpent)} tokens`;
  winRateNode.textContent = `${getWinRate()}%`;
  bestPayoutNode.textContent = formatTokens(state.bestPayout);
  winningSpinsNode.textContent = formatTokens(state.winningSpins);
  bestStreakNode.textContent = formatTokens(state.bestWinStreak);
  latestNetNode.textContent = `${formatSignedTokens(state.latestNet)} tokens`;
  heatLevelNode.textContent = deriveHeat(state.balance);
  streakBadgeNode.textContent = `Heater: ${state.winStreak}`;
  spinsBadgeNode.textContent = `Spins: ${state.totalSpins}`;

  const canAffordSpin = state.balance >= SPIN_COST;
  spinButton.disabled = state.spinning || !canAffordSpin;
  autoSpinButton.disabled = state.spinning || !canAffordSpin;
  spinButton.textContent = canAffordSpin ? `Burn ${SPIN_COST} Tokens` : "Budget Exhausted";
  autoSpinButton.textContent = state.autospinsRemaining > 0
    ? `Auto-Burn queued: ${state.autospinsRemaining}`
    : `Auto-Burn x${AUTO_SPIN_BATCH}`;
  muteToggle.textContent = state.muted ? "Sound: Off" : "Sound: On";
  muteToggle.setAttribute("aria-pressed", String(state.muted));
}

function pulsePanel(className) {
  machinePanel.classList.remove("flash-win", "flash-lose");
  void machinePanel.offsetWidth;
  machinePanel.classList.add(className);
}

function playTone({ frequency, duration, type = "square", gain = 0.03 }) {
  if (state.muted || !audioContext) {
    return;
  }

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

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function animateReel(node, finalValue, delay, duration) {
  await wait(prefersReducedMotion ? 0 : delay);
  node.classList.add("spinning");

  const tickMs = prefersReducedMotion ? 50 : 75;
  const totalTicks = Math.max(4, Math.round(duration / tickMs));

  for (let tick = 0; tick < totalTicks; tick += 1) {
    node.textContent = randomItem(symbols);
    await wait(tickMs);
  }

  node.classList.remove("spinning");
  node.textContent = finalValue;
}

function countMatches(result) {
  return result.reduce((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function scoreResult(result) {
  const counts = countMatches(result);
  const highestGroup = Math.max(...Object.values(counts));

  if (highestGroup === 3) {
    return {
      payout: PAYOUTS.jackpot,
      status: `Full refund. Three ${result[0]} reels convinced the treasury this was a legitimate research expense.`,
      win: true,
      jackpot: true,
      reason: `All three reels aligned on ${result[0]}`,
    };
  }

  if (highestGroup === 2) {
    const matchedSymbol = Object.keys(counts).find((symbol) => counts[symbol] === 2) || result[0];
    return {
      payout: PAYOUTS.matchTwo,
      status: `Partial refund approved. Two ${matchedSymbol} reels were enough to fool procurement.`,
      win: true,
      jackpot: false,
      reason: `Two ${matchedSymbol} reels triggered a refund`,
    };
  }

  if (result.includes("Infinite Tokens")) {
    return {
      payout: PAYOUTS.infiniteTokens,
      status: 'Abundance theater detected. "Infinite Tokens" appeared, so the machine issued a tiny rebate and called it scale.',
      win: true,
      jackpot: false,
      reason: '"Infinite Tokens" showed up and finance panicked',
    };
  }

  return {
    payout: 0,
    status: "No refund. The machine classified your spin as a benchmarking exercise and billed the full amount.",
    win: false,
    jackpot: false,
    reason: "No matching reels survived the audit",
  };
}

function chooseExpense(payout) {
  const budgetWindow = Math.max(160, payout + 40);
  const shortlist = expenses.filter((item) => item.cost <= budgetWindow);
  return randomItem(shortlist.length ? shortlist : expenses);
}

function pushHistoryEntry(entry) {
  state.recentSpins.unshift(entry);
  state.recentSpins = state.recentSpins.slice(0, MAX_HISTORY);
}

function finalizeSpin(result, outcome) {
  const expense = chooseExpense(outcome.payout);
  const net = outcome.payout - SPIN_COST;

  state.totalSpins += 1;
  state.balance += outcome.payout;
  state.latestNet = net;
  state.bestPayout = Math.max(state.bestPayout, outcome.payout);
  state.featuredExpense = expense.name;

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

  spendTargetNode.textContent = expense.name;
  lastPayoutNode.textContent = `${formatTokens(outcome.payout)} tokens`;
  statusLine.textContent = `${outcome.status} ${describeFeaturedExpense(expense)}`;

  pushHistoryEntry({
    symbols: result,
    payout: outcome.payout,
    net,
    expense: expense.name,
    win: outcome.win,
    jackpot: outcome.jackpot,
    reason: outcome.reason,
  });

  pulsePanel(outcome.win ? "flash-win" : "flash-lose");
  playOutcomeNoise(outcome.win);
}

async function spinOnce() {
  if (state.spinning || state.balance < SPIN_COST) {
    return;
  }

  state.spinning = true;
  state.balance -= SPIN_COST;
  state.lifetimeSpent += SPIN_COST;
  lastPayoutNode.textContent = "0 tokens";
  statusLine.textContent = "Charging the speculative compute budget...";
  updateUi();
  playSpinNoise();

  const result = [randomItem(symbols), randomItem(symbols), randomItem(symbols)];

  await Promise.all(
    reelNodes.map((node, index) => animateReel(node, result[index], index * 140, 680 + index * 180))
  );

  finalizeSpin(result, scoreResult(result));
  state.spinning = false;
  renderExpenses();
  renderHistory();
  updateUi();

  if (state.autospinsRemaining > 0) {
    state.autospinsRemaining -= 1;

    if (state.autospinsRemaining > 0 && state.balance >= SPIN_COST) {
      updateUi();
      window.setTimeout(() => {
        spinOnce();
      }, prefersReducedMotion ? 120 : 420);
      return;
    }

    if (state.autospinsRemaining > 0 && state.balance < SPIN_COST) {
      statusLine.textContent = "Auto-burn halted. The machine ran out of budget before it ran out of confidence.";
    }
  }

  state.autospinsRemaining = 0;
  updateUi();
  persistState();
}

function queueAutoSpin() {
  if (state.spinning || state.balance < SPIN_COST) {
    return;
  }

  state.autospinsRemaining = AUTO_SPIN_BATCH;
  statusLine.textContent = `Auto-burn armed for ${AUTO_SPIN_BATCH} spins. Legal has not reviewed this workflow.`;
  updateUi();
  spinOnce();
}

function toggleMute() {
  state.muted = !state.muted;
  updateUi();
  persistState();
}

function handleKeydown(event) {
  if (event.repeat) {
    return;
  }

  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.isContentEditable) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    spinOnce();
  }

  if (event.key.toLowerCase() === "a") {
    queueAutoSpin();
  }

  if (event.key.toLowerCase() === "m") {
    toggleMute();
  }
}

spinButton.addEventListener("click", spinOnce);
autoSpinButton.addEventListener("click", queueAutoSpin);
muteToggle.addEventListener("click", toggleMute);
window.addEventListener("keydown", handleKeydown);

renderExpenses();
renderHistory();
updateUi();
spendTargetNode.textContent = state.featuredExpense;
lastPayoutNode.textContent = `${formatTokens(Math.max(0, state.latestNet + SPIN_COST))} tokens`;
