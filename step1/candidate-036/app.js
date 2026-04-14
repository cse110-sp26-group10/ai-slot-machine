const symbols = [
  {
    icon: "🪙",
    name: "Token Rain",
    messages: [
      "A mysterious leaderboard has declared this a breakout quarter.",
      "The model made numbers go up, which is close enough to value."
    ]
  },
  {
    icon: "🤖",
    name: "Hallucination",
    messages: [
      "The machine is speaking confidently about facts it invented.",
      "Synergy detected. Accuracy remains optional."
    ]
  },
  {
    icon: "🔥",
    name: "GPU Fire",
    messages: [
      "Investors love heat. Accounting departments less so.",
      "Your data center smells like ambition and warm plastic."
    ]
  },
  {
    icon: "📉",
    name: "Down Round",
    messages: [
      "The deck still says hockey stick, so morale is technically up.",
      "Congratulations on discovering negative exponential growth."
    ]
  },
  {
    icon: "🧠",
    name: "Prompt Wizard",
    messages: [
      "A 900-word prompt has replaced actual product strategy.",
      "You have achieved full stack vibes."
    ]
  },
  {
    icon: "💸",
    name: "Cloud Bill",
    messages: [
      "The invoice arrived wearing a blazer and asking hard questions.",
      "Every token spent today will become somebody else's quarterly bonus."
    ]
  }
];

const storageKey = "token-furnace-state";

function loadState() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed.balance !== "number") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

const persistedState = loadState();

const state = {
  balance: persistedState?.balance ?? 120,
  spinCost: 15,
  spinning: false,
  lastResult: []
};

const reelEls = Array.from(document.querySelectorAll(".reel"));
const balanceEl = document.querySelector("#balance");
const costEl = document.querySelector("#cost");
const hypeEl = document.querySelector("#hype");
const messageEl = document.querySelector("#message");
const subMessageEl = document.querySelector("#sub-message");
const spinButton = document.querySelector("#spin-button");
const demoButton = document.querySelector("#demo-button");

const hypeLevels = [
  { min: 0, label: "Stealth Panic" },
  { min: 40, label: "Seed Stage" },
  { min: 100, label: "Series A Delusion" },
  { min: 180, label: "Unicorn Adjacent" },
  { min: 300, label: "Publicly Overhyped" }
];

function pickRandomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function renderReels(result) {
  result.forEach((symbol, index) => {
    document.querySelector(`#reel-${index}-icon`).textContent = symbol.icon;
    document.querySelector(`#reel-${index}-name`).textContent = symbol.name;
  });
}

function renderStats() {
  balanceEl.textContent = String(state.balance);
  costEl.textContent = String(state.spinCost);

  const hype = [...hypeLevels].reverse().find((level) => state.balance >= level.min);
  hypeEl.textContent = hype.label;

  spinButton.disabled = state.spinning || state.balance < state.spinCost;
  demoButton.disabled = state.spinning || state.balance >= state.spinCost;
}

function saveState() {
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      balance: state.balance
    })
  );
}

function analyzeResult(result) {
  const names = result.map((item) => item.name);
  const counts = names.reduce((accumulator, name) => {
    accumulator[name] = (accumulator[name] || 0) + 1;
    return accumulator;
  }, {});

  const maxMatch = Math.max(...Object.values(counts));
  const uniqueWinningName = Object.keys(counts).find((name) => counts[name] === maxMatch);
  const matchedSymbol = result.find((item) => item.name === uniqueWinningName);

  if (names.every((name) => name === "GPU Fire")) {
    return {
      payout: 150,
      title: "Jackpot: the GPUs are glowing brighter than the business model.",
      detail: "Three GPU Fires. Nobody can hear the profit margin screaming over the fan noise."
    };
  }

  if (maxMatch === 3) {
    return {
      payout: 60,
      title: `Triple ${matchedSymbol.name}. The market has mistaken variance for destiny.`,
      detail: matchedSymbol.messages[Math.floor(Math.random() * matchedSymbol.messages.length)]
    };
  }

  if (maxMatch === 2) {
    return {
      payout: 25,
      title: `Two ${matchedSymbol.name}s. The deck is being forwarded to partners as we speak.`,
      detail: "A partial match counts as product-market fit if everybody squints."
    };
  }

  return {
    payout: 0,
    title: "No match. The tokens have been successfully converted into buzzwords.",
    detail: "Inference complete: you are now poorer but more platform-native."
  };
}

function setWinState(result, payout) {
  const names = result.map((item) => item.name);
  reelEls.forEach((reel, index) => {
    const name = names[index];
    const count = names.filter((item) => item === name).length;
    reel.classList.toggle("is-win", payout > 0 && count > 1);
  });
}

function animateSpin() {
  reelEls.forEach((reel) => reel.classList.add("is-spinning"));

  const intervals = reelEls.map((reel, index) => {
    return window.setInterval(() => {
      const random = pickRandomSymbol();
      document.querySelector(`#reel-${index}-icon`).textContent = random.icon;
      document.querySelector(`#reel-${index}-name`).textContent = random.name;
    }, 90 + index * 40);
  });

  return intervals;
}

function stopAnimation(intervals) {
  intervals.forEach((interval) => window.clearInterval(interval));
  reelEls.forEach((reel) => reel.classList.remove("is-spinning"));
}

function runSpin() {
  if (state.spinning || state.balance < state.spinCost) {
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  renderStats();
  messageEl.textContent = "Running inference on your financial future...";
  subMessageEl.textContent = "The reels are consulting a deeply unserious foundation model.";
  reelEls.forEach((reel) => reel.classList.remove("is-win"));

  const intervals = animateSpin();

  window.setTimeout(() => {
    const result = [pickRandomSymbol(), pickRandomSymbol(), pickRandomSymbol()];
    const outcome = analyzeResult(result);

    state.lastResult = result;
    state.balance += outcome.payout;
    state.spinning = false;

    stopAnimation(intervals);
    renderReels(result);
    setWinState(result, outcome.payout);
    saveState();
    renderStats();

    messageEl.textContent = outcome.title;
    subMessageEl.textContent = outcome.detail;
  }, 1350);
}

function bailout() {
  if (state.spinning || state.balance >= state.spinCost) {
    return;
  }

  state.balance += 50;
  saveState();
  messageEl.textContent = "Bridge round secured. Your runway has been extended by vibes.";
  subMessageEl.textContent = "Fifty emergency tokens appeared after a founder posted 'thoughts?' on LinkedIn.";
  renderStats();
}

spinButton.addEventListener("click", runSpin);
demoButton.addEventListener("click", bailout);

renderStats();
