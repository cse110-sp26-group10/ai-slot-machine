const symbols = [
  { name: "GPU", weight: 5 },
  { name: "TOKEN", weight: 4 },
  { name: "PROMPT", weight: 4 },
  { name: "LLM", weight: 4 },
  { name: "HYPE", weight: 3 },
  { name: "CACHE", weight: 3 },
  { name: "VC", weight: 2 },
  { name: "AGENT", weight: 2 },
  { name: "FORK", weight: 2 },
];

const upgrades = [
  {
    name: "Hallucination Pro",
    price: 180,
    description: "Adds confidence to completely invented answers. Investors love posture.",
  },
  {
    name: "Prompt Polisher XL",
    price: 240,
    description: "Rewrites your question into a more expensive question.",
  },
  {
    name: "Emotionally Aligned API",
    price: 320,
    description: "Returns empathy before the outage notice.",
  },
  {
    name: "Quantum Synergy Pack",
    price: 410,
    description: "No one can define it, which is why the margins are excellent.",
  },
  {
    name: "Auto-Pivot Engine",
    price: 525,
    description: "Turns every loss into a new roadmap slide.",
  },
  {
    name: "Enterprise Buzzword Seat",
    price: 690,
    description: "Unlocks premium terms like multimodal governance fabric.",
  },
];

const reels = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const tokenBalance = document.getElementById("token-balance");
const spinCostDisplay = document.getElementById("spin-cost");
const spinButton = document.getElementById("spin-button");
const airdropButton = document.getElementById("airdrop-button");
const resultMessage = document.getElementById("result-message");
const expenseMessage = document.getElementById("expense-message");
const upgradeList = document.getElementById("upgrade-list");
const upgradeTemplate = document.getElementById("upgrade-template");

const state = {
  balance: 1200,
  spinCost: 60,
  spinning: false,
};

function weightedRandomSymbol() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol.name));
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateBalanceText() {
  tokenBalance.textContent = state.balance.toString();
  spinCostDisplay.textContent = state.spinCost.toString();
}

function pulseWin(result) {
  reels.forEach((reel, index) => {
    reel.classList.toggle("win", result.every((item) => item === result[0]) || result[index] === "GPU");
  });
}

function getPayout(result) {
  const uniqueCount = new Set(result).size;

  if (uniqueCount === 1) {
    return {
      amount: 900,
      headline: `Triple ${result[0]}. The machine has achieved artificial greed.`,
      expense: "Unfortunately, finance immediately reserved 35% for model retraining snacks.",
    };
  }

  const counts = result.reduce((map, item) => {
    map[item] = (map[item] || 0) + 1;
    return map;
  }, {});

  const pair = Object.entries(counts).find(([, count]) => count === 2);
  if (pair) {
    return {
      amount: 220,
      headline: `Matched ${pair[0]} twice. Barely coherent, still profitable.`,
      expense: "A compliance bot charged 40 tokens to explain that nothing here is regulated.",
    };
  }

  if (result.includes("VC")) {
    return {
      amount: 120,
      headline: "A venture capitalist wandered by and mistook this for traction.",
      expense: "They also demanded a deck refresh, which somehow cost more than lunch.",
    };
  }

  return {
    amount: 0,
    headline: "No payout. The optimizer decided your fun was non-essential.",
    expense: "You still paid inference fees for the privilege of losing.",
  };
}

function renderUpgrades() {
  upgradeList.innerHTML = "";

  upgrades.forEach((upgrade) => {
    const clone = upgradeTemplate.content.cloneNode(true);
    const card = clone.querySelector(".upgrade-card");
    const name = clone.querySelector(".upgrade-name");
    const description = clone.querySelector(".upgrade-description");
    const price = clone.querySelector(".upgrade-price");
    const button = clone.querySelector(".buy-button");

    name.textContent = upgrade.name;
    description.textContent = upgrade.description;
    price.textContent = `${upgrade.price} tokens`;
    button.disabled = state.balance < upgrade.price || state.spinning;
    button.textContent = state.balance >= upgrade.price ? "Waste Tokens" : "Too Broke";

    button.addEventListener("click", () => {
      if (state.balance < upgrade.price || state.spinning) {
        return;
      }

      state.balance -= upgrade.price;
      state.spinCost += 10;
      updateBalanceText();
      renderUpgrades();
      resultMessage.textContent = `Purchased ${upgrade.name}. Your burn rate is now visibly glowing.`;
      expenseMessage.textContent = "Every new AI feature increases your monthly spend and your confidence equally.";
    });

    upgradeList.appendChild(card);
  });
}

function setButtonsDisabled(disabled) {
  spinButton.disabled = disabled || state.balance < state.spinCost;
  airdropButton.disabled = disabled;
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  updateBalanceText();
  setButtonsDisabled(true);
  renderUpgrades();
  resultMessage.textContent = "Running a deeply unnecessary three-model ensemble...";
  expenseMessage.textContent = "Cloud invoice rising. Please clap.";

  reels.forEach((reel) => {
    reel.classList.remove("win");
    reel.classList.add("spinning");
  });

  const result = [];

  for (let index = 0; index < reels.length; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 280 + index * 180));
    const symbol = weightedRandomSymbol();
    result.push(symbol);
    reels[index].textContent = symbol;
    reels[index].classList.remove("spinning");
  }

  const payout = getPayout(result);
  state.balance += payout.amount;
  updateBalanceText();
  pulseWin(result);
  resultMessage.textContent = payout.headline;
  expenseMessage.textContent =
    payout.amount > 0
      ? `${payout.expense} Net change: +${payout.amount - state.spinCost} tokens this spin.`
      : `${payout.expense} Net change: -${state.spinCost} tokens this spin.`;

  state.spinning = false;
  setButtonsDisabled(false);
  renderUpgrades();

  if (state.balance < state.spinCost) {
    resultMessage.textContent = "You are out of tokens. The future of AI now depends on begging.";
    expenseMessage.textContent = "Hit the VC airdrop button and pretend this was always the monetization plan.";
  }
}

spinButton.addEventListener("click", spin);

airdropButton.addEventListener("click", () => {
  if (state.spinning) {
    return;
  }

  const refill = 300;
  state.balance += refill;
  updateBalanceText();
  renderUpgrades();
  setButtonsDisabled(false);
  resultMessage.textContent = "Airdrop received. Dilution is temporary, token theater is forever.";
  expenseMessage.textContent = `You got ${refill} emergency tokens in exchange for calling a screenshot "community."`;
});

updateBalanceText();
renderUpgrades();
setButtonsDisabled(false);
