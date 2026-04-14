const symbols = ["🤖", "🪙", "🔥", "📉", "💸", "🧠", "🧪"];
const moods = [
  "Guardedly bullish",
  "Pivot-ready",
  "Rate-limit chic",
  "Temporarily aligned",
  "Overfit but thriving",
  "Pre-revenue confident",
];

const STORAGE_KEY = "token-slot-machine-state";
const initialTokens = 1200;

const machineCard = document.querySelector(".machine-card");
const tokenBalance = document.querySelector("#token-balance");
const spinCost = document.querySelector("#spin-cost");
const aiMood = document.querySelector("#ai-mood");
const betInput = document.querySelector("#bet-input");
const betOutput = document.querySelector("#bet-output");
const resultBanner = document.querySelector("#result-banner");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const reelNodes = [
  document.querySelector("#reel-1"),
  document.querySelector("#reel-2"),
  document.querySelector("#reel-3"),
];

let state = loadState();
let audioContext;
let spinning = false;

render();

betInput.addEventListener("input", () => {
  renderBet();
});

spinButton.addEventListener("click", async () => {
  if (spinning) return;

  const bet = Number(betInput.value);

  if (state.tokens < bet) {
    updateBanner(
      "Not enough tokens. The platform suggests raising a seed round or lowering context length.",
      "loss"
    );
    pulse(machineCard, "#b33f1f");
    return;
  }

  spinning = true;
  state.tokens -= bet;
  persistState();
  render();
  updateBanner("Spinning up three expensive GPUs for a deeply unserious result...", "neutral");
  await spinAnimation();

  const roll = reelNodes.map((_, index) => chooseSymbol(index));
  reelNodes.forEach((node, index) => {
    node.textContent = roll[index];
  });

  const outcome = evaluateRoll(roll, bet);
  state.tokens += outcome.payout;
  state.lastMood = moods[Math.floor(Math.random() * moods.length)];
  persistState();
  render();
  updateBanner(outcome.message, outcome.tone);
  chirp(outcome.tone === "win" ? 880 : 220, outcome.tone === "win" ? 0.14 : 0.08);
  pulse(machineCard, outcome.tone === "win" ? "#146b42" : "#cc5c2b");
  spinning = false;
});

resetButton.addEventListener("click", () => {
  state = {
    tokens: initialTokens,
    lastMood: "Suspiciously liquid",
  };
  persistState();
  render();
  updateBanner("Wallet reset. An investor called this a fresh start.", "neutral");
  reelNodes.forEach((node, index) => {
    node.textContent = symbols[index];
  });
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tokens: initialTokens, lastMood: moods[0] };
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.tokens !== "number" || typeof parsed.lastMood !== "string") {
      return { tokens: initialTokens, lastMood: moods[0] };
    }

    return parsed;
  } catch {
    return { tokens: initialTokens, lastMood: moods[0] };
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenBalance.textContent = `${state.tokens}`;
  spinCost.textContent = `${betInput.value}`;
  aiMood.textContent = state.lastMood;
  spinButton.disabled = spinning;
  renderBet();
}

function renderBet() {
  const bet = Number(betInput.value);
  betOutput.textContent = `${bet} tokens`;
  spinCost.textContent = `${bet}`;
}

async function spinAnimation() {
  machineCard.classList.add("spinning");

  for (let step = 0; step < 12; step += 1) {
    reelNodes.forEach((node) => {
      node.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    });
    chirp(220 + step * 28, 0.02);
    await wait(step < 8 ? 70 : 100);
  }

  machineCard.classList.remove("spinning");
}

function chooseSymbol(index) {
  const weighted = [
    "🤖",
    "🪙",
    "🔥",
    "📉",
    "💸",
    "🧠",
    "🧪",
    "💸",
    "📉",
  ];

  return weighted[(Math.floor(Math.random() * weighted.length) + index) % weighted.length];
}

function evaluateRoll(roll, bet) {
  const joined = roll.join("");
  const counts = roll.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});
  const maxCount = Math.max(...Object.values(counts));

  if (joined === "🤖🤖🤖") {
    return win(bet * 12, "Three robots. The deck declares AGI achieved and wires you 12x tokens.");
  }

  if (joined === "🪙🪙🪙") {
    return win(bet * 8, "Triple coins. Pure token farming with almost no product attached.");
  }

  if (joined === "🔥🔥🔥") {
    return win(bet * 6, "Triple fire. Your launch thread hits every feed and none of the fundamentals.");
  }

  if (joined === "📉📉📉") {
    return win(bet * 5, "Triple downtrend. Somehow the market respects the honesty.");
  }

  if (maxCount === 2) {
    return win(
      bet * 2,
      "Two matched. Not quite a breakthrough, but enough momentum for another demo day."
    );
  }

  if (roll.includes("💸")) {
    return lose(
      "A surprise billing glyph appeared. Your tokens are gone and support sent a smiling FAQ."
    );
  }

  return lose("No match. The machine calls this outcome 'premium experimentation'.");
}

function win(amount, message) {
  return { payout: amount, message, tone: "win" };
}

function lose(message) {
  return { payout: 0, message, tone: "loss" };
}

function updateBanner(message, tone) {
  resultBanner.textContent = message;
  resultBanner.className = `result-banner ${tone}`;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function pulse(element, color) {
  element.animate(
    [
      { boxShadow: "0 22px 70px rgba(71, 38, 12, 0.16)" },
      { boxShadow: `0 0 0 6px ${color}33, 0 22px 70px rgba(71, 38, 12, 0.2)` },
      { boxShadow: "0 22px 70px rgba(71, 38, 12, 0.16)" },
    ],
    { duration: 500, easing: "ease-out" }
  );
}

function chirp(frequency, duration) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.02;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
}
