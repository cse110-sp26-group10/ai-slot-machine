const symbols = [
  "Prompt",
  "GPU",
  "Token",
  "Hallucination",
  "Synergy",
  "Benchmark",
  "Wrapper",
  "Venture",
  "Agent",
  "Pivot",
];

const upgrades = [
  {
    name: "Context Window Extension Cord",
    price: 45,
    description: "Lets your model remember the start of a meeting and still ignore the point.",
  },
  {
    name: "Enterprise Hype Pack",
    price: 80,
    description: "Adds seven charts, zero certainty, and a very important dashboard gradient.",
  },
  {
    name: "Hallucination Firewall",
    price: 120,
    description: "Filters out 12% of nonsense, then writes a keynote about the other 88%.",
  },
  {
    name: "Quantum Prompt Polish",
    price: 150,
    description: "Turns ordinary requests into premium artisanal prompts with twice the jargon.",
  },
];

const payoutRules = {
  triple: 90,
  pair: 32,
  aiCombo: 54,
  chaos: 12,
};

const storageKey = "token-tugger-3000-state";

const state = {
  tokens: 120,
  spinCost: 15,
  ownedUpgrades: new Set(),
  reels: ["Prompt", "Token", "Hallucination"],
  spinning: false,
  lastWin: 0,
};

const reelElements = Array.from(document.querySelectorAll(".reel"));
const tokensElement = document.querySelector("#tokens");
const messageElement = document.querySelector("#message");
const streakElement = document.querySelector("#streak");
const spinButton = document.querySelector("#spin-button");
const upgradeButton = document.querySelector("#upgrade-button");
const upgradeList = document.querySelector("#upgrade-list");
const upgradeTemplate = document.querySelector("#upgrade-template");

hydrateState();
render();
renderUpgrades();

spinButton.addEventListener("click", spin);
upgradeButton.addEventListener("click", buyRandomUpgrade);

function render() {
  tokensElement.textContent = state.tokens;
  reelElements.forEach((element, index) => {
    element.textContent = state.reels[index];
  });

  const canSpin = !state.spinning && state.tokens >= state.spinCost;
  const remainingUpgrades = upgrades.filter(
    (upgrade) => !state.ownedUpgrades.has(upgrade.name),
  );
  const cheapestUpgrade = remainingUpgrades.reduce(
    (lowest, current) => Math.min(lowest, current.price),
    Infinity,
  );
  const canBuyUpgrade = !state.spinning && state.tokens >= cheapestUpgrade;

  spinButton.disabled = !canSpin;
  upgradeButton.disabled = !canBuyUpgrade;

  if (state.ownedUpgrades.size === upgrades.length) {
    upgradeButton.textContent = "Shop fully monetized";
  } else {
    upgradeButton.textContent = `Buy dubious upgrade`;
  }
}

function renderUpgrades() {
  upgradeList.textContent = "";

  upgrades.forEach((upgrade) => {
    const fragment = upgradeTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".upgrade-card");
    const name = fragment.querySelector(".upgrade-name");
    const description = fragment.querySelector(".upgrade-description");
    const price = fragment.querySelector(".upgrade-price");
    const status = fragment.querySelector(".upgrade-status");

    const isOwned = state.ownedUpgrades.has(upgrade.name);
    const canAfford = state.tokens >= upgrade.price;

    name.textContent = upgrade.name;
    description.textContent = upgrade.description;
    price.textContent = `${upgrade.price} tokens`;
    status.textContent = isOwned
      ? "Purchased. Your roadmap now has more adjectives."
      : canAfford
        ? "Available now. Nothing could go wrong."
        : "Locked until the slot machine blesses your KPI journey.";
    status.classList.add(
      isOwned ? "is-owned" : canAfford ? "is-available" : "is-locked",
    );

    if (isOwned) {
      card.style.opacity = "0.7";
    }

    upgradeList.appendChild(fragment);
  });
}

function spin() {
  if (state.spinning || state.tokens < state.spinCost) {
    setMessage("The machine refuses to generate value without more tokens.");
    return;
  }

  state.spinning = true;
  state.tokens -= state.spinCost;
  state.lastWin = 0;
  setMessage("Spinning up a fresh pile of synthetic ambition...");
  streakElement.textContent = "Inference in progress";
  render();
  renderUpgrades();

  reelElements.forEach((element) => element.classList.add("spinning"));

  const finalSymbols = reelElements.map(() => randomSymbol());
  const revealDelays = [500, 900, 1300];

  finalSymbols.forEach((symbol, index) => {
    window.setTimeout(() => {
      state.reels[index] = symbol;
      reelElements[index].textContent = symbol;
    }, revealDelays[index]);
  });

  window.setTimeout(() => {
    reelElements.forEach((element) => element.classList.remove("spinning"));
    settleSpin(finalSymbols);
  }, revealDelays[revealDelays.length - 1] + 120);
}

function settleSpin(result) {
  const winnings = calculatePayout(result);
  state.tokens += winnings.amount;
  state.lastWin = winnings.amount;
  state.spinning = false;

  if (winnings.amount > 0) {
    setMessage(`${winnings.message} You gained ${winnings.amount} tokens.`);
  } else {
    setMessage("No payout. The machine suggests reframing the problem as a strategy win.");
  }

  streakElement.textContent =
    winnings.amount >= payoutRules.triple
      ? "Board-ready disruption achieved"
      : winnings.amount >= payoutRules.aiCombo
        ? "Strong artificial optimism"
        : winnings.amount > 0
          ? "Moderate buzzword liquidity"
          : "Pivoting to thought leadership";

  render();
  renderUpgrades();
  persistState();
}

function calculatePayout(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];
  const hasPromptTokenAgentCombo =
    result.includes("Prompt") && result.includes("Token") && result.includes("Agent");
  const uniqueCount = entries.length;

  if (topCount === 3) {
    return {
      amount: payoutRules.triple,
      message: `Jackpot. Triple ${topSymbol} means the AI has achieved maximum slide-deck sentience.`,
    };
  }

  if (hasPromptTokenAgentCombo) {
    return {
      amount: payoutRules.aiCombo,
      message: "Prompt + Token + Agent. Congratulations on discovering venture capital catnip.",
    };
  }

  if (topCount === 2) {
    return {
      amount: payoutRules.pair,
      message: `Pair of ${topSymbol}. The model is confidently average, which still bills nicely.`,
    };
  }

  if (uniqueCount === 3 && result.includes("Hallucination")) {
    return {
      amount: payoutRules.chaos,
      message: "Chaos bonus. One hallucination slipped through QA and somehow became a feature.",
    };
  }

  return {
    amount: 0,
    message: "",
  };
}

function buyRandomUpgrade() {
  const availableUpgrades = upgrades.filter(
    (upgrade) =>
      !state.ownedUpgrades.has(upgrade.name) && state.tokens >= upgrade.price,
  );

  if (!availableUpgrades.length) {
    if (state.ownedUpgrades.size === upgrades.length) {
      setMessage("You already bought every premium AI accessory. The grift is complete.");
    } else {
      setMessage("Not enough tokens. Please win harder or invent a new pricing tier.");
    }
    return;
  }

  const upgrade =
    availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];

  state.tokens -= upgrade.price;
  state.ownedUpgrades.add(upgrade.name);
  setMessage(`Purchased ${upgrade.name}. Your token balance falls, but your AI swagger climbs.`);
  streakElement.textContent = "Freshly capitalized nonsense";

  render();
  renderUpgrades();
  persistState();
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function setMessage(message) {
  messageElement.textContent = message;
}

function hydrateState() {
  try {
    const savedState = window.localStorage.getItem(storageKey);

    if (!savedState) {
      return;
    }

    const parsed = JSON.parse(savedState);

    if (typeof parsed.tokens === "number") {
      state.tokens = parsed.tokens;
    }

    if (Array.isArray(parsed.ownedUpgrades)) {
      state.ownedUpgrades = new Set(parsed.ownedUpgrades);
    }
  } catch {
    setMessage("The save data became self-aware and had to be ignored.");
  }
}

function persistState() {
  const snapshot = {
    tokens: state.tokens,
    ownedUpgrades: Array.from(state.ownedUpgrades),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}
