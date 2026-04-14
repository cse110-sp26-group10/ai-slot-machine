const symbols = [
  "GPU",
  "404",
  "AGI",
  "LOL",
  "BOT",
  "PROMPT",
  "VC",
  "CACHE",
];

const shopItems = [
  {
    id: "hallucination-plus",
    name: "Hallucination Plus",
    price: 45,
    blurb: "Now with 30% more confidence per incorrect answer.",
  },
  {
    id: "gpu-cologne",
    name: "GPU Cologne",
    price: 30,
    blurb: "Smells like a data center and investor tears.",
  },
  {
    id: "ethics-patch",
    name: "Ethics Patch Notes",
    price: 55,
    blurb: "A PDF explaining why the product is probably fine.",
  },
  {
    id: "stealth-mode",
    name: "Stealth Mode",
    price: 80,
    blurb: "Turns every failure into a roadmap item.",
  },
];

const storageKey = "token-mirage-casino-state";

const state = {
  balance: 120,
  bet: 15,
  jackpot: 250,
  spinning: false,
  lastResult: ["404", "GPU", "LOL"],
};

const reels = Array.from(document.querySelectorAll(".reel"));
const balanceEl = document.getElementById("token-balance");
const spinCostEl = document.getElementById("spin-cost");
const jackpotEl = document.getElementById("jackpot-value");
const messageEl = document.getElementById("result-message");
const moodPillEl = document.getElementById("mood-pill");
const activityLogEl = document.getElementById("activity-log");
const spinButton = document.getElementById("spin-button");
const betRange = document.getElementById("bet-range");
const betDisplay = document.getElementById("bet-display");
const shopGrid = document.getElementById("shop-grid");
const template = document.getElementById("shop-item-template");

function saveState() {
  const snapshot = {
    balance: state.balance,
    bet: state.bet,
    jackpot: state.jackpot,
    lastResult: state.lastResult,
    log: Array.from(activityLogEl.querySelectorAll("li"))
      .slice(0, 6)
      .map((item) => item.textContent),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    const snapshot = JSON.parse(raw);
    state.balance = typeof snapshot.balance === "number" ? snapshot.balance : state.balance;
    state.bet = typeof snapshot.bet === "number" ? snapshot.bet : state.bet;
    state.jackpot = typeof snapshot.jackpot === "number" ? snapshot.jackpot : state.jackpot;
    state.lastResult = Array.isArray(snapshot.lastResult) ? snapshot.lastResult : state.lastResult;

    if (Array.isArray(snapshot.log) && snapshot.log.length > 0) {
      activityLogEl.innerHTML = "";
      snapshot.log.forEach((entry) => {
        const item = document.createElement("li");
        item.textContent = entry;
        activityLogEl.appendChild(item);
      });
    }
  } catch (error) {
    console.warn("Could not restore saved game state.", error);
  }
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function pushLog(text) {
  const item = document.createElement("li");
  item.textContent = text;
  activityLogEl.prepend(item);

  while (activityLogEl.children.length > 6) {
    activityLogEl.removeChild(activityLogEl.lastElementChild);
  }

  saveState();
}

function setMessage(text, mood) {
  messageEl.textContent = text;
  moodPillEl.textContent = mood;
}

function updateScoreboard() {
  balanceEl.textContent = state.balance;
  spinCostEl.textContent = state.bet;
  jackpotEl.textContent = state.jackpot;
  betDisplay.textContent = `${state.bet} tokens`;
  betRange.value = String(state.bet);
  spinButton.disabled = state.spinning || state.balance < state.bet;
}

function getPayout(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const topCount = values[0];
  const [first] = Object.keys(counts).filter((key) => counts[key] === topCount);

  if (topCount === 3 && first === "GPU") {
    return {
      winnings: state.jackpot,
      message:
        "Triple GPU. The cloud angels weep as your wallet is briefly replenished.",
      mood: "Peak hype cycle",
      jackpotHit: true,
    };
  }

  if (topCount === 3 && first === "404") {
    const winnings = Math.floor(state.bet * 4);
    return {
      winnings,
      message:
        "Three 404s. Congratulations, the bug became the business model.",
      mood: "Failure monetized",
    };
  }

  if (topCount === 3) {
    const winnings = Math.floor(state.bet * 2.5);
    return {
      winnings,
      message: `Three ${first}s. Investors call this product-market fit.`,
      mood: "Deck-ready momentum",
    };
  }

  if (topCount === 2) {
    const winnings = Math.floor(state.bet * 1.3);
    return {
      winnings,
      message: `A near miss with ${first}. The demo somehow still impressed people.`,
      mood: "Managed expectations",
    };
  }

  return {
    winnings: 0,
    message:
      "No match. Those tokens were converted directly into latency and branding.",
    mood: "Inference complete",
  };
}

function renderShop() {
  shopItems.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    const button = fragment.querySelector(".shop-item");

    fragment.querySelector(".shop-name").textContent = item.name;
    fragment.querySelector(".shop-price").textContent = `${item.price} tokens`;
    fragment.querySelector(".shop-blurb").textContent = item.blurb;

    button.addEventListener("click", () => {
      if (state.balance < item.price) {
        setMessage(
          `You need ${item.price - state.balance} more tokens to buy ${item.name}. Please spin harder.`,
          "Budget constrained"
        );
        pushLog(`Attempted to buy ${item.name}, but finance blocked the transaction.`);
        return;
      }

      state.balance -= item.price;
      setMessage(
        `Purchased ${item.name}. The roadmap got worse, but the branding got stronger.`,
        "Tokens successfully vaporized"
      );
      pushLog(`Spent ${item.price} tokens on ${item.name}. No measurable improvement detected.`);
      updateScoreboard();
      refreshShopLocks();
      saveState();
    });

    button.dataset.price = String(item.price);
    shopGrid.appendChild(fragment);
  });
}

function refreshShopLocks() {
  const buttons = shopGrid.querySelectorAll(".shop-item");
  buttons.forEach((button) => {
    button.disabled = state.spinning || state.balance < Number(button.dataset.price);
  });
}

async function animateReels(finalResult) {
  const updates = reels.map((reel, index) => {
    const symbolEl = reel.querySelector(".symbol");
    reel.classList.add("spinning");

    return new Promise((resolve) => {
      let ticks = 0;
      const duration = 520 + index * 260;
      const interval = setInterval(() => {
        symbolEl.textContent = randomSymbol();
        ticks += 1;
      }, 90);

      window.setTimeout(() => {
        clearInterval(interval);
        symbolEl.textContent = finalResult[index];
        reel.classList.remove("spinning");
        resolve();
      }, duration + ticks * 2);
    });
  });

  await Promise.all(updates);
}

async function spin() {
  if (state.spinning || state.balance < state.bet) {
    return;
  }

  state.spinning = true;
  state.balance -= state.bet;
  updateScoreboard();
  refreshShopLocks();
  setMessage("Spinning up the model. Please wait while confidence inflates.", "Tokens in flight");

  const result = [randomSymbol(), randomSymbol(), randomSymbol()];
  state.lastResult = result;
  await animateReels(result);

  const payout = getPayout(result);
  state.balance += payout.winnings;

  if (payout.jackpotHit) {
    state.jackpot += 50;
  }

  state.spinning = false;
  setMessage(payout.message, payout.mood);
  pushLog(`Spin result: ${result.join(" / ")}. Net payout: ${payout.winnings} tokens.`);
  updateScoreboard();
  refreshShopLocks();

  if (state.balance < state.bet) {
    setMessage(
      "You are nearly out of tokens. This is the closest the app gets to realism.",
      "Runway evaporating"
    );
  }

  saveState();
}

betRange.addEventListener("input", (event) => {
  state.bet = Number(event.target.value);
  updateScoreboard();
  saveState();
});

spinButton.addEventListener("click", spin);

loadState();
state.lastResult.forEach((symbol, index) => {
  const symbolEl = reels[index]?.querySelector(".symbol");
  if (symbolEl) {
    symbolEl.textContent = symbol;
  }
});
renderShop();
updateScoreboard();
refreshShopLocks();
