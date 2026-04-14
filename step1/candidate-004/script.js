const SYMBOLS = ["GPU", "PROMPT", "HYPE", "SLOP", "BOT", "COPE"];
const STORAGE_KEY = "token-grinder-3000-save";
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const CASHOUT_COST = 30;

const SHOP_ITEMS = [
  {
    id: "hallucination-shield",
    name: "Hallucination Shield",
    price: 60,
    description: "Reduces embarrassment by 0%. Looks fantastic in decks.",
  },
  {
    id: "context-window-xl",
    name: "Context Window XL",
    price: 95,
    description: "For when 8 tabs of panic just are not enough.",
  },
  {
    id: "ethics-addon",
    name: "Ethics Add-On",
    price: 150,
    description: "Ships as a modal. Nobody reads it, but investors clap.",
  },
];

const state = loadState();

const tokenCount = document.querySelector("#tokenCount");
const spinCost = document.querySelector("#spinCost");
const aiMood = document.querySelector("#aiMood");
const message = document.querySelector("#message");
const spinButton = document.querySelector("#spinButton");
const cashoutButton = document.querySelector("#cashoutButton");
const resetButton = document.querySelector("#resetButton");
const machineCard = document.querySelector(".machine-card");
const shopGrid = document.querySelector("#shopGrid");
const shopItemTemplate = document.querySelector("#shopItemTemplate");
const reels = [0, 1, 2].map((index) => document.querySelector(`#reel${index}`));

let audioContext;
let isSpinning = false;

render();
renderShop();

spinButton.addEventListener("click", handleSpin);
cashoutButton.addEventListener("click", handleCashout);
resetButton.addEventListener("click", handleReset);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) {
      return {
        tokens: STARTING_TOKENS,
        mood: "Mildly overfit",
        ownedItems: [],
      };
    }
    return {
      tokens: Number.isFinite(saved.tokens) ? saved.tokens : STARTING_TOKENS,
      mood: typeof saved.mood === "string" ? saved.mood : "Mildly overfit",
      ownedItems: Array.isArray(saved.ownedItems) ? saved.ownedItems : [],
    };
  } catch {
    return {
      tokens: STARTING_TOKENS,
      mood: "Mildly overfit",
      ownedItems: [],
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenCount.textContent = state.tokens;
  spinCost.textContent = SPIN_COST;
  aiMood.textContent = state.mood;
  spinButton.textContent = `Burn ${SPIN_COST} tokens`;
  cashoutButton.textContent = `Spend ${CASHOUT_COST} on premium slop`;
  const locked = isSpinning || state.tokens < SPIN_COST;
  spinButton.disabled = locked;
  cashoutButton.disabled = isSpinning || state.tokens < CASHOUT_COST;
  resetButton.disabled = isSpinning;
}

function renderShop() {
  shopGrid.textContent = "";

  SHOP_ITEMS.forEach((item) => {
    const fragment = shopItemTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".shop-item");
    const name = fragment.querySelector(".shop-name");
    const description = fragment.querySelector(".shop-description");
    const price = fragment.querySelector(".shop-price");
    const button = fragment.querySelector(".buy-button");
    const owned = state.ownedItems.includes(item.id);

    name.textContent = item.name;
    description.textContent = item.description;
    price.textContent = `${item.price} tokens`;
    button.textContent = owned ? "Owned" : "Buy";
    button.disabled = owned || state.tokens < item.price || isSpinning;

    if (owned) {
      article.classList.add("owned");
    }

    button.addEventListener("click", () => buyItem(item));
    shopGrid.appendChild(fragment);
  });
}

async function handleSpin() {
  if (isSpinning || state.tokens < SPIN_COST) {
    setMessage("Not enough tokens. Even the machine respects your budget.", "loss");
    return;
  }

  isSpinning = true;
  state.tokens -= SPIN_COST;
  state.mood = "Aggressively predictive";
  render();
  renderShop();
  setMessage("Computing statistically questionable destiny...", "");
  tickVibration([25, 40, 25]);
  machineCard.classList.add("flash");
  playTone(220, 0.08, "sawtooth");

  const results = await Promise.all(
    reels.map((reel, index) => spinReel(reel, 700 + index * 260))
  );

  const payout = calculatePayout(results);
  state.tokens += payout.tokens;
  state.mood = payout.mood;

  if (payout.tokens > 0) {
    setMessage(`${payout.message} You now have ${state.tokens} tokens.`, "win");
    playTone(520, 0.14, "triangle");
    playTone(760, 0.16, "square", 0.08);
    tickVibration([40, 25, 60]);
  } else {
    setMessage(`${payout.message} The machine keeps your money for "training."`, "loss");
    playTone(150, 0.12, "sine");
  }

  isSpinning = false;
  render();
  renderShop();
  saveState();
  window.setTimeout(() => machineCard.classList.remove("flash"), 400);
}

function spinReel(reel, duration) {
  return new Promise((resolve) => {
    let elapsed = 0;
    reel.classList.add("spinning");

    const interval = window.setInterval(() => {
      elapsed += 90;
      reel.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

      if (elapsed >= duration) {
        window.clearInterval(interval);
        reel.classList.remove("spinning");
        const finalSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        reel.textContent = finalSymbol;
        resolve(finalSymbol);
      }
    }, 90);
  });
}

function calculatePayout(results) {
  const counts = countSymbols(results);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [bestSymbol, matchCount] = entries[0];

  if (matchCount === 3) {
    if (bestSymbol === "GPU") {
      return {
        tokens: 120,
        mood: "Peak compute goblin",
        message: "Triple GPU. The cluster loves you back for once.",
      };
    }
    if (bestSymbol === "PROMPT") {
      return {
        tokens: 90,
        mood: "Prompt maximalist",
        message: "Triple PROMPT. You have discovered artisanal autocomplete.",
      };
    }
    if (bestSymbol === "HYPE") {
      return {
        tokens: 70,
        mood: "Series-A radiant",
        message: "Triple HYPE. Absolutely nobody asked for benchmarks.",
      };
    }
    return {
      tokens: 55,
      mood: "Wildly benchmarked",
      message: `Triple ${bestSymbol}. A niche but meaningful AI victory.`,
    };
  }

  if (matchCount === 2) {
    return {
      tokens: 25,
      mood: "Confidently approximate",
      message: `A pair of ${bestSymbol}. Close enough for venture funding.`,
    };
  }

  return {
    tokens: 0,
    mood: "Hallucinating synergies",
    message: "Three unique symbols. Your model has pivoted to poetry.",
  };
}

function countSymbols(results) {
  return results.reduce((accumulator, symbol) => {
    accumulator[symbol] = (accumulator[symbol] || 0) + 1;
    return accumulator;
  }, {});
}

function buyItem(item) {
  if (isSpinning) {
    return;
  }

  if (state.ownedItems.includes(item.id)) {
    setMessage(`${item.name} is already yours. The sunk cost is permanent.`, "shop");
    return;
  }

  if (state.tokens < item.price) {
    setMessage(`You need ${item.price - state.tokens} more tokens for ${item.name}.`, "loss");
    return;
  }

  state.tokens -= item.price;
  state.ownedItems.push(item.id);
  state.mood = "Monetization pilled";
  setMessage(`Purchased ${item.name}. A bold investment in decorative AI nonsense.`, "shop");
  playTone(330, 0.1, "triangle");
  tickVibration([20, 20, 20]);
  render();
  renderShop();
  saveState();
}

function handleCashout() {
  if (isSpinning) {
    return;
  }

  if (state.tokens < CASHOUT_COST) {
    setMessage("Premium slop requires 30 tokens up front. Innovation is expensive.", "loss");
    return;
  }

  const randomItems = [
    "a subscription to infinite beta",
    "one enterprise-grade shrug",
    "a commemorative prompt engineer visor",
    "priority access to tomorrow's apology post",
  ];
  const prize = randomItems[Math.floor(Math.random() * randomItems.length)];

  state.tokens -= CASHOUT_COST;
  setMessage(`You spend ${CASHOUT_COST} tokens on ${prize}. Value remains unverified.`, "shop");
  state.mood = "Consumer of premium slop";
  playTone(280, 0.1, "triangle");
  tickVibration([18, 24, 18]);
  render();
  renderShop();
  saveState();
}

function handleReset() {
  state.tokens = STARTING_TOKENS;
  state.mood = "Mildly overfit";
  state.ownedItems = [];
  reels.forEach((reel) => {
    reel.textContent = "GPU";
    reel.classList.remove("spinning");
  });
  setMessage("Empire reset. The tokens are fresh and the shame is gone.", "");
  render();
  renderShop();
  saveState();
}

function setMessage(text, tone) {
  message.textContent = text;
  message.className = "message";
  if (tone) {
    message.classList.add(tone);
  }
}

function tickVibration(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function playTone(frequency, duration, type, delay = 0) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) {
    return;
  }

  if (!audioContext) {
    audioContext = new Context();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const startAt = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}
