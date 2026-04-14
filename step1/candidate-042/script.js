const symbols = [
  { name: "GPU", weight: 6 },
  { name: "TOKEN", weight: 5 },
  { name: "PROMPT", weight: 5 },
  { name: "BOT", weight: 4 },
  { name: "HYPE", weight: 4 },
  { name: "CACHE", weight: 3 },
  { name: "VC", weight: 2 },
  { name: "AGENT", weight: 2 },
  { name: "SLIDE", weight: 2 },
];

const upgrades = [
  {
    name: "Hallucination Turbo",
    price: 180,
    description: "Answers twice as fast and with half the relationship to reality.",
  },
  {
    name: "Executive Summary DLC",
    price: 260,
    description: "Compresses every problem into three bullets and a dangerous level of certainty.",
  },
  {
    name: "Enterprise Warmth Pack",
    price: 320,
    description: "Adds reassuring tone while the invoice quietly escalates in the background.",
  },
  {
    name: "Autonomous Pivot Engine",
    price: 410,
    description: "Whenever metrics collapse, it rebrands the collapse as a roadmap milestone.",
  },
  {
    name: "Premium Agent Swarm",
    price: 540,
    description: "Several bots now agree on the wrong answer in parallel.",
  },
  {
    name: "Synthetic Thought Leader Badge",
    price: 680,
    description: "Triples your authority on panels without altering your underlying competence.",
  },
];

const STORAGE_KEY = "token-drain-casino-state";
const AIRDROP_AMOUNT = 300;

const reels = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const tokenBalance = document.getElementById("token-balance");
const spinCostDisplay = document.getElementById("spin-cost");
const bestStreakDisplay = document.getElementById("best-streak");
const spinButton = document.getElementById("spin-button");
const airdropButton = document.getElementById("airdrop-button");
const shareButton = document.getElementById("share-button");
const resultMessage = document.getElementById("result-message");
const expenseMessage = document.getElementById("expense-message");
const upgradeList = document.getElementById("upgrade-list");
const upgradeTemplate = document.getElementById("upgrade-template");

const state = loadState();

function loadState() {
  const fallback = {
    balance: 900,
    spinCost: 75,
    bestStreak: 0,
    currentStreak: 0,
    spinning: false,
    lastHeadline: "System idle. Burn rate nominal. Hubris elevated.",
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      spinning: false,
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  const snapshot = {
    balance: state.balance,
    spinCost: state.spinCost,
    bestStreak: state.bestStreak,
    currentStreak: state.currentStreak,
    lastHeadline: state.lastHeadline,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function weightedRandomSymbol() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol.name));
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateDashboard() {
  tokenBalance.textContent = String(state.balance);
  spinCostDisplay.textContent = String(state.spinCost);
  bestStreakDisplay.textContent = String(state.bestStreak);
}

function setButtonsDisabled(disabled) {
  spinButton.disabled = disabled || state.balance < state.spinCost;
  airdropButton.disabled = disabled;
  shareButton.disabled = disabled;
}

function buzz(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function setMessages(headline, detail) {
  state.lastHeadline = headline;
  resultMessage.textContent = headline;
  expenseMessage.textContent = detail;
  saveState();
}

function markWin(result) {
  const allMatch = result.every((item) => item === result[0]);
  reels.forEach((reel, index) => {
    reel.classList.toggle("win", allMatch || result[index] === "VC");
  });
}

function getPayout(result) {
  const uniqueCount = new Set(result).size;

  if (uniqueCount === 1) {
    return {
      amount: 950,
      headline: `Triple ${result[0]}. The machine has reached peak artificial confidence.`,
      expense: "Finance has already reserved a chunk for cluster vibes and ceremonial benchmarking.",
      streakDelta: 1,
      vibration: [100, 50, 140],
    };
  }

  const counts = result.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});

  const pair = Object.entries(counts).find(([, count]) => count === 2);
  if (pair) {
    return {
      amount: 240,
      headline: `Matched ${pair[0]} twice. Not elegant, but investors call this traction.`,
      expense: "A governance committee materialized and billed you for posture.",
      streakDelta: 1,
      vibration: [70, 40, 70],
    };
  }

  if (result.includes("VC")) {
    return {
      amount: 120,
      headline: "A venture capitalist saw the blinking lights and confused them for product-market fit.",
      expense: "You received funding and six urgent requests for an AI keynote deck.",
      streakDelta: 0,
      vibration: [40],
    };
  }

  return {
    amount: 0,
    headline: "No payout. The optimizer decided delight was not on the roadmap.",
    expense: "You still paid full inference price for the privilege of learning nothing.",
    streakDelta: -1,
    vibration: [120],
  };
}

function renderUpgrades() {
  upgradeList.innerHTML = "";

  upgrades.forEach((upgrade) => {
    const fragment = upgradeTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".upgrade-card");
    const name = fragment.querySelector(".upgrade-name");
    const description = fragment.querySelector(".upgrade-description");
    const price = fragment.querySelector(".upgrade-price");
    const button = fragment.querySelector(".buy-button");

    name.textContent = upgrade.name;
    description.textContent = upgrade.description;
    price.textContent = `${upgrade.price} tokens`;
    button.disabled = state.spinning || state.balance < upgrade.price;
    button.textContent = state.balance >= upgrade.price ? "Waste Tokens" : "Insufficient Hype";

    button.addEventListener("click", () => {
      if (state.spinning || state.balance < upgrade.price) {
        return;
      }

      state.balance -= upgrade.price;
      state.spinCost += 12;
      state.currentStreak = 0;
      updateDashboard();
      renderUpgrades();
      buzz([25, 25, 25]);
      setMessages(
        `Purchased ${upgrade.name}. Your token runway is shorter, but your demo sounds expensive.`,
        "Every add-on increases recurring cost and executive self-esteem at the same time."
      );
    });

    upgradeList.appendChild(card);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  updateDashboard();
  setButtonsDisabled(true);
  renderUpgrades();
  setMessages(
    "Dispatching premium multi-agent reasoning stack...",
    "Token burn confirmed. Someone in finance just whispered the phrase unit economics."
  );

  reels.forEach((reel) => {
    reel.classList.remove("win");
    reel.classList.add("spinning");
  });

  const result = [];

  for (let index = 0; index < reels.length; index += 1) {
    await delay(260 + index * 180);
    const symbol = weightedRandomSymbol();
    result.push(symbol);
    reels[index].textContent = symbol;
    reels[index].classList.remove("spinning");
  }

  const payout = getPayout(result);
  state.balance += payout.amount;
  state.currentStreak = payout.streakDelta > 0 ? state.currentStreak + payout.streakDelta : 0;
  state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
  state.spinning = false;

  updateDashboard();
  renderUpgrades();
  markWin(result);
  buzz(payout.vibration);

  const net = payout.amount - state.spinCost;
  const detail =
    payout.amount > 0
      ? `${payout.expense} Net token movement: ${net >= 0 ? "+" : ""}${net}.`
      : `${payout.expense} Net token movement: -${state.spinCost}.`;

  setMessages(payout.headline, detail);
  setButtonsDisabled(false);
  saveState();

  if (state.balance < state.spinCost) {
    setMessages(
      "Wallet depleted. The business model has entered its begging-for-airdrop phase.",
      "Use the VC button to convert desperation into runway."
    );
  }
}

function airdrop() {
  if (state.spinning) {
    return;
  }

  state.balance += AIRDROP_AMOUNT;
  state.currentStreak = 0;
  updateDashboard();
  renderUpgrades();
  setButtonsDisabled(false);
  buzz([60, 30, 60]);
  setMessages(
    "Emergency airdrop received. Dilution is temporary. Token theater is forever.",
    `You gained ${AIRDROP_AMOUNT} tokens after calling a screenshot a community milestone.`
  );
}

async function shareScore() {
  const shareText = `${state.lastHeadline} I currently have ${state.balance} fake AI tokens in Token Drain Casino.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Token Drain Casino",
        text: shareText,
      });
      setMessages("Shared successfully.", "Your fake success has now been syndicated across the internet.");
      return;
    } catch {
      // Fall through to clipboard when sharing is canceled or unavailable.
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText);
    setMessages("Share text copied.", "The clipboard now contains an entirely unserious AI victory lap.");
    return;
  }

  setMessages("Sharing unavailable.", "This browser refuses to amplify your token propaganda.");
}

spinButton.addEventListener("click", spin);
airdropButton.addEventListener("click", airdrop);
shareButton.addEventListener("click", shareScore);

updateDashboard();
renderUpgrades();
setButtonsDisabled(false);
resultMessage.textContent = state.lastHeadline;
