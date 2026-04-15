const symbols = [
  { icon: "🤖", label: "Hallucination Engine" },
  { icon: "🪙", label: "Token Drip" },
  { icon: "🔥", label: "GPU Meltdown" },
  { icon: "📉", label: "ROI Mirage" },
  { icon: "💼", label: "Enterprise Synergy" },
  { icon: "🧠", label: "Synthetic Genius" },
  { icon: "💸", label: "Prompt Overspend" },
];

const shopItems = [
  {
    id: "buzzword-pack",
    name: "Executive Buzzword Pack",
    price: 25,
    effect: "Raises your hype floor and makes every win sound intentional.",
  },
  {
    id: "prompt-polish",
    name: "Premium Prompt Polish",
    price: 40,
    effect: "Installs a tasteful amount of alignment bias into future spins.",
  },
  {
    id: "vision-deck",
    name: "Serverless Vision Deck",
    price: 70,
    effect: "Adds 2 free spins and a laminated aura of inevitability.",
  },
  {
    id: "ethics-dlc",
    name: "Ethics DLC",
    price: 55,
    effect: "Refunds part of your losses for the next 5 bad decisions.",
  },
];

function createDefaultState() {
  return {
    tokens: 120,
    spinCost: 15,
    spinning: false,
    glareMode: false,
    streak: 0,
    lastPayout: 0,
    confidenceBoost: 0,
    alignmentBias: false,
    freeSpins: 0,
    safetyNetSpins: 0,
    ownedItems: [],
    history: [],
  };
}

const state = createDefaultState();

const reels = [
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
  document.querySelector("#reel3"),
];

const tokenBalance = document.querySelector("#tokenBalance");
const spinCost = document.querySelector("#spinCost");
const hypeMeter = document.querySelector("#hypeMeter");
const winStreak = document.querySelector("#winStreak");
const lastPayout = document.querySelector("#lastPayout");
const ownedPerks = document.querySelector("#ownedPerks");
const oddsNote = document.querySelector("#oddsNote");
const message = document.querySelector("#message");
const spinButton = document.querySelector("#spinButton");
const betRange = document.querySelector("#betRange");
const shop = document.querySelector("#shop");
const shopTemplate = document.querySelector("#shopItemTemplate");
const historyList = document.querySelector("#historyList");
const themeToggle = document.querySelector("#themeToggle");
const resetButton = document.querySelector("#resetButton");
const storageKey = "token-furnace-save";

function loadState() {
  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);

    state.tokens = Number.isFinite(parsed.tokens) ? parsed.tokens : state.tokens;
    state.spinCost = [5, 10, 15, 20, 25, 30].includes(parsed.spinCost)
      ? parsed.spinCost
      : state.spinCost;
    state.glareMode = Boolean(parsed.glareMode);
    state.streak = Number.isFinite(parsed.streak) ? Math.max(0, parsed.streak) : 0;
    state.lastPayout = Number.isFinite(parsed.lastPayout) ? Math.max(0, parsed.lastPayout) : 0;
    state.confidenceBoost = Number.isFinite(parsed.confidenceBoost)
      ? Math.max(0, parsed.confidenceBoost)
      : 0;
    state.alignmentBias = Boolean(parsed.alignmentBias);
    state.freeSpins = Number.isFinite(parsed.freeSpins) ? Math.max(0, parsed.freeSpins) : 0;
    state.safetyNetSpins = Number.isFinite(parsed.safetyNetSpins)
      ? Math.max(0, parsed.safetyNetSpins)
      : 0;
    state.ownedItems = Array.isArray(parsed.ownedItems) ? parsed.ownedItems : [];
    state.history = Array.isArray(parsed.history) ? parsed.history.slice(0, 6) : [];
  } catch {
    window.localStorage.removeItem(storageKey);
  }
}

function persistState() {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      tokens: state.tokens,
      spinCost: state.spinCost,
      glareMode: state.glareMode,
      streak: state.streak,
      lastPayout: state.lastPayout,
      confidenceBoost: state.confidenceBoost,
      alignmentBias: state.alignmentBias,
      freeSpins: state.freeSpins,
      safetyNetSpins: state.safetyNetSpins,
      ownedItems: state.ownedItems,
      history: state.history,
    }),
  );
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function addHistory(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, 6);
}

function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "history-item history-item-empty";
    emptyItem.textContent = "No incidents yet. The machine is waiting for a strategic mistake.";
    historyList.appendChild(emptyItem);
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    item.textContent = entry;
    historyList.appendChild(item);
  });
}

function getOwnedPerkNames() {
  return shopItems
    .filter((item) => state.ownedItems.includes(item.id))
    .map((item) => item.name);
}

function getHypeLabel() {
  const sentimentScore = state.tokens + state.confidenceBoost * 35 + state.streak * 12;

  if (sentimentScore >= 240) {
    return "Unicorn Cosplay";
  }

  if (sentimentScore >= 170) {
    return "Series A Delusion";
  }

  if (sentimentScore >= 90) {
    return "Cautiously Delusional";
  }

  if (sentimentScore >= 40) {
    return "Pivoting to Consulting";
  }

  return "Bootstrapped Panic";
}

function getOddsCopy() {
  const notes = [];

  if (state.freeSpins > 0) {
    notes.push(`${state.freeSpins} comp spin${state.freeSpins === 1 ? "" : "s"}`);
  }

  if (state.alignmentBias) {
    notes.push("alignment bias installed");
  }

  if (state.safetyNetSpins > 0) {
    notes.push(`ethics refund active for ${state.safetyNetSpins}`);
  }

  return notes.length > 0 ? notes.join(" • ") : "No guarantees. Several buzzwords.";
}

function updateUi() {
  tokenBalance.textContent = String(state.tokens);
  spinCost.textContent = String(state.spinCost);
  winStreak.textContent = String(state.streak);
  lastPayout.textContent = String(state.lastPayout);
  betRange.value = String(state.spinCost);
  hypeMeter.textContent = getHypeLabel();
  ownedPerks.textContent = getOwnedPerkNames().join(", ") || "None Yet";
  oddsNote.textContent = getOddsCopy();
  document.body.classList.toggle("day-glare", state.glareMode);

  themeToggle.textContent = state.glareMode ? "Reduce Glare" : "Toggle Glare";
  spinButton.textContent = state.freeSpins > 0 ? "Spin on Credit" : "Spin for Tokens";
  spinButton.disabled = state.spinning || (state.tokens < state.spinCost && state.freeSpins === 0);
  resetButton.disabled = state.spinning;
  betRange.disabled = state.spinning;

  persistState();
}

function setMessage(text) {
  message.textContent = text;
}

function renderShop() {
  shop.innerHTML = "";

  shopItems.forEach((item) => {
    const node = shopTemplate.content.firstElementChild.cloneNode(true);
    const title = node.querySelector(".shop-title");
    const meta = node.querySelector(".shop-meta");
    const alreadyOwned = state.ownedItems.includes(item.id);

    title.textContent = `${item.name} · ${item.price} tokens`;
    meta.textContent = alreadyOwned ? `Owned. ${item.effect}` : item.effect;
    node.disabled = state.spinning || alreadyOwned || state.tokens < item.price;
    node.setAttribute("aria-pressed", String(alreadyOwned));
    node.addEventListener("click", () => buyItem(item));

    shop.appendChild(node);
  });
}

function buyItem(item) {
  if (state.ownedItems.includes(item.id)) {
    setMessage(`${item.name} is already in production. Further monetization has been deferred.`);
    return;
  }

  if (state.tokens < item.price) {
    setMessage("Insufficient tokens. The machine recommends calling this 'lean innovation'.");
    return;
  }

  state.tokens -= item.price;
  state.ownedItems.push(item.id);

  if (item.id === "buzzword-pack") {
    state.confidenceBoost += 1;
  }

  if (item.id === "prompt-polish") {
    state.alignmentBias = true;
  }

  if (item.id === "vision-deck") {
    state.freeSpins += 2;
  }

  if (item.id === "ethics-dlc") {
    state.safetyNetSpins += 5;
  }

  const entry = `Purchased ${item.name}. ${item.effect}`;
  addHistory(entry);
  setMessage(entry);
  updateUi();
  renderShop();
  renderHistory();
}

function generateSpinResults() {
  const results = [randomSymbol(), randomSymbol(), randomSymbol()];

  if (state.alignmentBias && Math.random() < 0.18) {
    const sourceIndex = Math.floor(Math.random() * results.length);
    const targetIndex = (sourceIndex + 1 + Math.floor(Math.random() * 2)) % results.length;
    results[targetIndex] = results[sourceIndex];
  }

  return results;
}

function evaluateSpin(results, usedFreeSpin) {
  const labels = results.map((result) => result.label);
  const icons = results.map((result) => result.icon);
  const uniqueIcons = new Set(icons).size;
  const streakBonus = state.streak > 0 ? state.streak * 5 : 0;

  state.lastPayout = 0;

  if (uniqueIcons === 1) {
    state.streak += 1;
    state.lastPayout = state.spinCost * 5 + streakBonus;
    state.tokens += state.lastPayout;
    state.confidenceBoost += 1;

    const jackpotMessage = `Jackpot: ${labels[0]} x3. You gained ${state.lastPayout} tokens and immediate keynote energy.`;
    addHistory(jackpotMessage);
    setMessage(jackpotMessage);
    return;
  }

  if (uniqueIcons === 2) {
    state.streak += 1;
    state.lastPayout = state.spinCost * 2 + streakBonus;
    state.tokens += state.lastPayout;

    const pairMessage = `Partial alignment. ${state.lastPayout} tokens recovered before the demo gods noticed.`;
    addHistory(pairMessage);
    setMessage(pairMessage);
    return;
  }

  state.streak = 0;

  if (state.safetyNetSpins > 0) {
    const refund = Math.ceil(state.spinCost * 0.4);
    state.safetyNetSpins -= 1;
    state.lastPayout = refund;
    state.tokens += refund;

    const refundMessage = `Complete collapse. Ethics DLC refunded ${refund} tokens${usedFreeSpin ? " on a free spin somehow" : ""}.`;
    addHistory(refundMessage);
    setMessage(refundMessage);
    return;
  }

  const lossMessage = "No alignment. Your tokens have been reinvested into a vague AI roadmap.";
  addHistory(lossMessage);
  setMessage(lossMessage);
}

function animateSpin(finalResults) {
  state.spinning = true;
  updateUi();

  reels.forEach((reel) => reel.classList.add("spinning"));

  const results = reels.map((reel, index) => {
    return new Promise((resolve) => {
      const duration = 700 + index * 220;
      const interval = window.setInterval(() => {
        reel.textContent = randomSymbol().icon;
      }, 90);

      window.setTimeout(() => {
        window.clearInterval(interval);
        reel.textContent = finalResults[index].icon;
        reel.classList.remove("spinning");
        resolve(finalResults[index]);
      }, duration);
    });
  });

  return Promise.all(results).then((resolvedResults) => {
    state.spinning = false;
    return resolvedResults;
  });
}

function handleSpin() {
  if (state.spinning) {
    return;
  }

  const usedFreeSpin = state.freeSpins > 0;

  if (!usedFreeSpin && state.tokens < state.spinCost) {
    setMessage("You are out of tokens. Please seek funding or lower your burn rate.");
    return;
  }

  if (usedFreeSpin) {
    state.freeSpins -= 1;
  } else {
    state.tokens -= state.spinCost;
  }

  const finalResults = generateSpinResults();

  animateSpin(finalResults).then((resolvedResults) => {
    evaluateSpin(resolvedResults, usedFreeSpin);
    updateUi();
    renderShop();
    renderHistory();
  });
}

function resetGame() {
  if (state.spinning) {
    return;
  }

  const confirmed = window.confirm("Reset the run and wipe the current machine delusions?");

  if (!confirmed) {
    return;
  }

  Object.assign(state, createDefaultState());
  reels.forEach((reel) => {
    reel.textContent = randomSymbol().icon;
    reel.classList.remove("spinning");
  });
  addHistory("Run reset. A fresh batch of confidence has been provisioned.");
  setMessage("Run reset. The machine has forgotten your previous strategy.");
  updateUi();
  renderShop();
  renderHistory();
}

betRange.addEventListener("input", (event) => {
  state.spinCost = Number(event.target.value);
  updateUi();
});

spinButton.addEventListener("click", handleSpin);

themeToggle.addEventListener("click", () => {
  state.glareMode = !state.glareMode;
  updateUi();
});

resetButton.addEventListener("click", resetGame);

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }

  const target = document.activeElement;
  const isFormControl =
    target instanceof HTMLInputElement ||
    target instanceof HTMLButtonElement ||
    target instanceof HTMLTextAreaElement;

  if (isFormControl) {
    return;
  }

  event.preventDefault();
  handleSpin();
});

loadState();
reels.forEach((reel) => {
  reel.textContent = randomSymbol().icon;
});

if (state.history.length === 0) {
  addHistory("Machine online. The satire budget is fully allocated.");
}

updateUi();
renderShop();
renderHistory();
