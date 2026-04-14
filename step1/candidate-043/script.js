const SYMBOLS = [
  { text: "PROMPT LOOP", tier: "neutral" },
  { text: "GPU TEARS", tier: "loss" },
  { text: "TOKEN REFUND", tier: "win" },
  { text: "HYPE ROUND", tier: "neutral" },
  { text: "ETHICS PATCH", tier: "neutral" },
  { text: "SLIDES ONLY", tier: "loss" },
  { text: "BENCHMARK FLEX", tier: "win" },
  { text: "MOAT COPILOT", tier: "neutral" },
  { text: "SEED ROUND", tier: "win" },
  { text: "HALLUCINATED API", tier: "loss" },
  { text: "AGENT SWARM", tier: "neutral" },
  { text: "UNPAID INTERN ENERGY", tier: "loss" }
];

const STARTING_BALANCE = 600;
const STORAGE_KEY = "token-tycoon-9000-state";
const VISIBLE_ROWS = 3;
const SYMBOL_HEIGHT = 96;

const balanceEl = document.querySelector("#token-balance");
const bestBalanceEl = document.querySelector("#best-balance");
const spinCostEl = document.querySelector("#spin-cost");
const jackpotMessageEl = document.querySelector("#jackpot-message");
const resultLineEl = document.querySelector("#result-line");
const betRangeEl = document.querySelector("#bet-range");
const spinButtonEl = document.querySelector("#spin-button");
const resetButtonEl = document.querySelector("#reset-button");
const eventLogEl = document.querySelector("#event-log");
const machineEl = document.querySelector(".machine");
const reelEls = Array.from(document.querySelectorAll(".reel"));
const chipTemplate = document.querySelector("#reel-symbol-template");

const state = {
  balance: STARTING_BALANCE,
  bestBalance: STARTING_BALANCE,
  spinCost: Number(betRangeEl.value),
  spinning: false,
  audioContext: null
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    if (typeof saved.balance === "number") state.balance = saved.balance;
    if (typeof saved.bestBalance === "number") state.bestBalance = saved.bestBalance;
    if (typeof saved.spinCost === "number") state.spinCost = saved.spinCost;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      balance: state.balance,
      bestBalance: state.bestBalance,
      spinCost: state.spinCost
    })
  );
}

function createChip(symbol) {
  const fragment = chipTemplate.content.firstElementChild.cloneNode(true);
  fragment.textContent = symbol.text;
  fragment.dataset.tier = symbol.tier;
  if (symbol.tier === "win") fragment.style.background = "linear-gradient(135deg, rgba(47, 158, 68, 0.22), rgba(255, 183, 3, 0.16)), #fff";
  if (symbol.tier === "loss") fragment.style.background = "linear-gradient(135deg, rgba(176, 42, 55, 0.18), rgba(255, 122, 24, 0.14)), #fff";
  return fragment;
}

function fillReel(reelEl, offset = 0) {
  reelEl.innerHTML = "";
  const symbols = [...SYMBOLS];
  for (let i = 0; i < 20; i += 1) {
    const symbol = symbols[(i + offset) % symbols.length];
    reelEl.append(createChip(symbol));
  }
  reelEl.style.transform = "translateY(0)";
}

function initializeReels() {
  reelEls.forEach((reelEl, index) => fillReel(reelEl, index * 2));
}

function updateUi() {
  balanceEl.textContent = state.balance.toString();
  bestBalanceEl.textContent = state.bestBalance.toString();
  spinCostEl.textContent = state.spinCost.toString();
  betRangeEl.value = state.spinCost.toString();
  spinButtonEl.disabled = state.spinning || state.balance < state.spinCost;
  if (state.balance < state.spinCost) {
    jackpotMessageEl.textContent = "Wallet dry. The model suggests raising another round.";
  }
}

function addLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  eventLogEl.prepend(item);
  while (eventLogEl.children.length > 6) {
    eventLogEl.removeChild(eventLogEl.lastElementChild);
  }
}

function getAudioContext() {
  if (!window.AudioContext && !window.webkitAudioContext) return null;
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }
  return state.audioContext;
}

function playTone({ frequency, duration, type = "sine", gain = 0.04 }) {
  const context = getAudioContext();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gain;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.stop(context.currentTime + duration);
}

function rumble(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function weightedOutcome() {
  const roll = Math.random();
  if (roll < 0.08) {
    const jackpot = SYMBOLS.filter((symbol) => symbol.tier === "win");
    const pick = jackpot[Math.floor(Math.random() * jackpot.length)];
    return [pick, pick, pick];
  }
  if (roll < 0.25) {
    const anchor = randomSymbol();
    return [anchor, anchor, randomSymbol()];
  }
  return [randomSymbol(), randomSymbol(), randomSymbol()];
}

function evaluateOutcome(symbols) {
  const texts = symbols.map((symbol) => symbol.text);
  const allEqual = texts.every((text) => text === texts[0]);
  const counts = texts.reduce((map, text) => {
    map[text] = (map[text] || 0) + 1;
    return map;
  }, {});
  const hasPair = Object.values(counts).some((count) => count === 2);
  const winCount = symbols.filter((symbol) => symbol.tier === "win").length;
  const lossCount = symbols.filter((symbol) => symbol.tier === "loss").length;

  if (allEqual) {
    return {
      payout: state.spinCost * 8,
      label: `${texts[0]} x3. The machine just printed synthetic alpha.`
    };
  }

  if (hasPair && winCount >= 2) {
    return {
      payout: state.spinCost * 3,
      label: `Two premium buzzwords aligned. Venture capital has entered the chat.`
    };
  }

  if (winCount === 3) {
    return {
      payout: state.spinCost * 4,
      label: `All three reels smell like enterprise upsell.`
    };
  }

  if (lossCount >= 2) {
    return {
      payout: 0,
      label: `The model burned your budget to explain a typo with confidence.`
    };
  }

  if (hasPair) {
    return {
      payout: Math.round(state.spinCost * 1.4),
      label: `A partial match. The deck was mediocre, but the demo was polished.`
    };
  }

  if (winCount >= 1) {
    return {
      payout: Math.round(state.spinCost * 0.7),
      label: `A token coupon. Enough to buy half a benchmark chart.`
    };
  }

  return {
    payout: 0,
    label: `Nothing lined up. Please enjoy this artisanal pile of AI slop.`
  };
}

function animateReel(reelEl, symbols, duration) {
  reelEl.innerHTML = "";
  for (let i = 0; i < 16; i += 1) {
    reelEl.append(createChip(randomSymbol()));
  }
  symbols.forEach((symbol) => reelEl.append(createChip(symbol)));

  const finalOffset = (reelEl.children.length - VISIBLE_ROWS) * SYMBOL_HEIGHT;
  return reelEl.animate(
    [
      { transform: "translateY(0)" },
      { transform: `translateY(-${finalOffset}px)` }
    ],
    {
      duration,
      easing: "cubic-bezier(.12,.8,.14,1)",
      fill: "forwards"
    }
  ).finished;
}

function setMachineState(outcome) {
  machineEl.classList.remove("win-glow", "loss-glow");
  void machineEl.offsetWidth;
  machineEl.classList.add(outcome.payout > state.spinCost ? "win-glow" : "loss-glow");
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) return;

  state.spinning = true;
  state.balance -= state.spinCost;
  updateUi();
  jackpotMessageEl.textContent = "Crunching prompts, vaporizing context windows...";
  resultLineEl.textContent = "The reels are generating unreasonably expensive nonsense.";
  playTone({ frequency: 220, duration: 0.08, type: "square" });

  const results = weightedOutcome();
  const animations = reelEls.map((reelEl, index) => animateReel(reelEl, Array(VISIBLE_ROWS).fill(results[index]), 900 + index * 250));
  await Promise.all(animations);

  const outcome = evaluateOutcome(results);
  state.balance += outcome.payout;
  state.bestBalance = Math.max(state.bestBalance, state.balance);
  state.spinning = false;

  const delta = outcome.payout - state.spinCost;
  const signedDelta = delta >= 0 ? `+${delta}` : `${delta}`;
  const symbolSummary = results.map((symbol) => symbol.text).join(" / ");

  jackpotMessageEl.textContent = outcome.payout > state.spinCost
    ? "Liquidity event detected. Please pretend this is repeatable."
    : "Shareholders remain calm. Engineers are updating the roadmap.";
  resultLineEl.textContent = `${symbolSummary}. ${outcome.label} Net token swing: ${signedDelta}.`;
  addLog(`${symbolSummary} -> ${signedDelta} tokens. ${outcome.label}`);
  setMachineState(outcome);
  saveState();
  updateUi();

  if (outcome.payout > state.spinCost) {
    playTone({ frequency: 440, duration: 0.12, type: "triangle", gain: 0.06 });
    playTone({ frequency: 660, duration: 0.16, type: "triangle", gain: 0.05 });
    rumble([40, 30, 60]);
  } else {
    playTone({ frequency: 120, duration: 0.16, type: "sawtooth", gain: 0.035 });
    rumble(40);
  }
}

function resetWallet() {
  state.balance = STARTING_BALANCE;
  state.bestBalance = STARTING_BALANCE;
  machineEl.classList.remove("win-glow", "loss-glow");
  jackpotMessageEl.textContent = "Wallet reset. The machine is ready for a fresh batch of bad decisions.";
  resultLineEl.textContent = "Fresh capital secured. Time to convert tokens into executive optimism.";
  addLog("Wallet reset to 600 tokens. The cap table survives another day.");
  saveState();
  updateUi();
  initializeReels();
}

betRangeEl.addEventListener("input", (event) => {
  state.spinCost = Number(event.target.value);
  saveState();
  updateUi();
  jackpotMessageEl.textContent = `Spin cost updated to ${state.spinCost} tokens. Premium inference is never cheap.`;
});

spinButtonEl.addEventListener("click", spin);
resetButtonEl.addEventListener("click", resetWallet);

loadState();
initializeReels();
updateUi();
addLog("Machine online. Initial prompt budget loaded from local storage.");
