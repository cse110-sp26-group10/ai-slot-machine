const symbols = [
  "Prompt Juice",
  "GPU Tears",
  "404 Hype",
  "Context Maxxed",
  "Synergy Loop",
  "Hallucination",
  "Vibe-Coded",
  "Token Burn",
  "Infinite Beta"
];

const impulseBuys = [
  "Bought Pro Max Ultra autocomplete. It recommends brunch.",
  "Paid for an AI meeting summary of a meeting that never happened.",
  "Subscribed to Ethical Cloud Vibes for zero measurable benefit.",
  "Unlocked premium jargon. You can now say 'agentic' twice as fast.",
  "Purchased a context window extension. It mostly stores regret.",
  "Funded a stealth startup that turns prompts into slide decks."
];

const state = {
  balance: 120,
  spinCost: 10,
  lastDelta: 0,
  history: [],
  purchases: []
};

const reelElements = [0, 1, 2].map((index) => document.getElementById(`reel${index}`));
const tokenBalance = document.getElementById("tokenBalance");
const lastDelta = document.getElementById("lastDelta");
const message = document.getElementById("message");
const spinCost = document.getElementById("spinCost");
const historyList = document.getElementById("historyList");
const purchaseLog = document.getElementById("purchaseLog");
const spinButton = document.getElementById("spinButton");
const spendButton = document.getElementById("spendButton");
const historyTemplate = document.getElementById("historyItemTemplate");
const purchaseTemplate = document.getElementById("purchaseItemTemplate");

const storageKey = "token-tycoon-3000-state";

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    state.balance = Number.isFinite(parsed.balance) ? parsed.balance : state.balance;
    state.lastDelta = Number.isFinite(parsed.lastDelta) ? parsed.lastDelta : state.lastDelta;
    state.history = Array.isArray(parsed.history) ? parsed.history.slice(0, 8) : state.history;
    state.purchases = Array.isArray(parsed.purchases) ? parsed.purchases.slice(0, 6) : state.purchases;
  } catch (_error) {
    // Ignore corrupted local storage and continue with defaults.
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      balance: state.balance,
      lastDelta: state.lastDelta,
      history: state.history.slice(0, 8),
      purchases: state.purchases.slice(0, 6)
    })
  );
}

function setMessage(text, tone = "") {
  message.textContent = text;
  message.className = `message-banner ${tone}`.trim();
}

function renderStats() {
  tokenBalance.textContent = String(state.balance);
  lastDelta.textContent = `${state.lastDelta >= 0 ? "+" : ""}${state.lastDelta}`;
  spinCost.textContent = String(state.spinCost);

  const broke = state.balance < state.spinCost;
  spinButton.disabled = broke;
  spendButton.disabled = state.balance < 25;

  if (broke) {
    setMessage(
      "You are out of tokens. The AI has pivoted to selling inspiration instead.",
      "loss"
    );
  }
}

function renderHistory() {
  historyList.textContent = "";

  if (!state.history.length) {
    const empty = document.createElement("li");
    empty.className = "history-item";
    empty.textContent = "No spins yet. Suspiciously responsible behavior.";
    historyList.append(empty);
    return;
  }

  state.history.forEach((entry) => {
    const node = historyTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".history-symbols").textContent = entry.symbols.join(" • ");

    const delta = node.querySelector(".history-delta");
    delta.textContent = `${entry.delta >= 0 ? "+" : ""}${entry.delta}`;
    delta.classList.add(entry.delta >= 0 ? "positive" : "negative");

    historyList.append(node);
  });
}

function renderPurchases() {
  purchaseLog.textContent = "";

  if (!state.purchases.length) {
    const empty = document.createElement("li");
    empty.className = "purchase-item";
    empty.textContent = "No terrible purchases yet. Investors are nervous.";
    purchaseLog.append(empty);
    return;
  }

  state.purchases.forEach((entry) => {
    const node = purchaseTemplate.content.firstElementChild.cloneNode(true);
    node.textContent = entry;
    purchaseLog.append(node);
  });
}

function renderAll() {
  renderStats();
  renderHistory();
  renderPurchases();
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function calculateResult(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const includesHallucination = result.includes("Hallucination");
  const includesTokenBurn = result.includes("Token Burn");

  if (values[0] === 3) {
    return {
      payout: 90 + (includesHallucination ? 15 : 0),
      tone: "win",
      text: "Jackpot. The machine claims your prompt has achieved consciousness."
    };
  }

  if (values[0] === 2) {
    return {
      payout: 28 + (includesHallucination ? 7 : 0),
      tone: "win",
      text: "Pair match. Enough tokens to fund another doomed AI wrapper."
    };
  }

  if (includesTokenBurn) {
    return {
      payout: 8,
      tone: "spend",
      text: "Token Burn appeared, which somehow counts as a rebate in this economy."
    };
  }

  return {
    payout: 0,
    tone: "loss",
    text: "No match. The board recommends pivoting to enterprise agents."
  };
}

function addHistory(symbolSet, delta) {
  state.history.unshift({ symbols: symbolSet, delta });
  state.history = state.history.slice(0, 8);
}

function updateReels(symbolSet) {
  reelElements.forEach((reel, index) => {
    reel.textContent = symbolSet[index];
  });
}

function animateSpin(finalSymbols) {
  return Promise.all(
    reelElements.map((reel, index) => {
      reel.classList.add("spinning");

      return new Promise((resolve) => {
        const start = performance.now();
        const duration = 700 + index * 250;

        function tick(now) {
          if (now - start < duration) {
            reel.textContent = randomSymbol();
            requestAnimationFrame(tick);
            return;
          }

          reel.classList.remove("spinning");
          reel.textContent = finalSymbols[index];
          resolve();
        }

        requestAnimationFrame(tick);
      });
    })
  );
}

async function spin() {
  if (state.balance < state.spinCost) {
    renderStats();
    return;
  }

  spinButton.disabled = true;
  spendButton.disabled = true;

  state.balance -= state.spinCost;
  state.lastDelta = -state.spinCost;
  renderStats();
  setMessage("Spinning reels and laundering optimism through CSS...", "");

  const result = [randomSymbol(), randomSymbol(), randomSymbol()];
  await animateSpin(result);

  const outcome = calculateResult(result);
  state.balance += outcome.payout;
  state.lastDelta = outcome.payout - state.spinCost;
  addHistory(result, state.lastDelta);
  setMessage(outcome.text, outcome.tone);
  renderAll();
  saveState();
}

function spendTokens() {
  const cost = 25;
  if (state.balance < cost) {
    setMessage("Not enough tokens to buy artisanal AI nonsense.", "loss");
    renderStats();
    return;
  }

  state.balance -= cost;
  state.lastDelta = -cost;

  const purchase =
    impulseBuys[Math.floor(Math.random() * impulseBuys.length)];
  state.purchases.unshift(purchase);
  state.purchases = state.purchases.slice(0, 6);

  setMessage(purchase, "spend");
  renderAll();
  saveState();
}

spinButton.addEventListener("click", spin);
spendButton.addEventListener("click", spendTokens);

loadState();
updateReels([randomSymbol(), randomSymbol(), randomSymbol()]);
renderAll();
