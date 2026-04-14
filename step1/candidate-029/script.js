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
    name: "Executive Buzzword Pack",
    price: 25,
    effect: "Adds 3 points of confidence without changing the outcome.",
  },
  {
    name: "Premium Prompt Polish",
    price: 40,
    effect: "Converts plain confusion into artisanal confusion.",
  },
  {
    name: "Serverless Vision Deck",
    price: 70,
    effect: "A slide deck proving your jackpot was definitely strategy.",
  },
  {
    name: "Ethics DLC",
    price: 55,
    effect: "Briefly suppresses the urge to automate everything.",
  },
];

const state = {
  tokens: 120,
  spinCost: 15,
  spinning: false,
  glareMode: false,
};

const reels = [
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
  document.querySelector("#reel3"),
];

const tokenBalance = document.querySelector("#tokenBalance");
const spinCost = document.querySelector("#spinCost");
const hypeMeter = document.querySelector("#hypeMeter");
const message = document.querySelector("#message");
const spinButton = document.querySelector("#spinButton");
const betRange = document.querySelector("#betRange");
const shop = document.querySelector("#shop");
const shopTemplate = document.querySelector("#shopItemTemplate");
const themeToggle = document.querySelector("#themeToggle");
const storageKey = "token-furnace-save";

function loadState() {
  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.tokens = typeof parsed.tokens === "number" ? parsed.tokens : state.tokens;
    state.spinCost = typeof parsed.spinCost === "number" ? parsed.spinCost : state.spinCost;
    state.glareMode = Boolean(parsed.glareMode);
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
    }),
  );
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function updateUi() {
  tokenBalance.textContent = String(state.tokens);
  spinCost.textContent = String(state.spinCost);
  betRange.value = String(state.spinCost);
  document.body.classList.toggle("day-glare", state.glareMode);

  if (state.tokens >= 180) {
    hypeMeter.textContent = "Series A Delusion";
  } else if (state.tokens >= 100) {
    hypeMeter.textContent = "Cautiously Delusional";
  } else if (state.tokens >= 40) {
    hypeMeter.textContent = "Pivoting to Consulting";
  } else {
    hypeMeter.textContent = "Bootstrapped Panic";
  }

  spinButton.disabled = state.spinning || state.tokens < state.spinCost;
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

    title.textContent = `${item.name} · ${item.price} tokens`;
    meta.textContent = item.effect;
    node.disabled = state.tokens < item.price;
    node.addEventListener("click", () => buyItem(item));

    shop.appendChild(node);
  });
}

function buyItem(item) {
  if (state.tokens < item.price) {
    setMessage("Insufficient tokens. The machine recommends calling this 'lean innovation'.");
    return;
  }

  state.tokens -= item.price;
  setMessage(`Purchased ${item.name}. ${item.effect}`);
  updateUi();
  renderShop();
}

function evaluateSpin(results) {
  const labels = results.map((result) => result.label);
  const icons = results.map((result) => result.icon);
  const uniqueIcons = new Set(icons).size;

  if (uniqueIcons === 1) {
    const payout = state.spinCost * 5;
    state.tokens += payout;
    setMessage(`Jackpot: ${labels[0]} x3. You gained ${payout} tokens and a dangerous level of confidence.`);
    return;
  }

  if (uniqueIcons === 2) {
    const payout = state.spinCost * 2;
    state.tokens += payout;
    setMessage(`Partial alignment. You recovered ${payout} tokens before the demo gods noticed.`);
    return;
  }

  setMessage("No alignment. Your tokens have been reinvested into a vague AI roadmap.");
}

function animateSpin() {
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
        const finalSymbol = randomSymbol();
        reel.textContent = finalSymbol.icon;
        reel.classList.remove("spinning");
        resolve(finalSymbol);
      }, duration);
    });
  });

  Promise.all(results).then((finalResults) => {
    evaluateSpin(finalResults);
    state.spinning = false;
    updateUi();
    renderShop();
  });
}

function handleSpin() {
  if (state.spinning) {
    return;
  }

  if (state.tokens < state.spinCost) {
    setMessage("You are out of tokens. Please seek funding or lower your burn rate.");
    return;
  }

  state.tokens -= state.spinCost;
  animateSpin();
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

loadState();
reels.forEach((reel) => {
  reel.textContent = randomSymbol().icon;
});

updateUi();
renderShop();
