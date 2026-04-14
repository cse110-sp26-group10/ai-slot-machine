const symbols = [
  "TOKEN",
  "GPU",
  "PROMPT",
  "JACKPOT",
  "LORA",
  "AGENT",
  "SEED",
  "CACHE",
  "MODEL",
  "HYPE"
];

const purchaseJokes = [
  "Bought a 4-token confidence interval for a clearly wrong answer.",
  "Spent 9 tokens on a dashboard proving the dashboard is strategic.",
  "Reserved 12 tokens for GPU incense and startup astrology.",
  "Burned 7 tokens generating a slide titled 'Agentic Alignment Funnel.'",
  "Paid 11 tokens for autocomplete with a blazer and VC backing.",
  "Allocated 6 tokens to premium deterministic vibes.",
  "Spent 14 tokens making the chatbot sound 18% more visionary.",
  "Used 10 tokens to summarize the summary of the summary.",
  "Paid 8 tokens for emergency context-window expansion therapy.",
  "Invested 13 tokens in a feature called 'synergy mode.'"
];

const roastMessages = {
  jackpot: [
    "Triple match. The board has approved another round of tokenized destiny.",
    "Jackpot energy. Investors are nodding without understanding anything.",
    "Massive win. Your prototype is now legally classified as 'transformative.'"
  ],
  pair: [
    "Two reels matched. Enough tokens to hallucinate with confidence.",
    "A near-win. Product marketing has already called it a platform.",
    "Partial success. You can afford one premium buzzword refill."
  ],
  miss: [
    "Nothing lined up. The machine has pivoted to enterprise consulting.",
    "Cold spin. Your tokens were consumed by inference overhead.",
    "No luck. The model requests more funding and less accountability."
  ],
  broke: [
    "You're out of tokens. Classic AI business model.",
    "Balance depleted. Please insert cash, GPUs, or fresh delusion.",
    "No tokens left. Time to rebrand the failure as an ecosystem."
  ]
};

const state = {
  balance: 120,
  baseSpinCost: 15,
  multiplier: 1,
  spins: 0,
  won: 0,
  spent: 0,
  bestCombo: "None Yet",
  autoSpinsRemaining: 0,
  spinning: false
};

const balanceEl = document.querySelector("#balance");
const spinCostEl = document.querySelector("#spin-cost");
const multiplierEl = document.querySelector("#multiplier");
const messageEl = document.querySelector("#message");
const spinButton = document.querySelector("#spin-button");
const autoSpinButton = document.querySelector("#autospin-button");
const resetButton = document.querySelector("#reset-button");
const reels = [...document.querySelectorAll(".reel")];
const purchaseFeed = document.querySelector("#purchase-feed");
const spinsCountEl = document.querySelector("#spins-count");
const wonCountEl = document.querySelector("#won-count");
const spentCountEl = document.querySelector("#spent-count");
const bestComboEl = document.querySelector("#best-combo");
const machineEl = document.querySelector(".machine");

function getSpinCost() {
  return state.baseSpinCost + (state.multiplier - 1) * 5;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateUI() {
  balanceEl.textContent = state.balance;
  spinCostEl.textContent = getSpinCost();
  multiplierEl.textContent = `x${state.multiplier}`;
  spinsCountEl.textContent = state.spins;
  wonCountEl.textContent = state.won;
  spentCountEl.textContent = state.spent;
  bestComboEl.textContent = state.bestCombo;

  const noFunds = state.balance < getSpinCost();
  spinButton.disabled = state.spinning || noFunds;
  autoSpinButton.disabled = state.spinning || state.autoSpinsRemaining > 0 || noFunds;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function pushPurchaseFeed() {
  const li = document.createElement("li");
  li.textContent = randomItem(purchaseJokes);
  purchaseFeed.prepend(li);

  while (purchaseFeed.children.length > 6) {
    purchaseFeed.removeChild(purchaseFeed.lastElementChild);
  }
}

function announce(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.04;
  utterance.pitch = 1.15;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone(frequency, duration, type = "square", gainValue = 0.03) {
  const AudioContextRef = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextRef) {
    return;
  }

  if (!playTone.ctx) {
    playTone.ctx = new AudioContextRef();
  }

  const ctx = playTone.ctx;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = gainValue;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration / 1000);
}

function playResultSound(kind) {
  if (kind === "jackpot") {
    playTone(880, 120, "triangle", 0.05);
    setTimeout(() => playTone(1174, 160, "triangle", 0.05), 100);
    setTimeout(() => playTone(1567, 260, "triangle", 0.05), 220);
    return;
  }

  if (kind === "pair") {
    playTone(554, 120, "sine", 0.04);
    setTimeout(() => playTone(659, 180, "sine", 0.04), 100);
    return;
  }

  playTone(180, 200, "sawtooth", 0.02);
}

function evaluateSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});
  const values = Object.values(counts).sort((a, b) => b - a);
  const isMoonshot = result.join("|") === "JACKPOT|GPU|TOKEN";

  if (isMoonshot) {
    return {
      payout: 180,
      kind: "jackpot",
      combo: "Moonshot Stack"
    };
  }

  if (values[0] === 3) {
    return {
      payout: 90 + state.multiplier * 15,
      kind: "jackpot",
      combo: `${result[0]} Triple`
    };
  }

  if (values[0] === 2) {
    return {
      payout: 28 + state.multiplier * 6,
      kind: "pair",
      combo: "Pair Match"
    };
  }

  return {
    payout: 0,
    kind: "miss",
    combo: "Miss"
  };
}

async function animateReels(finalSymbols) {
  const intervals = [380, 620, 860];

  reels.forEach((reel) => reel.classList.add("spinning"));

  const promises = reels.map((reel, index) => new Promise((resolve) => {
    const intervalId = window.setInterval(() => {
      reel.textContent = randomItem(symbols);
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      reel.textContent = finalSymbols[index];
      reel.classList.remove("spinning");
      resolve();
    }, intervals[index]);
  }));

  await Promise.all(promises);
}

function applyOutcome(outcome) {
  machineEl.classList.remove("win", "loss");

  if (outcome.kind === "jackpot") {
    state.balance += outcome.payout;
    state.won += outcome.payout;
    state.multiplier = Math.min(state.multiplier + 1, 5);
    state.bestCombo = outcome.combo;
    setMessage(randomItem(roastMessages.jackpot));
    machineEl.classList.add("win");
    playResultSound("jackpot");
    vibrate([120, 40, 120, 40, 200]);
    announce("Jackpot. Tokens secured. Delusion scaling.");
    pushPurchaseFeed();
    return;
  }

  if (outcome.kind === "pair") {
    state.balance += outcome.payout;
    state.won += outcome.payout;
    state.multiplier = Math.min(state.multiplier + 1, 4);
    state.bestCombo = state.bestCombo === "None Yet" ? outcome.combo : state.bestCombo;
    setMessage(randomItem(roastMessages.pair));
    machineEl.classList.add("win");
    playResultSound("pair");
    vibrate(70);
    pushPurchaseFeed();
    return;
  }

  state.multiplier = 1;
  setMessage(randomItem(roastMessages.miss));
  machineEl.classList.add("loss");
  playResultSound("miss");
  vibrate(45);
}

async function spinOnce() {
  const cost = getSpinCost();

  if (state.spinning || state.balance < cost) {
    if (state.balance < cost) {
      setMessage(randomItem(roastMessages.broke));
    }
    updateUI();
    return;
  }

  state.spinning = true;
  state.balance -= cost;
  state.spent += cost;
  state.spins += 1;
  pushPurchaseFeed();
  setMessage("Spinning up the compute cluster. Please ignore the smell of burning runway.");
  updateUI();

  const finalSymbols = Array.from({ length: 3 }, () => randomItem(symbols));
  await animateReels(finalSymbols);

  const outcome = evaluateSpin(finalSymbols);
  applyOutcome(outcome);

  state.spinning = false;
  updateUI();

  if (state.autoSpinsRemaining > 0) {
    state.autoSpinsRemaining -= 1;
    if (state.balance >= getSpinCost()) {
      await sleep(600);
      spinOnce();
      return;
    }
    state.autoSpinsRemaining = 0;
  }

  if (state.balance < getSpinCost()) {
    setMessage(randomItem(roastMessages.broke));
  }
}

function resetGame() {
  Object.assign(state, {
    balance: 120,
    baseSpinCost: 15,
    multiplier: 1,
    spins: 0,
    won: 0,
    spent: 0,
    bestCombo: "None Yet",
    autoSpinsRemaining: 0,
    spinning: false
  });

  ["GPU", "PROMPT", "TOKEN"].forEach((symbol, index) => {
    reels[index].textContent = symbol;
    reels[index].classList.remove("spinning");
  });

  purchaseFeed.innerHTML = `
    <li>Reserved 8 tokens for "strategic prompt enhancement."</li>
    <li>Spent 13 tokens on low-latency jargon streaming.</li>
    <li>Allocated 21 tokens to "agentic roadmap alignment."</li>
  `;

  machineEl.classList.remove("win", "loss");
  setMessage("Fresh cap table, fresh delusion. Pull the lever and begin again.");
  updateUI();
}

spinButton.addEventListener("click", () => {
  spinOnce();
});

autoSpinButton.addEventListener("click", () => {
  if (state.spinning || state.balance < getSpinCost()) {
    return;
  }

  state.autoSpinsRemaining = 5;
  setMessage("Auto-spin enabled. Delegating fiscal responsibility to the machine.");
  updateUI();
  spinOnce();
});

resetButton.addEventListener("click", resetGame);

updateUI();
