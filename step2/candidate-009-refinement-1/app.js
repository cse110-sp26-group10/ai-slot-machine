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

const state = {
  balance: 1200,
  spinCost: 120,
  jackpots: 0,
  lifetimeSpent: 0,
  muted: false,
  spinning: false,
  autospinsRemaining: 0,
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
const machinePanel = document.querySelector(".machine-panel");

const audioContext = typeof window.AudioContext !== "undefined" ? new window.AudioContext() : null;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderExpenses() {
  expenseGrid.innerHTML = "";
  for (const item of expenses) {
    const fragment = expenseTemplate.content.cloneNode(true);
    fragment.querySelector(".expense-name").textContent = item.name;
    fragment.querySelector(".expense-tag").textContent = item.tag;
    fragment.querySelector(".expense-cost").textContent = `${item.cost} t`;
    expenseGrid.appendChild(fragment);
  }
}

function updateUi() {
  balanceNode.textContent = formatTokens(state.balance);
  spinCostNode.textContent = formatTokens(state.spinCost);
  jackpotNode.textContent = formatTokens(state.jackpots);
  lifetimeSpentNode.textContent = `${formatTokens(state.lifetimeSpent)} tokens`;
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
  setTimeout(() => playTone({ frequency: 420, duration: 0.08, gain: 0.025 }), 70);
  setTimeout(() => playTone({ frequency: 380, duration: 0.06, gain: 0.02 }), 140);
}

function playOutcomeNoise(isWin) {
  if (isWin) {
    playTone({ frequency: 523.25, duration: 0.12, type: "triangle", gain: 0.04 });
    setTimeout(() => playTone({ frequency: 659.25, duration: 0.12, type: "triangle", gain: 0.04 }), 100);
    setTimeout(() => playTone({ frequency: 783.99, duration: 0.18, type: "triangle", gain: 0.04 }), 200);
    return;
  }

  playTone({ frequency: 196, duration: 0.2, type: "sawtooth", gain: 0.035 });
}

function deriveHeat(balance) {
  if (balance > 1500) return "Regrettably sentient";
  if (balance > 900) return "Mildly overfit";
  if (balance > 450) return "Thermally concerning";
  return "Investor update imminent";
}

function scoreResult(result) {
  const counts = result.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});
  const groups = Object.values(counts).sort((a, b) => b - a);

  if (groups[0] === 3) return { payout: 900, status: `Jackpot. Three ${result[0]} reels. The AI has achieved profitability by accident.`, win: true, jackpot: true };
  if (groups[0] === 2) return { payout: 260, status: `Two-of-a-kind. Your model found synergy and immediately upsold you premium tokens.`, win: true, jackpot: false };
  if (result.includes("Infinite Tokens")) return { payout: 180, status: `A fake abundance event. "Infinite Tokens" appeared, so you receive a very finite rebate.`, win: true, jackpot: false };

  return { payout: 0, status: `No match. The machine interpreted your spin as a benchmark request and billed you anyway.`, win: false, jackpot: false };
}

function chooseExpense(payout) {
  const affordable = expenses.filter((item) => item.cost <= Math.max(150, payout + 60));
  return randomItem(affordable.length ? affordable : expenses);
}

function animateReel(node, finalValue, delay) {
  return new Promise((resolve) => {
    node.classList.add("spinning");
    let ticks = 0;
    const interval = window.setInterval(() => {
      node.textContent = randomItem(symbols);
      ticks += 1;
      if (ticks > 10) {
        clearInterval(interval);
        node.classList.remove("spinning");
        node.textContent = finalValue;
        resolve();
      }
    }, 75);
    setTimeout(() => {}, delay);
  });
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
    reelNodes.map((node, index) =>
      new Promise((resolve) => {
        setTimeout(() => {
          animateReel(node, result[index], index * 120).then(resolve);
        }, index * 120);
      })
    )
  );

  const outcome = scoreResult(result);
  state.balance += outcome.payout;
  lastPayoutNode.textContent = `${formatTokens(outcome.payout)} tokens`;
  statusLine.textContent = outcome.status;
  heatLevelNode.textContent = deriveHeat(state.balance);

  if (outcome.jackpot) {
    state.jackpots += 1;
  }

  const expense = chooseExpense(outcome.payout);
  spendTargetNode.textContent = expense.name;

  if (outcome.payout > 0) {
    pulsePanel("flash-win");
  } else {
    pulsePanel("flash-lose");
  }

  playOutcomeNoise(outcome.win);
  state.spinning = false;
  updateUi();

  if (state.autospinsRemaining > 0) {
    state.autospinsRemaining -= 1;
    updateUi();
    if (state.balance >= state.spinCost) {
      setTimeout(spinOnce, 420);
      return;
    }
  }

  state.autospinsRemaining = 0;
  updateUi();
}

spinButton.addEventListener("click", () => {
  spinOnce();
});

autoSpinButton.addEventListener("click", () => {
  if (state.spinning || state.balance < state.spinCost) return;
  state.autospinsRemaining = 5;
  updateUi();
  spinOnce();
});

muteToggle.addEventListener("click", () => {
  state.muted = !state.muted;
  updateUi();
});

renderExpenses();
updateUi();
heatLevelNode.textContent = deriveHeat(state.balance);
