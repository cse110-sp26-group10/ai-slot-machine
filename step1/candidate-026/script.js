const INITIAL_TOKENS = 120;
const SPIN_COST = 15;
const JACKPOT_REWARD = 180;

const reelPool = [
  { label: "Prompt Dust", tier: "loss", reward: 0 },
  { label: "Hallucination", tier: "loss", reward: 4 },
  { label: "Context Window", tier: "small", reward: 12 },
  { label: "GPU Apology", tier: "small", reward: 18 },
  { label: "Alignment Patch", tier: "medium", reward: 30 },
  { label: "Agent Swarm", tier: "medium", reward: 40 },
  { label: "Seed Funding", tier: "big", reward: 60 },
  { label: "Infinite Tokens", tier: "jackpot", reward: JACKPOT_REWARD }
];

const spendingIdeas = [
  "premium autocomplete for saying what you already meant",
  "a larger context window so the model can forget more expensively",
  "executive dashboard charts nobody asked for",
  "alignment consulting with twelve slides and one shrug",
  "GPU incense for a more spiritual inference pipeline",
  "enterprise AI aura polish",
  "a private beta for your own buzzwords",
  "one heroic prompt engineer coffee stipend"
];

const walletTokens = document.getElementById("walletTokens");
const lastDelta = document.getElementById("lastDelta");
const jackpotCount = document.getElementById("jackpotCount");
const statusMessage = document.getElementById("statusMessage");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const spendingLog = document.getElementById("spendingLog");
const logItemTemplate = document.getElementById("logItemTemplate");
const reelElements = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2")
];
const reelFrames = Array.from(document.querySelectorAll(".reel"));

const gameState = {
  tokens: INITIAL_TOKENS,
  lastSpinDelta: 0,
  jackpots: 0,
  spinning: false
};

function randomSymbol() {
  return reelPool[Math.floor(Math.random() * reelPool.length)];
}

function updateStats() {
  walletTokens.textContent = gameState.tokens;
  lastDelta.textContent =
    gameState.lastSpinDelta > 0 ? `+${gameState.lastSpinDelta}` : `${gameState.lastSpinDelta}`;
  jackpotCount.textContent = gameState.jackpots;
  spinButton.disabled = gameState.spinning || gameState.tokens < SPIN_COST;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function addLogEntry(message, amount) {
  const fragment = logItemTemplate.content.cloneNode(true);
  fragment.querySelector(".log-title").textContent = message;
  fragment.querySelector(".log-cost").textContent = `-${amount} tokens`;

  if (spendingLog.children.length === 1 && !spendingLog.firstElementChild.classList.contains("log-entry")) {
    spendingLog.innerHTML = "";
  }

  spendingLog.prepend(fragment);

  while (spendingLog.children.length > 5) {
    spendingLog.removeChild(spendingLog.lastElementChild);
  }
}

function spendWinnings(amount) {
  const spendAmount = Math.max(6, Math.min(amount, Math.floor(amount * 0.7)));
  const item = spendingIdeas[Math.floor(Math.random() * spendingIdeas.length)];
  addLogEntry(`Spent on ${item}`, spendAmount);
  return { spendAmount, item };
}

function renderSymbols(symbols) {
  symbols.forEach((symbol, index) => {
    reelElements[index].textContent = symbol.label;
  });
}

function scoreSpin(symbols) {
  const [a, b, c] = symbols;
  const labels = symbols.map((symbol) => symbol.label);
  const uniqueCount = new Set(labels).size;

  if (uniqueCount === 1) {
    if (a.tier === "jackpot") {
      return {
        reward: JACKPOT_REWARD,
        message:
          "Three Infinite Tokens. Investors are crying, your demo has become sentient, and the casino regrets everything.",
        jackpot: true
      };
    }

    return {
      reward: a.reward * 3,
      message: `Triple ${a.label}. The machine has declared you a visionary for at least six minutes.`,
      jackpot: false
    };
  }

  if (uniqueCount === 2) {
    const matchingSymbol = symbols.find(
      (symbol, index) => labels.indexOf(symbol.label) !== index
    );

    return {
      reward: matchingSymbol.reward + 8,
      message: `A pair of ${matchingSymbol.label}. Not bad. You can almost afford ethical concerns.`,
      jackpot: false
    };
  }

  return {
    reward: 0,
    message:
      "Nothing matched. Your tokens have been rerouted into a stealth startup for AI-generated meeting nods.",
    jackpot: false
  };
}

function animateSpin(finalSymbols) {
  const delays = [700, 1050, 1400];

  reelFrames.forEach((frame) => frame.classList.add("spinning"));

  finalSymbols.forEach((symbol, index) => {
    const interval = window.setInterval(() => {
      reelElements[index].textContent = randomSymbol().label;
    }, 110);

    window.setTimeout(() => {
      window.clearInterval(interval);
      reelElements[index].textContent = symbol.label;
      reelFrames[index].classList.remove("spinning");
    }, delays[index]);
  });

  return delays[delays.length - 1];
}

function completeSpin(symbols) {
  const result = scoreSpin(symbols);
  let spendAmount = 0;
  let spentOn = "";

  gameState.tokens -= SPIN_COST;

  if (result.reward > 0) {
    gameState.tokens += result.reward;
    const spendingResult = spendWinnings(result.reward);
    spendAmount = spendingResult.spendAmount;
    spentOn = spendingResult.item;
    gameState.tokens -= spendAmount;
  }

  const netChange = result.reward - spendAmount - SPIN_COST;
  gameState.lastSpinDelta = netChange;

  if (result.jackpot) {
    gameState.jackpots += 1;
  }

  if (gameState.tokens < SPIN_COST) {
    setStatus(`${result.message} Also, you are down to ${gameState.tokens} tokens, which is beneath even beta-tester dignity. Hit reset to get bailed out.`);
  } else if (result.reward > 0) {
    setStatus(
      `${result.message} Then you spent ${spendAmount} tokens on ${spentOn}. Net change: ${netChange >= 0 ? "+" : ""}${netChange} tokens.`
    );
  } else {
    setStatus(`${result.message} Net change: ${netChange} tokens.`);
  }

  gameState.spinning = false;
  updateStats();
}

function spin() {
  if (gameState.spinning || gameState.tokens < SPIN_COST) {
    return;
  }

  gameState.spinning = true;
  gameState.lastSpinDelta = -SPIN_COST;
  updateStats();
  setStatus("Spinning up three reels and a completely unnecessary amount of AI hype...");

  const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  const totalDelay = animateSpin(finalSymbols);

  window.setTimeout(() => {
    renderSymbols(finalSymbols);
    completeSpin(finalSymbols);
  }, totalDelay + 50);
}

function resetGame() {
  gameState.tokens = INITIAL_TOKENS;
  gameState.lastSpinDelta = 0;
  gameState.jackpots = 0;
  gameState.spinning = false;
  spendingLog.innerHTML = "<li>Your wallet is waiting for a bad decision.</li>";
  renderSymbols([randomSymbol(), randomSymbol(), randomSymbol()]);
  setStatus(
    "Economy reset. Fresh tokens loaded. The grift can begin again."
  );
  reelFrames.forEach((frame) => frame.classList.remove("spinning"));
  updateStats();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

renderSymbols([randomSymbol(), randomSymbol(), randomSymbol()]);
updateStats();
