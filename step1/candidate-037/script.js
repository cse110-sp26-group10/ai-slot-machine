const symbols = [
  { value: "GPU", weight: 2, flavor: "The cluster hummed approvingly." },
  { value: "AGI", weight: 1, flavor: "A keynote deck just materialized." },
  { value: "PROMPT", weight: 3, flavor: "Ten interns applaud your wording." },
  { value: "TOKEN", weight: 4, flavor: "A tiny rebate from the API abyss." },
  { value: "LAG", weight: 4, flavor: "The spinner stalled to simulate realism." },
  { value: "404", weight: 3, flavor: "Benchmark not found." },
  { value: "HYPE", weight: 3, flavor: "Valuation up, product unchanged." },
  { value: "VIBE", weight: 3, flavor: "No one knows why this works." },
];

const weightedSymbols = symbols.flatMap((symbol) =>
  Array.from({ length: symbol.weight }, () => symbol)
);

const reels = [...document.querySelectorAll("[data-reel]")];
const balanceEl = document.getElementById("token-balance");
const costEl = document.getElementById("spin-cost");
const jackpotEl = document.getElementById("jackpot-count");
const statusEl = document.getElementById("status-message");
const spinButton = document.getElementById("spin-button");
const topUpButton = document.getElementById("top-up-button");
const toastTemplate = document.getElementById("toast-template");

const state = {
  balance: 120,
  spinCost: 15,
  jackpots: 0,
  spinning: false,
};

const quips = {
  broke: [
    "You are out of tokens. The AI suggests upgrading to Enterprise.",
    "Wallet empty. Time to call this 'a strategic compute investment.'",
    "No credits left. Please enjoy this complimentary thought leadership.",
  ],
  pair: [
    "Two symbols matched. The board calls that traction.",
    "Nice pair. Your seed round survives another week.",
    "Partial alignment achieved. Finance remains cautiously optimistic.",
  ],
  loss: [
    "No match. Your tokens have been converted directly into latency.",
    "The house keeps your prompt budget and emits a vague apology.",
    "Rough spin. At least the dashboard says engagement is strong.",
  ],
  topUp: [
    "A fresh tranche of speculative capital has arrived: +45 tokens.",
    "An angel investor mistook this for infrastructure. +45 tokens.",
    "Someone said 'agentic' in a meeting. +45 tokens.",
  ],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function drawSymbol() {
  return pickRandom(weightedSymbols);
}

function render() {
  balanceEl.textContent = state.balance;
  costEl.textContent = state.spinCost;
  jackpotEl.textContent = state.jackpots;
  spinButton.textContent = `Burn ${state.spinCost} Tokens`;
  spinButton.disabled = state.spinning || state.balance < state.spinCost;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

function scoreSpin(values) {
  const counts = values.reduce((map, value) => {
    map[value] = (map[value] || 0) + 1;
    return map;
  }, {});

  const uniqueValues = Object.keys(counts);
  const [first] = values;
  const triple = uniqueValues.length === 1;
  const pair = !triple && Object.values(counts).some((count) => count === 2);

  if (triple && first === "GPU") {
    return { payout: 120, message: "Triple GPU. The cloud bill briefly pays you back.", win: true };
  }

  if (triple && first === "AGI") {
    return { payout: 90, message: "Triple AGI. Investors cheer before asking for a demo.", win: true };
  }

  if (triple && first === "PROMPT") {
    return { payout: 70, message: "Triple PROMPT. Your artisanal wording has monetized itself.", win: true };
  }

  if (triple) {
    return { payout: 45, message: `Triple ${first}. Strange, but apparently profitable.`, win: true };
  }

  if (pair) {
    return { payout: 20, message: pickRandom(quips.pair), win: true };
  }

  return { payout: 0, message: pickRandom(quips.loss), win: false };
}

async function animateSpin() {
  const results = reels.map(() => drawSymbol());

  await Promise.all(
    reels.map((reel, index) => {
      const label = reel.querySelector(".reel-symbol");
      reel.classList.remove("win");
      reel.classList.add("spinning");

      return new Promise((resolve) => {
        const interval = window.setInterval(() => {
          label.textContent = drawSymbol().value;
        }, 90);

        window.setTimeout(() => {
          window.clearInterval(interval);
          label.textContent = results[index].value;
          reel.classList.remove("spinning");
          resolve();
        }, 700 + index * 260);
      });
    })
  );

  return results.map((result) => result.value);
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    if (state.balance < state.spinCost) {
      setStatus(pickRandom(quips.broke));
      showToast("Top up required. The machine feeds on tokens.");
    }
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  render();
  setStatus("Spinning... converting your runway into probabilistic vibes.");

  const values = await animateSpin();
  const outcome = scoreSpin(values);
  state.balance += outcome.payout;

  if (outcome.payout >= 90) {
    state.jackpots += 1;
    reels.forEach((reel) => reel.classList.add("win"));
    showToast("Jackpot. Somewhere, a founder just tweeted a thread.");
  } else if (outcome.win) {
    const counts = values.reduce((map, value) => {
      map[value] = (map[value] || 0) + 1;
      return map;
    }, {});
    Object.entries(counts)
      .filter(([, count]) => count > 1)
      .forEach(([value]) => {
        reels.forEach((reel) => {
          if (reel.querySelector(".reel-symbol").textContent === value) {
            reel.classList.add("win");
          }
        });
      });
  }

  const flavor = symbols.find((symbol) => symbol.value === values[0])?.flavor ?? "";
  setStatus(`${outcome.message} ${flavor}`);
  state.spinCost = Math.min(40, state.spinCost + 1);
  state.spinning = false;
  render();
}

function topUp() {
  state.balance += 45;
  state.spinCost = Math.max(15, state.spinCost - 2);
  render();
  const message = pickRandom(quips.topUp);
  setStatus(message);
  showToast(message);
}

spinButton.addEventListener("click", spin);
topUpButton.addEventListener("click", topUp);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    spin();
  }
});

render();
