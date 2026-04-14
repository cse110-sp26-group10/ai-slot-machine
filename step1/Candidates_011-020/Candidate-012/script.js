const STORAGE_KEY = "token-tugger-9000-save";
const SPIN_COST = 15;
const STARTING_BALANCE = 120;

const symbols = [
  { icon: "🤖", label: "Hallucination Bot", weight: 3 },
  { icon: "🪙", label: "Prompt Token", weight: 4 },
  { icon: "🔥", label: "GPU Bonfire", weight: 2 },
  { icon: "📉", label: "Valuation Dip", weight: 3 },
  { icon: "🧃", label: "VC Juice", weight: 2 },
  { icon: "💥", label: "Cloud Outage", weight: 2 },
  { icon: "🧠", label: "Synthetic Genius", weight: 3 },
];

const moods = [
  "Confidently wrong",
  "Pivoting to enterprise",
  "Benchmarkmaxxing",
  "Pre-seed and overheating",
  "Aligned with quarterly goals",
];

const headlines = [
  "Board approves a 14th subscription tier for premium blinking cursors.",
  "Analysts confirm your chatbot now needs a chatbot to explain billing.",
  "Local founder says GPU smoke adds artisanal depth to the product.",
  "Every spin funds a fresh apology post on social media.",
  "The machine is now token-gated for your protection, allegedly.",
];

const excuses = {
  win: [
    "Clearly skill-based. Please ignore the weighted capitalism.",
    "A rare breakthrough in responsible casino-adjacent compute.",
    "The model achieved emergent luck after enough electricity.",
  ],
  mixed: [
    "Partial match. The machine calls that product-market fit.",
    "Good enough for a demo day, not enough for a refund.",
    "Two symbols aligned, just like the pitch deck said they would.",
  ],
  lose: [
    "Those tokens were reallocated to improve executive mindfulness.",
    "Loss detected. The machine is calling it an inference fee.",
    "Variance is just disruption wearing a visor.",
  ],
  broke: [
    "Out of tokens. Time to go freelance as a prompt whisperer.",
    "Liquidity event postponed until you click reboot.",
  ],
};

const balanceEl = document.getElementById("balance");
const moodEl = document.getElementById("mood");
const headlineEl = document.getElementById("headline");
const resultTextEl = document.getElementById("resultText");
const multiplierTextEl = document.getElementById("multiplierText");
const excuseTextEl = document.getElementById("excuseText");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const reelEls = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const cardEl = document.querySelector(".machine-card");

let balance = loadBalance();
let spinning = false;

render();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

function loadBalance() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  const parsed = Number(saved);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : STARTING_BALANCE;
}

function saveBalance() {
  window.localStorage.setItem(STORAGE_KEY, String(balance));
}

function render() {
  balanceEl.textContent = String(balance);
  moodEl.textContent = balance < SPIN_COST ? "Funding winter" : moods[balance % moods.length];
  spinButton.disabled = spinning || balance < SPIN_COST;
  spinButton.textContent = balance < SPIN_COST ? "Need more tokens" : `Spin For ${SPIN_COST} Tokens`;
}

function resetGame() {
  balance = STARTING_BALANCE;
  saveBalance();
  headlineEl.textContent = "Machine rebooted. The hype cycle has been restored.";
  resultTextEl.textContent = "Fresh capital acquired. Please waste it responsibly.";
  multiplierTextEl.textContent = "1x due to selective optimism";
  excuseTextEl.textContent = "A brand-new quarter begins with exactly zero lessons learned.";
  clearFlash();
  updateReels([
    { icon: "🤖" },
    { icon: "🪙" },
    { icon: "🔥" },
  ]);
  render();
}

async function spin() {
  if (spinning || balance < SPIN_COST) {
    if (balance < SPIN_COST) {
      excuseTextEl.textContent = pick(excuses.broke);
    }
    return;
  }

  spinning = true;
  balance -= SPIN_COST;
  saveBalance();
  render();
  clearFlash();
  headlineEl.textContent = pick(headlines);

  if ("vibrate" in navigator) {
    navigator.vibrate([20, 50, 20]);
  }

  reelEls.forEach((reel) => reel.classList.add("spinning"));

  const finalSymbols = [];

  for (let i = 0; i < reelEls.length; i += 1) {
    const reel = reelEls[i];
    await spinReel(reel, i);
    const outcome = weightedPick(symbols);
    finalSymbols.push(outcome);
    reel.textContent = outcome.icon;
    reel.classList.remove("spinning");
  }

  const payout = score(finalSymbols);
  balance += payout.tokens;
  saveBalance();
  presentOutcome(finalSymbols, payout);
  render();
  spinning = false;
  render();
}

function spinReel(reel, index) {
  const duration = 600 + index * 220;
  const interval = 85;

  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      reel.textContent = pick(symbols).icon;
    }, interval);

    window.setTimeout(() => {
      window.clearInterval(timer);
      resolve();
    }, duration);
  });
}

function score(reels) {
  const icons = reels.map((item) => item.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const allMatch = values[0] === 3;
  const pair = values[0] === 2;
  const gpuJackpot = icons.every((icon) => icon === "🔥");
  const outageRefund = icons.every((icon) => icon === "💥");

  if (gpuJackpot) {
    return { tokens: 150, multiplier: "10x thermal event", type: "win" };
  }

  if (outageRefund) {
    return { tokens: SPIN_COST, multiplier: "1x outage refund", type: "mixed" };
  }

  if (allMatch) {
    return { tokens: 90, multiplier: "6x founder delusion", type: "win" };
  }

  if (pair) {
    return { tokens: 30, multiplier: "2x marketable coincidence", type: "mixed" };
  }

  return { tokens: 0, multiplier: "0x pure disruption", type: "lose" };
}

function presentOutcome(reels, payout) {
  const labels = reels.map((item) => item.label).join(" • ");
  const delta = payout.tokens - SPIN_COST;

  resultTextEl.textContent =
    delta >= 0
      ? `${labels}. Net gain: ${delta} tokens.`
      : `${labels}. Net loss: ${Math.abs(delta)} tokens.`;

  multiplierTextEl.textContent = `${payout.multiplier} and ${balance} tokens remain`;
  excuseTextEl.textContent = pick(excuses[payout.type]);

  if (payout.type === "win") {
    cardEl.classList.add("flash-win");
    reelEls.forEach((reel) => reel.classList.add("win"));
    if ("vibrate" in navigator) {
      navigator.vibrate([40, 80, 40, 80, 120]);
    }
  } else if (payout.type === "lose") {
    cardEl.classList.add("flash-lose");
  }

  window.setTimeout(() => {
    reelEls.forEach((reel) => reel.classList.remove("win"));
  }, 450);
}

function updateReels(reels) {
  reelEls.forEach((reel, index) => {
    reel.textContent = reels[index].icon;
  });
}

function clearFlash() {
  cardEl.classList.remove("flash-win", "flash-lose");
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedPick(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
