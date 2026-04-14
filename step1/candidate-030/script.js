const SYMBOLS = [
  { name: "TOKEN", weight: 5 },
  { name: "GPU", weight: 4 },
  { name: "PROMPT", weight: 5 },
  { name: "HYPE", weight: 4 },
  { name: "BUG", weight: 3 },
  { name: "HALLUCINATION", weight: 2 },
];

const STORAGE_KEY = "candidate-030-token-burn-arcade";
const SPIN_COST = 10;
const DEFAULT_STATE = {
  wallet: 120,
  gpuDebt: 0,
  hype: 50,
  spins: 0,
  totalBurned: 0,
  totalWon: 0,
  hallucinationIncidents: 0,
  prompt: "",
  lastSpinText: "No spins yet. Your runway remains theoretical.",
  boardText: "The board suggests calling losses \"inference investments.\"",
  audioEnabled: false,
};

const state = loadState();

const walletValue = document.querySelector("#walletValue");
const costValue = document.querySelector("#costValue");
const gpuDebtValue = document.querySelector("#gpuDebtValue");
const hypeValue = document.querySelector("#hypeValue");
const ticker = document.querySelector("#ticker");
const lastSpinText = document.querySelector("#lastSpinText");
const ledgerText = document.querySelector("#ledgerText");
const boardText = document.querySelector("#boardText");
const promptInput = document.querySelector("#promptInput");
const promptPreview = document.querySelector("#promptPreview");
const promptStatus = document.querySelector("#promptStatus");
const audioToggle = document.querySelector("#audioToggle");
const spinButton = document.querySelector("#spinButton");
const savePromptButton = document.querySelector("#savePromptButton");
const copyButton = document.querySelector("#copyButton");
const resetButton = document.querySelector("#resetButton");
const machinePanel = document.querySelector(".machine-panel");
const reels = [0, 1, 2].map((index) => document.querySelector(`#reel${index}`));

render();

audioToggle.addEventListener("click", toggleAudio);
spinButton.addEventListener("click", spin);
savePromptButton.addEventListener("click", savePrompt);
copyButton.addEventListener("click", copyReport);
resetButton.addEventListener("click", resetStartup);

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

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  walletValue.textContent = String(state.wallet);
  costValue.textContent = String(SPIN_COST);
  gpuDebtValue.textContent = String(state.gpuDebt);
  hypeValue.textContent = String(state.hype);
  lastSpinText.textContent = state.lastSpinText;
  ledgerText.textContent =
    `${state.spins} spins, ${state.totalBurned} tokens burned, ${state.totalWon} tokens won, ${state.hallucinationIncidents} hallucination incidents.`;
  boardText.textContent = state.boardText;
  promptInput.value = state.prompt;
  promptPreview.textContent = state.prompt
    ? `"${state.prompt}"`
    : "Nothing saved. Leadership is freelancing strategy again.";
  audioToggle.textContent = `Audio: ${state.audioEnabled ? "On" : "Off"}`;
  audioToggle.setAttribute("aria-pressed", String(state.audioEnabled));

  if (state.wallet < SPIN_COST) {
    ticker.textContent = "Wallet empty. Please raise another round and call it strategic compute.";
  }

  spinButton.disabled = state.wallet < SPIN_COST;
}

async function spin() {
  if (state.wallet < SPIN_COST) {
    ticker.textContent = "You need more tokens before the machine can continue industrializing nonsense.";
    pulsePanel("loss");
    chirp(150, 0.08, "sawtooth");
    return;
  }

  state.wallet -= SPIN_COST;
  state.totalBurned += SPIN_COST;
  state.spins += 1;

  const hasPrompt = state.prompt.trim().length > 0;
  ticker.textContent = hasPrompt
    ? `Injecting saved prompt into the model: "${truncate(state.prompt.trim(), 60)}"`
    : "Running the demo on pure confidence and a suspiciously expensive GPU cluster.";

  spinButton.disabled = true;
  reels.forEach((reel) => reel.classList.add("spinning"));

  const results = [];
  for (let index = 0; index < reels.length; index += 1) {
    await wait(300 + index * 170);
    const symbol = pickSymbol(hasPrompt);
    results.push(symbol);
    reels[index].textContent = symbol;
    chirp(250 + index * 80, 0.04, "triangle");
  }

  reels.forEach((reel) => reel.classList.remove("spinning"));

  const outcome = resolveOutcome(results);
  state.wallet = Math.max(0, state.wallet + outcome.tokens);
  state.gpuDebt = Math.max(0, state.gpuDebt + outcome.gpuDebt);
  state.hype = clamp(state.hype + outcome.hypeDelta, 0, 100);
  state.totalWon += Math.max(0, outcome.tokens);
  state.hallucinationIncidents += outcome.hallucinationIncidents;
  state.lastSpinText = outcome.lastSpinText;
  state.boardText = outcome.boardText;
  ticker.textContent = outcome.ticker;

  if (state.gpuDebt >= 45) {
    state.gpuDebt -= 20;
    state.wallet = Math.max(0, state.wallet - 15);
    state.lastSpinText += " The cloud invoice arrived mid-celebration. -15 tokens.";
    state.boardText = "Finance recommends saying \"multi-modal\" until the invoice stops hurting.";
    ticker.textContent = "GPU debt triggered emergency cost controls.";
  }

  if (state.hype >= 90) {
    state.wallet += 8;
    state.totalWon += 8;
    state.lastSpinText += " The keynote crowd applauded the chart colors. +8 tokens.";
  }

  persistState();
  render();
  pulsePanel(outcome.tokens >= 0 ? "win" : "loss");
  chirp(outcome.tokens >= 0 ? 620 : 130, outcome.tokens >= 0 ? 0.1 : 0.09, outcome.tokens >= 0 ? "square" : "sawtooth");
}

function resolveOutcome(results) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const pairs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = pairs[0];

  if (topCount === 3) {
    if (topSymbol === "TOKEN") {
      return {
        tokens: 90,
        gpuDebt: 0,
        hypeDelta: 6,
        hallucinationIncidents: 0,
        ticker: "Triple TOKEN. Investors mistook luck for product-market fit.",
        lastSpinText: "The machine emitted three TOKENs and a fresh valuation deck.",
        boardText: "The board is pleased to see profit-adjacent shapes on the dashboard.",
      };
    }

    if (topSymbol === "GPU") {
      return {
        tokens: 50,
        gpuDebt: 15,
        hypeDelta: 12,
        hallucinationIncidents: 0,
        ticker: "Triple GPU. Compute spend has become your only moat.",
        lastSpinText: "Three GPUs in a row. The demo is faster and the margins are deader.",
        boardText: "Infra spend will now be presented as brand heat.",
      };
    }

    if (topSymbol === "PROMPT") {
      return {
        tokens: 45,
        gpuDebt: 0,
        hypeDelta: 8,
        hallucinationIncidents: 0,
        ticker: "Triple PROMPT. A consultant just invoiced you for sentence architecture.",
        lastSpinText: state.prompt.trim()
          ? `Your saved prompt looked visionary enough to unlock a payout: "${truncate(state.prompt.trim(), 72)}".`
          : "Three PROMPTs landed despite no saved prompt, proving confidence can replace preparation.",
        boardText: "Prompt engineering has been promoted to a strategic function.",
      };
    }

    if (topSymbol === "HYPE") {
      return {
        tokens: 35,
        gpuDebt: 0,
        hypeDelta: 15,
        hallucinationIncidents: 0,
        ticker: "Triple HYPE. You have successfully monetized tone.",
        lastSpinText: "Three HYPE symbols landed. The product is still vague, but the adjectives are excellent.",
        boardText: "Every roadmap item will now be renamed 'agentic acceleration.'",
      };
    }

    if (topSymbol === "BUG") {
      return {
        tokens: -30,
        gpuDebt: 6,
        hypeDelta: -18,
        hallucinationIncidents: 1,
        ticker: "Triple BUG. Production has entered the chat uninvited.",
        lastSpinText: "Three BUGs aligned and the demo turned into incident response theater.",
        boardText: "Leadership would prefer that nobody use the word outage on social media.",
      };
    }

    if (topSymbol === "HALLUCINATION") {
      return {
        tokens: 10,
        gpuDebt: 0,
        hypeDelta: 10,
        hallucinationIncidents: 2,
        ticker: "Triple HALLUCINATION. The machine invented a feature and the market clapped.",
        lastSpinText: "Three HALLUCINATIONs produced a beautiful false answer wrapped in executive confidence.",
        boardText: "The board cannot distinguish fabricated capability from ambitious vision, which helps.",
      };
    }
  }

  if (topCount === 2) {
    if (topSymbol === "BUG") {
      return {
        tokens: -12,
        gpuDebt: 3,
        hypeDelta: -10,
        hallucinationIncidents: 1,
        ticker: "Double BUG. Not catastrophic, just deeply on brand.",
        lastSpinText: "Two BUGs landed, forcing the PM to reframe a regression as user discovery.",
        boardText: "The board requests a postmortem with fewer facts and more optimism.",
      };
    }

    if (topSymbol === "HALLUCINATION") {
      return {
        tokens: 12,
        gpuDebt: 0,
        hypeDelta: 6,
        hallucinationIncidents: 1,
        ticker: "Double HALLUCINATION. Fiction continues to benchmark well in demos.",
        lastSpinText: "Two hallucinations slipped through QA and got described as creative reasoning.",
        boardText: "Trust and safety remains excited to be looped in later.",
      };
    }

    return {
      tokens: 12,
      gpuDebt: topSymbol === "GPU" ? 4 : 0,
      hypeDelta: 4,
      hallucinationIncidents: 0,
      ticker: `Pair of ${topSymbol}. You won a small payout and a larger amount of false confidence.`,
      lastSpinText: `Two ${topSymbol} symbols matched. Not a breakthrough, but plenty for a demo day screenshot.`,
      boardText: "The board accepts small wins as long as they can be shown on a slide.",
    };
  }

  return {
    tokens: 0,
    gpuDebt: 1,
    hypeDelta: -4,
    hallucinationIncidents: 0,
    ticker: "No match. Ten tokens were converted directly into narrative exhaust.",
    lastSpinText: `No payout for ${results.join(" / ")}. The machine recommends more buzzwords and less reality.`,
    boardText: "Leadership has decided the failed spin was still strategically educational.",
  };
}

function pickSymbol(hasPrompt) {
  const bonus = hasPrompt ? { PROMPT: 2, TOKEN: 1, BUG: -1 } : {};
  const weightedPool = SYMBOLS.flatMap((symbol) => {
    const modifier = bonus[symbol.name] || 0;
    const count = Math.max(1, symbol.weight + modifier);
    return Array.from({ length: count }, () => symbol.name);
  });
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

function savePrompt() {
  state.prompt = promptInput.value.trim();
  persistState();
  render();
  promptStatus.textContent = state.prompt
    ? "Prompt saved locally. The machine now has a preferred flavor of nonsense."
    : "Prompt cleared. Strategic improvisation restored.";
}

async function copyReport() {
  const report = [
    "AI Token Burn Arcade Report",
    `Wallet: ${state.wallet} tokens`,
    `GPU debt: ${state.gpuDebt} credits`,
    `Hype index: ${state.hype}%`,
    `Last spin: ${state.lastSpinText}`,
  ].join("\n");

  try {
    await navigator.clipboard.writeText(report);
    ticker.textContent = "Spin report copied. Please paste it into a deck and call it traction.";
  } catch {
    ticker.textContent = "Clipboard blocked. Even the browser refuses to help this narrative.";
  }
}

function resetStartup() {
  Object.assign(state, structuredClone(DEFAULT_STATE));
  persistState();
  reels[0].textContent = "PROMPT";
  reels[1].textContent = "GPU";
  reels[2].textContent = "HYPE";
  promptStatus.textContent = "Startup reset. Cap table cleansed, lessons ignored.";
  ticker.textContent = "Fresh runway acquired. Please waste it responsibly.";
  render();
}

function toggleAudio() {
  state.audioEnabled = !state.audioEnabled;
  persistState();
  render();
  if (state.audioEnabled) {
    chirp(520, 0.05, "triangle");
  }
}

function pulsePanel(mode) {
  machinePanel.classList.remove("is-win", "is-loss");
  machinePanel.classList.add(mode === "win" ? "is-win" : "is-loss");
  window.setTimeout(() => {
    machinePanel.classList.remove("is-win", "is-loss");
  }, 520);
}

function chirp(frequency, duration, type) {
  if (!state.audioEnabled) {
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
  oscillator.addEventListener("ended", () => {
    context.close();
  });
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
