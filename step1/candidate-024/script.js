const symbols = [
  { icon: "AGI", label: "World Domination", weight: 1 },
  { icon: "LLM", label: "Token Blender", weight: 3 },
  { icon: "404", label: "Missing Sources", weight: 2 },
  { icon: "GPU", label: "Heat Death", weight: 3 },
  { icon: "VC", label: "Series Hype", weight: 2 },
  { icon: "BOT", label: "Synergy Slop", weight: 4 },
  { icon: "OOPS", label: "Hallucination", weight: 3 },
];

const state = {
  tokens: Number(localStorage.getItem("tokenFurnaceTokens")) || 120,
  spinCost: 15,
  jackpot: 250,
  isSpinning: false,
};

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
];

const tokenCount = document.getElementById("tokenCount");
const spinCost = document.getElementById("spinCost");
const jackpotValue = document.getElementById("jackpotValue");
const message = document.getElementById("message");
const spinButton = document.getElementById("spinButton");
const topUpButton = document.getElementById("topUpButton");

function buildWeightedPool() {
  return symbols.flatMap((symbol) => Array(symbol.weight).fill(symbol));
}

const weightedPool = buildWeightedPool();

function randomSymbol() {
  return weightedPool[Math.floor(Math.random() * weightedPool.length)];
}

function drawSymbol(reel, symbol) {
  reel.innerHTML = `
    <div class="reel-symbol">
      <span>${symbol.icon}</span>
      <span class="reel-label">${symbol.label}</span>
    </div>
  `;
}

function updateMeters() {
  tokenCount.textContent = state.tokens;
  spinCost.textContent = state.spinCost;
  jackpotValue.textContent = state.jackpot;
  spinButton.disabled = state.isSpinning || state.tokens < state.spinCost;
  localStorage.setItem("tokenFurnaceTokens", String(state.tokens));
}

function setMessage(text, tone = "neutral") {
  message.textContent = text;
  message.className = `message ${tone}`;
}

function evaluateSpin(results) {
  const icons = results.map((result) => result.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});
  const values = Object.values(counts).sort((a, b) => b - a);
  const [bestMatch = 0] = values;
  const allSame = bestMatch === 3;
  const hasPair = bestMatch === 2;

  if (icons.every((icon) => icon === "AGI")) {
    state.tokens += state.jackpot;
    state.jackpot = 250;
    state.spinCost += 5;
    return {
      tone: "win",
      text: "Three AGIs. You win the jackpot, a keynote slot, and exactly zero alignment guarantees.",
    };
  }

  if (icons.every((icon) => icon === "404")) {
    state.tokens += state.spinCost;
    return {
      tone: "neutral",
      text: "Triple 404. The machine could not locate your losses, so it refunded the spin out of embarrassment.",
    };
  }

  if (allSame) {
    const payout = state.spinCost * 4;
    state.tokens += payout;
    state.jackpot += 20;
    return {
      tone: "win",
      text: `Three ${icons[0]}s. The board approved a ${payout}-token rebate for "transformational innovation."`,
    };
  }

  if (hasPair) {
    const payout = Math.round(state.spinCost * 1.6);
    state.tokens += payout;
    state.jackpot += 10;
    return {
      tone: "win",
      text: `A partial match sneaks through. Finance calls it efficiency and returns ${payout} tokens.`,
    };
  }

  state.jackpot += 15;
  return {
    tone: "loss",
    text: "No match. Your tokens have been reinvested into a larger model and a worse slogan.",
  };
}

function spin() {
  if (state.isSpinning || state.tokens < state.spinCost) {
    return;
  }

  state.isSpinning = true;
  state.tokens -= state.spinCost;
  setMessage("Inference in progress. Please enjoy these expensive blinking lights.", "neutral");
  updateMeters();

  reels.forEach((reel) => reel.classList.add("spinning"));

  const results = reels.map(() => randomSymbol());

  reels.forEach((reel, index) => {
    const interval = setInterval(() => drawSymbol(reel, randomSymbol()), 120);
    setTimeout(() => {
      clearInterval(interval);
      reel.classList.remove("spinning");
      drawSymbol(reel, results[index]);

      if (index === reels.length - 1) {
        const outcome = evaluateSpin(results);
        state.isSpinning = false;
        updateMeters();
        setMessage(outcome.text, outcome.tone);

        if (state.tokens < state.spinCost) {
          setMessage(
            `${outcome.text} You are now out of tokens, which makes you an authentic AI startup.`,
            outcome.tone
          );
        }
      }
    }, 950 + index * 500);
  });
}

function topUp() {
  if (state.isSpinning) {
    return;
  }

  const bonus = 45;
  state.tokens += bonus;
  state.jackpot = Math.max(250, state.jackpot - 25);
  updateMeters();
  setMessage(
    `A cheerful popup grants ${bonus} courtesy tokens in exchange for your complete emotional dependence.`,
    "neutral"
  );
}

function initialize() {
  reels.forEach((reel) => drawSymbol(reel, randomSymbol()));
  updateMeters();
}

spinButton.addEventListener("click", spin);
topUpButton.addEventListener("click", topUp);

initialize();
