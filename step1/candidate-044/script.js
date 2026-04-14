const STORAGE_KEY = "token-tugger-5000-state";
const STARTING_TOKENS = 1200;
const SPIN_COST = 40;
const SYMBOLS = ["UNI", "GPU", "404", "COPE", "VIBE", "LAG"];

const state = {
  balance: STARTING_TOKENS,
  spins: 0,
  sessionYield: 0,
  bestHit: "none",
  spinning: false,
};

const messageBank = {
  jackpot: [
    "Three unicorns. Venture capital can smell your statistically impossible momentum.",
    "The model achieved alignment with a fruit machine and somehow got funded.",
    "Jackpot. A board deck is being generated whether you asked for it or not.",
  ],
  tripleGpu: [
    "Three GPUs matched. You won tokens and a strongly worded invoice.",
    "Cluster resonance detected. Finance has entered the chat.",
  ],
  triple404: [
    "Perfect failure symmetry. The outage has become the product.",
    "Three 404s. Reliability through total unavailability.",
  ],
  pair: [
    "Two reels matched, which is enough for most AI demos.",
    "A partial pattern emerged. Product calls this traction.",
    "A pair. The benchmark chart is being cropped for social media.",
  ],
  miss: [
    "No match. The house thanks you for your inference budget.",
    "You bought pure latency and received no insight in return.",
    "Nothing aligned. This is still considered enterprise-grade.",
  ],
  broke: [
    "Wallet empty. Time to pivot to consulting.",
    "No tokens left. Please describe your problem in one sentence or less.",
  ],
};

const reelNodes = [...document.querySelectorAll(".reel")];
const balanceNode = document.querySelector("#token-balance");
const spinCostNode = document.querySelector("#spin-cost");
const spinCountNode = document.querySelector("#spin-count");
const sessionYieldNode = document.querySelector("#session-yield");
const bestHitNode = document.querySelector("#best-hit");
const resultMessageNode = document.querySelector("#result-message");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const machineNode = document.querySelector(".machine");

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (typeof saved.balance === "number") state.balance = saved.balance;
    if (typeof saved.spins === "number") state.spins = saved.spins;
    if (typeof saved.sessionYield === "number") state.sessionYield = saved.sessionYield;
    if (typeof saved.bestHit === "string") state.bestHit = saved.bestHit;
  } catch {
    resultMessageNode.textContent = "Saved state was too cursed to deserialize. Starting fresh.";
  }
}

function persistState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      balance: state.balance,
      spins: state.spins,
      sessionYield: state.sessionYield,
      bestHit: state.bestHit,
    }),
  );
}

function render() {
  balanceNode.textContent = state.balance.toString();
  spinCostNode.textContent = SPIN_COST.toString();
  spinCountNode.textContent = state.spins.toString();
  sessionYieldNode.textContent = state.sessionYield.toString();
  bestHitNode.textContent = state.bestHit;
  spinButton.disabled = state.spinning || state.balance < SPIN_COST;
  spinButton.textContent = state.balance < SPIN_COST ? "Out of Tokens" : `Burn ${SPIN_COST} Tokens`;
}

function setResultMessage(message) {
  resultMessageNode.textContent = message;
}

function classify(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3 && topSymbol === "UNI") {
    return { payout: 900, label: "jackpot", message: randomItem(messageBank.jackpot) };
  }

  if (topCount === 3 && topSymbol === "GPU") {
    return { payout: 420, label: "gpu gpu gpu", message: randomItem(messageBank.tripleGpu) };
  }

  if (topCount === 3 && topSymbol === "404") {
    return { payout: 250, label: "404 404 404", message: randomItem(messageBank.triple404) };
  }

  if (topCount === 3) {
    return {
      payout: 180,
      label: `${topSymbol} ${topSymbol} ${topSymbol}`,
      message: `${topSymbol} tripled. The machine is calling this emergent capability.`,
    };
  }

  if (topCount === 2) {
    return { payout: 110, label: "pair", message: randomItem(messageBank.pair) };
  }

  return { payout: 0, label: "miss", message: randomItem(messageBank.miss) };
}

function pulseMachine(kind) {
  machineNode.classList.remove("is-winning", "is-losing");
  machineNode.classList.add(kind === "win" ? "is-winning" : "is-losing");
  window.setTimeout(() => {
    machineNode.classList.remove("is-winning", "is-losing");
  }, 900);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function animateReel(node, duration) {
  return new Promise((resolve) => {
    node.classList.add("spinning");
    let frameId = 0;

    const tick = () => {
      node.textContent = randomItem(SYMBOLS);
      frameId = window.setTimeout(tick, 70);
    };

    tick();

    window.setTimeout(() => {
      window.clearTimeout(frameId);
      node.classList.remove("spinning");
      resolve();
    }, duration);
  });
}

async function spin() {
  if (state.spinning || state.balance < SPIN_COST) {
    if (state.balance < SPIN_COST) {
      setResultMessage(randomItem(messageBank.broke));
      pulseMachine("loss");
      vibrate([40, 40, 40]);
    }
    return;
  }

  state.spinning = true;
  state.balance -= SPIN_COST;
  state.spins += 1;
  render();

  const finalSymbols = reelNodes.map(() => randomItem(SYMBOLS));
  await Promise.all(
    reelNodes.map((node, index) => animateReel(node, 700 + index * 250)),
  );

  reelNodes.forEach((node, index) => {
    node.textContent = finalSymbols[index];
  });

  const outcome = classify(finalSymbols);
  state.balance += outcome.payout;
  state.sessionYield += outcome.payout - SPIN_COST;
  state.bestHit =
    state.bestHit === "none" || outcome.payout > payoutForLabel(state.bestHit)
      ? outcome.label
      : state.bestHit;

  setResultMessage(
    `${finalSymbols.join(" • ")}. ${outcome.message} ${
      outcome.payout > 0 ? `Payout: +${outcome.payout} tokens.` : "The house keeps your spend."
    }`,
  );

  pulseMachine(outcome.payout > 0 ? "win" : "loss");
  vibrate(outcome.payout > 0 ? [90, 40, 120] : [60]);
  state.spinning = false;
  persistState();
  render();
}

function payoutForLabel(label) {
  if (label === "jackpot") return 900;
  if (label === "gpu gpu gpu") return 420;
  if (label === "404 404 404") return 250;
  if (label === "pair") return 110;
  if (label.includes(" ")) return 180;
  return 0;
}

function reset() {
  state.balance = STARTING_TOKENS;
  state.spins = 0;
  state.sessionYield = 0;
  state.bestHit = "none";
  state.spinning = false;
  ["404", "GPU", "COPE"].forEach((symbol, index) => {
    reelNodes[index].textContent = symbol;
  });
  setResultMessage("Wallet reset. Fresh capital has entered the hype cycle.");
  persistState();
  render();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", reset);

loadState();
render();
