const SYMBOLS = [
  { name: "TOKEN", weight: 5 },
  { name: "GPU", weight: 4 },
  { name: "PROMPT", weight: 5 },
  { name: "HYPE", weight: 4 },
  { name: "BUG", weight: 3 },
  { name: "VC", weight: 2 },
];

const STORAGE_KEY = "candidate-029-token-rug-pull-state";
const SPIN_COST = 15;

const DEFAULT_STATE = {
  wallet: 150,
  gpuDebt: 0,
  streak: 0,
  bestStreak: 0,
  spins: 0,
  totalBurned: 0,
  totalWon: 0,
  decksRuined: 0,
  soundEnabled: false,
  prompt: "",
  lastOutcome: "No spin yet. Your token balance is still mostly hypothetical.",
  boardMemo: "The board remains excited that your losses can be described as \"training data.\"",
};

const state = loadState();

const walletValue = document.querySelector("#walletValue");
const costValue = document.querySelector("#costValue");
const gpuDebtValue = document.querySelector("#gpuDebtValue");
const streakValue = document.querySelector("#streakValue");
const tickerMessage = document.querySelector("#tickerMessage");
const lastOutcome = document.querySelector("#lastOutcome");
const ledgerLine = document.querySelector("#ledgerLine");
const boardMemo = document.querySelector("#boardMemo");
const savedPromptPreview = document.querySelector("#savedPromptPreview");
const promptInput = document.querySelector("#promptInput");
const promptHint = document.querySelector("#promptHint");
const soundButton = document.querySelector("#soundButton");
const spinButton = document.querySelector("#spinButton");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const savePromptButton = document.querySelector("#savePromptButton");
const machineCard = document.querySelector(".machine-card");
const reels = [0, 1, 2].map((index) => document.querySelector(`#reel${index}`));

render();

soundButton.addEventListener("click", toggleSound);
spinButton.addEventListener("click", spin);
copyButton.addEventListener("click", copyInvestorUpdate);
resetButton.addEventListener("click", resetGame);
savePromptButton.addEventListener("click", savePrompt);

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE };
    }

    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  walletValue.textContent = String(state.wallet);
  costValue.textContent = String(SPIN_COST);
  gpuDebtValue.textContent = String(state.gpuDebt);
  streakValue.textContent = String(state.streak);
  lastOutcome.textContent = state.lastOutcome;
  ledgerLine.textContent =
    `${state.spins} spins, ${state.totalBurned} tokens burned, ${state.totalWon} tokens won, ${state.decksRuined} decks ruined, best streak ${state.bestStreak}.`;
  boardMemo.textContent = state.boardMemo;
  promptInput.value = state.prompt;
  savedPromptPreview.textContent = state.prompt
    ? `"${state.prompt}"`
    : "No prompt saved. Raw intuition is doing most of the damage.";

  soundButton.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  soundButton.setAttribute("aria-pressed", String(state.soundEnabled));

  if (state.wallet < SPIN_COST) {
    tickerMessage.textContent = "Wallet depleted. Please raise another round on pure confidence.";
  }

  spinButton.disabled = state.wallet < SPIN_COST;
}

async function spin() {
  if (state.wallet < SPIN_COST) {
    tickerMessage.textContent = "You cannot spin without tokens, but that has never stopped AI founders from trying.";
    flashMachine("loss");
    beep(120, 0.08, "sawtooth");
    return;
  }

  state.wallet -= SPIN_COST;
  state.spins += 1;
  state.totalBurned += SPIN_COST;

  const sanitizedPrompt = state.prompt.trim();
  const promptBuff = sanitizedPrompt ? 1 : 0;
  const boardSeed = sanitizedPrompt ? roastPrompt(sanitizedPrompt) : "No saved prompt. The machine is freeballing strategy again.";

  tickerMessage.textContent = sanitizedPrompt
    ? `Injecting lucky prompt into the inference slot: "${truncate(sanitizedPrompt, 56)}"`
    : "Spinning the model with zero guardrails and excellent slide design.";

  spinButton.disabled = true;
  reels.forEach((reel) => reel.classList.add("spinning"));

  const results = [];

  for (let index = 0; index < reels.length; index += 1) {
    await wait(380 + index * 160);
    const symbol = pickWeightedSymbol(promptBuff);
    results.push(symbol);
    reels[index].textContent = symbol;
    beep(220 + index * 90, 0.04, "triangle");
  }

  reels.forEach((reel) => reel.classList.remove("spinning"));

  const outcome = evaluateSpin(results, boardSeed);
  state.wallet += outcome.delta;
  state.gpuDebt += outcome.gpuDebtDelta;
  state.totalWon += Math.max(outcome.delta, 0);
  state.streak = outcome.delta > 0 ? state.streak + 1 : 0;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  state.decksRuined += outcome.decksRuinedDelta;
  state.lastOutcome = outcome.lastOutcome;
  state.boardMemo = outcome.boardMemo;

  if (state.streak >= 3) {
    state.wallet += 20;
    state.totalWon += 20;
    tickerMessage.textContent = "Retention loop achieved. Bonus 20 tokens for addicting the PM.";
    state.lastOutcome += " Bonus: retention metrics unlocked +20 tokens.";
  } else {
    tickerMessage.textContent = outcome.ticker;
  }

  if (state.gpuDebt >= 60) {
    state.wallet = Math.max(0, state.wallet - 25);
    state.gpuDebt -= 30;
    state.lastOutcome += " Finance finally saw the cloud bill. -25 tokens in emergency austerity.";
    tickerMessage.textContent = "Cloud invoice ambushed the roadmap. Emergency cuts applied.";
  }

  flashMachine(outcome.delta > 0 ? "win" : "loss");
  beep(outcome.delta > 0 ? 660 : 150, outcome.delta > 0 ? 0.12 : 0.1, outcome.delta > 0 ? "square" : "sawtooth");

  saveState();
  render();
}

function evaluateSpin(results, boardSeed) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((left, right) => right[1] - left[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3) {
    switch (topSymbol) {
      case "TOKEN":
        return {
          delta: 140,
          gpuDebtDelta: 0,
          decksRuinedDelta: 0,
          lastOutcome: "Triple TOKEN. The market has rewarded your courage and lack of unit economics.",
          ticker: "Jackpot. Investors confused virality with revenue again.",
          boardMemo: "The board would like to announce product-market maybe-fit.",
        };
      case "GPU":
        return {
          delta: 90,
          gpuDebtDelta: 12,
          decksRuinedDelta: 1,
          lastOutcome: "Triple GPU. Congratulations on winning both tokens and a horrifying cloud invoice.",
          ticker: "Compute maxed out. Somehow this is being framed as traction.",
          boardMemo: "CFO note: the demo looked expensive because it was.",
        };
      case "PROMPT":
        return {
          delta: 70,
          gpuDebtDelta: 0,
          decksRuinedDelta: 1,
          lastOutcome: `Triple PROMPT. ${boardSeed}`,
          ticker: "Prompt engineering miracle detected. A LinkedIn post is already drafting itself.",
          boardMemo: "The board now believes prompt phrasing is a durable moat.",
        };
      case "HYPE":
        return {
          delta: 60,
          gpuDebtDelta: 0,
          decksRuinedDelta: 2,
          lastOutcome: "Triple HYPE. You monetized adjectives.",
          ticker: "Keynote-grade momentum achieved. Reality remains under review.",
          boardMemo: "Every KPI will be replaced with the word momentum until further notice.",
        };
      case "VC":
        return {
          delta: 110,
          gpuDebtDelta: 0,
          decksRuinedDelta: 2,
          lastOutcome: "Triple VC. Funding secured, dignity diluted.",
          ticker: "New capital acquired. Please spend it on a mascot and some inference waste.",
          boardMemo: "The board is delighted to own more narrative and less math.",
        };
      case "BUG":
        return {
          delta: -45,
          gpuDebtDelta: 6,
          decksRuinedDelta: 3,
          lastOutcome: "Triple BUG. The hallucinations have unionized into an outage.",
          ticker: "Catastrophic demo failure. Sales is calling it radical transparency.",
          boardMemo: "Please stop describing production incidents as emergent intelligence.",
        };
      default:
        break;
    }
  }

  if (topCount === 2) {
    if (topSymbol === "BUG") {
      return {
        delta: -20,
        gpuDebtDelta: 4,
        decksRuinedDelta: 1,
        lastOutcome: "Double BUG. The machine has identified your sprint plan as fiction.",
        ticker: "Incident response in progress. Everyone pretend this was a stress test.",
        boardMemo: "Root cause analysis will be replaced with a vibes-based postmortem.",
      };
    }

    if (topSymbol === "GPU") {
      return {
        delta: 25,
        gpuDebtDelta: 8,
        decksRuinedDelta: 1,
        lastOutcome: "Double GPU. You won tokens and lost visibility into infrastructure spend.",
        ticker: "Partial match. Latency improved just enough to keep the hype alive.",
        boardMemo: "Two GPUs in a row counts as platform strategy now.",
      };
    }

    return {
      delta: 25,
      gpuDebtDelta: 0,
      decksRuinedDelta: 1,
      lastOutcome: `Double ${topSymbol}. Enough alignment for a press release, not enough for a product.`,
      ticker: "Partial match. The machine recommends monetizing the screenshot immediately.",
      boardMemo: "The board approves a fresh deck featuring the words autonomous, agentic, and scalable.",
    };
  }

  return {
    delta: 0,
    gpuDebtDelta: 0,
    decksRuinedDelta: 0,
    lastOutcome: "No match. Your tokens were converted directly into enterprise vapor.",
    ticker: "Miss. The machine has pivoted from value creation to heat generation.",
    boardMemo: "The board suggests adding one more wrapper and calling it orchestration.",
  };
}

function pickWeightedSymbol(promptBuff) {
  const weightedPool = [];

  SYMBOLS.forEach((symbol) => {
    let weight = symbol.weight;

    if (promptBuff && symbol.name === "PROMPT") {
      weight += 2;
    }

    if (promptBuff && symbol.name === "BUG") {
      weight -= 1;
    }

    for (let count = 0; count < weight; count += 1) {
      weightedPool.push(symbol.name);
    }
  });

  const index = Math.floor(Math.random() * weightedPool.length);
  return weightedPool[index];
}

function savePrompt() {
  state.prompt = promptInput.value.trim();
  saveState();

  promptHint.textContent = state.prompt
    ? "Prompt saved to localStorage. The machine will now overfit to your buzzwords."
    : "Prompt cleared. You are back to artisanal guessing.";

  tickerMessage.textContent = state.prompt
    ? `Prompt cached: "${truncate(state.prompt, 56)}"`
    : "Prompt deleted. Strategic ambiguity restored.";

  render();
}

async function copyInvestorUpdate() {
  const summary =
    `candidate-029 status: wallet=${state.wallet}, spins=${state.spins}, gpuDebt=${state.gpuDebt}, streak=${state.streak}. ` +
    `Current thesis: ${state.lastOutcome}`;

  try {
    await navigator.clipboard.writeText(summary);
    tickerMessage.textContent = "Investor update copied. Please misuse this liquidity responsibly.";
    beep(520, 0.06, "triangle");
  } catch {
    tickerMessage.textContent = "Clipboard denied access. Even the browser rejected your narrative.";
  }
}

function resetGame() {
  Object.assign(state, { ...DEFAULT_STATE });
  reels[0].textContent = "TOKEN";
  reels[1].textContent = "GPU";
  reels[2].textContent = "PROMPT";
  promptHint.textContent = "Saved locally. The machine accepts bribes in the form of buzzwords.";
  tickerMessage.textContent = "Fresh cap table initialized. Time to waste a cleaner balance sheet.";
  saveState();
  render();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  render();

  if (state.soundEnabled) {
    beep(480, 0.05, "triangle");
    tickerMessage.textContent = "Sound enabled. The machine will now beep like expensive optimism.";
  } else {
    tickerMessage.textContent = "Sound muted. Silent capital destruction restored.";
  }
}

function roastPrompt(prompt) {
  const opening = prompt.split(/\s+/).slice(0, 5).join(" ");
  return `Saved prompt "${truncate(opening, 32)}" was interpreted as a defensible strategy.`;
}

function flashMachine(mode) {
  machineCard.classList.remove("win-flash", "loss-flash");
  machineCard.classList.add(mode === "win" ? "win-flash" : "loss-flash");
  window.setTimeout(() => {
    machineCard.classList.remove("win-flash", "loss-flash");
  }, 600);
}

function beep(frequency, duration, type) {
  if (!state.soundEnabled) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = beep.context || new AudioContextClass();
  beep.context = context;

  if (context.state === "suspended") {
    context.resume().catch(() => {});
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.025;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  oscillator.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.stop(now + duration);
}

function truncate(text, length) {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
