const BASE_SPIN_COST = 15;
const STARTING_TOKENS = 120;
const HISTORY_LIMIT = 5;
const STORAGE_KEY = "token-burn-casino-state";
const SYMBOLS = ["🤖", "🔥", "💸", "💎", "🧠", "📉", "💀"];

const payouts = {
  "🤖🤖🤖": 80,
  "🔥🔥🔥": 60,
  "💎💎💎": 50,
  "🧠🧠🧠": 45,
  "💸💸💸": 30,
  "📉📉📉": 25,
};

const pairMessages = [
  "Two reels aligned. The machine is calling it a strategic partnership.",
  "A matching pair. Product says that's basically profitability.",
  "Mild success detected. Expect a keynote about it by sunset.",
];

const failMessages = [
  "No match. The AI assures you the loss is actually a premium feature.",
  "The reels produced a visionary mess. Investors are strangely excited.",
  "Nothing lined up. Great demo energy, questionable business model.",
  "Total chaos. The machine recommends buying more tokens and reframing the outcome.",
];

const moods = [
  "Confidently Wrong",
  "Disruptively Synergized",
  "Unreasonably Optimistic",
  "Prompt-Engineered",
  "Benchmark Adjacent",
];

const tokenBalance = document.querySelector("#token-balance");
const spinCostValue = document.querySelector("#spin-cost");
const machineMood = document.querySelector("#machine-mood");
const statusMessage = document.querySelector("#status-message");
const profitValue = document.querySelector("#profit-value");
const jackpotCount = document.querySelector("#jackpot-count");
const spinCountValue = document.querySelector("#spin-count");
const winRateValue = document.querySelector("#win-rate");
const lastDeltaValue = document.querySelector("#last-delta");
const historyList = document.querySelector("#history-list");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const soundButton = document.querySelector("#sound-button");
const overclockButton = document.querySelector("#overclock-button");
const reelElements = [
  document.querySelector("#reel-1"),
  document.querySelector("#reel-2"),
  document.querySelector("#reel-3"),
];

const initialState = {
  tokens: STARTING_TOKENS,
  isSpinning: false,
  soundEnabled: true,
  overclockEnabled: false,
  totalSpins: 0,
  totalWins: 0,
  jackpots: 0,
  lastDelta: 0,
  history: ["Boot sequence complete. No embarrassing outcomes yet."],
  currentSymbols: ["🤖", "🔥", "💸"],
};

let state = loadState();
let audioContext;

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function currentSpinCost() {
  return BASE_SPIN_COST * (state.overclockEnabled ? 2 : 1);
}

function clampHistory(history) {
  return history.slice(0, HISTORY_LIMIT);
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tokens: state.tokens,
        soundEnabled: state.soundEnabled,
        overclockEnabled: state.overclockEnabled,
        totalSpins: state.totalSpins,
        totalWins: state.totalWins,
        jackpots: state.jackpots,
        lastDelta: state.lastDelta,
        history: state.history,
        currentSymbols: state.currentSymbols,
      })
    );
  } catch (error) {
    // Ignore storage failures so the cabinet still works in restricted contexts.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...initialState };
    }

    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      history:
        Array.isArray(parsed.history) && parsed.history.length
          ? clampHistory(parsed.history)
          : initialState.history,
      currentSymbols:
        Array.isArray(parsed.currentSymbols) && parsed.currentSymbols.length === 3
          ? parsed.currentSymbols
          : initialState.currentSymbols,
    };
  } catch (error) {
    return { ...initialState };
  }
}

function formatSignedNumber(value) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function addHistoryEntry(message) {
  state.history = clampHistory([message, ...state.history]);
}

function updateDisplay() {
  const profit = state.tokens - STARTING_TOKENS;
  const winRate = state.totalSpins === 0
    ? 0
    : Math.round((state.totalWins / state.totalSpins) * 100);

  tokenBalance.textContent = String(state.tokens);
  spinCostValue.textContent = String(currentSpinCost());
  profitValue.textContent = formatSignedNumber(profit);
  jackpotCount.textContent = String(state.jackpots);
  spinCountValue.textContent = String(state.totalSpins);
  winRateValue.textContent = `${winRate}%`;
  lastDeltaValue.textContent = formatSignedNumber(state.lastDelta);
  soundButton.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
  overclockButton.textContent = `Overclock ${state.overclockEnabled ? "On" : "Off"}`;
  overclockButton.setAttribute("aria-pressed", String(state.overclockEnabled));
  spinButton.textContent = `Spin For “Productivity” (${currentSpinCost()} tokens)`;
  spinButton.disabled = state.isSpinning || state.tokens < currentSpinCost();

  historyList.innerHTML = "";
  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    historyList.appendChild(item);
  });

  reelElements.forEach((reel, index) => {
    reel.textContent = state.currentSymbols[index];
  });
}

function setMessage(message) {
  statusMessage.textContent = message;
  machineMood.textContent = randomItem(moods);
  saveState();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOutcome(symbols) {
  const joined = symbols.join("");
  const uniqueCount = new Set(symbols).size;
  const hasSkull = symbols.includes("💀");
  const multiplier = state.overclockEnabled ? 2 : 1;

  if (payouts[joined]) {
    return {
      delta: payouts[joined] * multiplier,
      message: `Jackpot: ${joined} delivers ${payouts[joined] * multiplier} fresh tokens and unbearable founder confidence.`,
      win: true,
      jackpot: true,
    };
  }

  if (uniqueCount === 2) {
    return {
      delta: 20 * multiplier,
      message: `${randomItem(pairMessages)} ${state.overclockEnabled ? "Overclock doubled the spin doctoring." : ""}`.trim(),
      win: true,
      jackpot: false,
    };
  }

  if (hasSkull) {
    return {
      delta: -10 * multiplier,
      message: `A skull slipped into the stack. The machine charged a hallucination penalty${state.overclockEnabled ? " at enterprise scale" : ""}.`,
      win: false,
      jackpot: false,
    };
  }

  return {
    delta: 0,
    message: randomItem(failMessages),
    win: false,
    jackpot: false,
  };
}

function ensureAudio() {
  if (!state.soundEnabled) {
    return null;
  }

  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }
    audioContext = new Context();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function beep(frequency, duration, type = "sine", gainValue = 0.03) {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

async function playSpinAudio(result) {
  if (!state.soundEnabled) {
    return;
  }

  beep(320, 0.08, "square");
  await sleep(90);
  beep(380, 0.08, "square");
  await sleep(90);
  beep(
    result.win ? (state.overclockEnabled ? 760 : 620) : 180,
    result.win ? 0.22 : 0.16,
    result.win ? "triangle" : "sawtooth"
  );
}

async function spin() {
  if (state.isSpinning || state.tokens < currentSpinCost()) {
    if (state.tokens < currentSpinCost()) {
      setMessage("You are out of prompt tokens. Reboot the startup to keep pretending.");
    }
    return;
  }

  state.isSpinning = true;
  state.tokens -= currentSpinCost();
  updateDisplay();
  setMessage("Inference in progress. Please admire the theatrical latency.");
  reelElements.forEach((reel) => reel.classList.remove("win", "penalty"));
  reelElements.forEach((reel) => reel.classList.add("spinning"));

  const finalSymbols = [];

  for (let i = 0; i < reelElements.length; i += 1) {
    const reel = reelElements[i];
    for (let tick = 0; tick < 9 + i * 3; tick += 1) {
      reel.textContent = randomSymbol();
      await sleep(80);
    }
    const symbol = randomSymbol();
    reel.textContent = symbol;
    finalSymbols.push(symbol);
  }

  reelElements.forEach((reel) => reel.classList.remove("spinning"));

  const result = getOutcome(finalSymbols);
  state.tokens += result.delta;
  state.currentSymbols = finalSymbols;
  state.totalSpins += 1;
  state.lastDelta = result.delta - currentSpinCost();

  if (result.win) {
    state.totalWins += 1;
  }

  if (result.jackpot) {
    state.jackpots += 1;
  }

  addHistoryEntry(`${finalSymbols.join(" ")} -> ${formatSignedNumber(state.lastDelta)} net`);
  updateDisplay();
  setMessage(`${result.message} Net change: ${formatSignedNumber(state.lastDelta)} tokens after burn fees.`);

  if (result.win) {
    reelElements.forEach((reel) => {
      if (
        finalSymbols.filter((symbol) => symbol === reel.textContent).length > 1 ||
        new Set(finalSymbols).size === 1
      ) {
        reel.classList.add("win");
      }
    });
  }

  if (finalSymbols.includes("💀")) {
    reelElements.forEach((reel) => {
      if (reel.textContent === "💀") {
        reel.classList.add("penalty");
      }
    });
  }

  await playSpinAudio(result);

  state.isSpinning = false;
  updateDisplay();
  saveState();
}

function resetGame() {
  state = {
    ...initialState,
    currentSymbols: Array.from({ length: 3 }, () => randomSymbol()),
  };

  reelElements.forEach((reel) => {
    reel.classList.remove("spinning", "win", "penalty");
  });

  updateDisplay();
  setMessage("Fresh runway secured. Time to convert more tokens into applause.");
  saveState();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);
soundButton.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  updateDisplay();
  setMessage(
    state.soundEnabled
      ? "Audio restored. The machine can chirp about disruption again."
      : "Audio muted. The machine will now mock you silently."
  );
});

overclockButton.addEventListener("click", () => {
  if (state.isSpinning) {
    return;
  }

  state.overclockEnabled = !state.overclockEnabled;
  updateDisplay();
  setMessage(
    state.overclockEnabled
      ? "Overclock enabled. Twice the cost, twice the drama, same irresponsible math."
      : "Overclock disabled. The machine has returned to normal levels of delusion."
  );
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    spin();
  }
});

updateDisplay();
setMessage("Fresh runway secured. Time to convert more tokens into applause.");
