const STORAGE_KEY = "token-tugger-9000-save";
const SPIN_COST = 15;
const STARTING_BALANCE = 120;

const symbols = [
  { icon: "\u{1F916}", label: "Hallucination Bot", weight: 3 },
  { icon: "\u{1FA99}", label: "Prompt Token", weight: 4 },
  { icon: "\u{1F525}", label: "GPU Bonfire", weight: 2 },
  { icon: "\u{1F4C9}", label: "Valuation Dip", weight: 3 },
  { icon: "\u{1F9C3}", label: "VC Juice", weight: 2 },
  { icon: "\u{1F4A5}", label: "Cloud Outage", weight: 2 },
  { icon: "\u{1F9E0}", label: "Synthetic Genius", weight: 3 },
];

const moods = [
  "Confidently wrong",
  "Pivoting to enterprise",
  "Benchmarkmaxxing",
  "Pre-seed and overheating",
  "Aligned with quarterly goals",
  "Rate-limited by destiny",
];

const headlines = [
  "Board approves a 14th subscription tier for premium blinking cursors.",
  "Analysts confirm your chatbot now needs a chatbot to explain billing.",
  "Local founder says GPU smoke adds artisanal depth to the product.",
  "Every spin funds a fresh apology post on social media.",
  "The machine is now token-gated for your protection, allegedly.",
  "A memo just leaked: your prompt tokens were translated into vibes.",
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

const taxLines = [
  "Platform tax: 4 tokens vanished into a dashboard no one requested.",
  "Safety surcharge: 6 tokens spent preventing comedy, unsuccessfully.",
  "Inference rent: 5 tokens burned to generate a louder loading spinner.",
  "Premium tier uplift: 7 tokens redirected into quarterly optimism.",
  "Compliance snack: 3 tokens eaten by a PDF the size of a brick.",
];

const walletLines = [
  "Wallet says the tokens are real, spiritually if not financially.",
  "Treasury update: one more spin and accounting becomes interpretive dance.",
  "Your token stash just got benchmarked against a toaster with ambition.",
  "The wallet applauds your courage and questions your judgment.",
  "Finance bot reports strong momentum and weaker fundamentals.",
];

const sessionLines = [
  "The dashboard says engagement is up. It means you clicked twice.",
  "Product insists this is retention. Accounting insists otherwise.",
  "A fresh cohort analysis reveals you are still here, somehow.",
];

const balanceEl = document.getElementById("balance");
const moodEl = document.getElementById("mood");
const burnRateEl = document.getElementById("burnRate");
const headlineEl = document.getElementById("headline");
const resultTextEl = document.getElementById("resultText");
const multiplierTextEl = document.getElementById("multiplierText");
const excuseTextEl = document.getElementById("excuseText");
const walletLineEl = document.getElementById("walletLine");
const taxLineEl = document.getElementById("taxLine");
const sessionLineEl = document.getElementById("sessionLine");
const streakLineEl = document.getElementById("streakLine");
const announcerEl = document.getElementById("announcer");
const spinButton = document.getElementById("spinButton");
const shareButton = document.getElementById("shareButton");
const resetButton = document.getElementById("resetButton");
const reelEls = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const cardEl = document.querySelector(".machine-card");

let balance = loadBalance();
let spinning = false;
let lastTax = 0;
let spins = 0;
let sessionNet = 0;
let profitStreak = 0;
let bestProfitStreak = 0;

updateReels([symbols[0], symbols[1], symbols[2]]);
render();

spinButton.addEventListener("click", spin);
shareButton.addEventListener("click", shareStatus);
resetButton.addEventListener("click", resetGame);
document.addEventListener("keydown", handleKeydown);

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
  burnRateEl.textContent = `${lastTax} tokens`;
  moodEl.textContent = balance < SPIN_COST ? "Funding winter" : moods[balance % moods.length];
  sessionLineEl.textContent = `${spins} spins, ${formatSigned(sessionNet)} tokens net. ${pick(sessionLines)}`;
  streakLineEl.textContent = `${bestProfitStreak} profitable spins in a row. Current streak: ${profitStreak}.`;
  spinButton.disabled = spinning || balance < SPIN_COST;
  shareButton.disabled = spinning;
  spinButton.textContent = balance < SPIN_COST ? "Need more tokens" : `Spin For ${SPIN_COST} Tokens`;
}

function resetGame() {
  balance = STARTING_BALANCE;
  lastTax = 0;
  spins = 0;
  sessionNet = 0;
  profitStreak = 0;
  bestProfitStreak = 0;
  saveBalance();
  headlineEl.textContent = "Machine rebooted. The hype cycle has been restored.";
  resultTextEl.textContent = "Fresh capital acquired. Please waste it responsibly.";
  multiplierTextEl.textContent = "1x due to selective optimism";
  excuseTextEl.textContent = "A brand-new quarter begins with exactly zero lessons learned.";
  walletLineEl.textContent = "Seed round cleared. The machine can now afford one dramatic demo.";
  taxLineEl.textContent = "No surprise platform fee yet.";
  sessionLineEl.textContent = "0 spins, 0 tokens net, morale stable enough.";
  streakLineEl.textContent = "0 profitable spins in a row. Sensible, honestly.";
  announce("The token machine was rebooted.");
  clearFlash();
  updateReels([symbols[0], symbols[1], symbols[2]]);
  render();
}

async function spin() {
  if (spinning || balance < SPIN_COST) {
    if (balance < SPIN_COST) {
      excuseTextEl.textContent = pick(excuses.broke);
      announce("Not enough tokens to spin.");
    }
    return;
  }

  spinning = true;
  spins += 1;
  balance -= SPIN_COST;
  lastTax = 0;
  saveBalance();
  render();
  clearFlash();
  headlineEl.textContent = pick(headlines);
  walletLineEl.textContent = pick(walletLines);
  taxLineEl.textContent = "The platform is scanning for a fee to invent.";

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

  const tax = payout.type === "win" ? 0 : randomInt(3, 7);
  lastTax = Math.min(tax, balance);
  balance -= lastTax;
  const delta = payout.tokens - SPIN_COST - lastTax;
  sessionNet += delta;
  if (delta > 0) {
    profitStreak += 1;
    bestProfitStreak = Math.max(bestProfitStreak, profitStreak);
  } else {
    profitStreak = 0;
  }
  saveBalance();

  presentOutcome(finalSymbols, payout, lastTax);
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
  const gpuJackpot = icons.every((icon) => icon === "\u{1F525}");
  const outageRefund = icons.every((icon) => icon === "\u{1F4A5}");

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

function presentOutcome(reels, payout, tax) {
  const labels = reels.map((item) => item.label).join(" \u2022 ");
  const delta = payout.tokens - SPIN_COST - tax;

  resultTextEl.textContent =
    delta >= 0
      ? `${labels}. Net gain: ${delta} tokens.`
      : `${labels}. Net loss: ${Math.abs(delta)} tokens.`;

  multiplierTextEl.textContent = `${payout.multiplier} and ${balance} tokens remain`;
  excuseTextEl.textContent = pick(excuses[payout.type]);
  taxLineEl.textContent = tax === 0 ? "Miracle detected: no extra tax on this spin." : pick(taxLines);
  walletLineEl.textContent = pick(walletLines);

  if (payout.type === "win") {
    cardEl.classList.add("flash-win");
    reelEls.forEach((reel) => reel.classList.add("win"));
    playVictoryTone();

    if ("vibrate" in navigator) {
      navigator.vibrate([40, 80, 40, 80, 120]);
    }
  } else if (payout.type === "lose") {
    cardEl.classList.add("flash-lose");
  } else {
    cardEl.classList.add("flash-mixed");
  }

  announce(`Spin complete. ${resultTextEl.textContent}`);

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
  cardEl.classList.remove("flash-win", "flash-lose", "flash-mixed");
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function announce(message) {
  announcerEl.textContent = message;
}

async function shareStatus() {
  const shareText = `I have ${balance} prompt tokens left in Token Tugger 9000 after ${spins} spins, and the machine still claims this counts as AI progress.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Token Tugger 9000",
        text: shareText,
      });
      headlineEl.textContent = "Your token shame has been syndicated.";
      announce("Shared the current token status.");
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(shareText);
    headlineEl.textContent = "Status copied. The clipboard is now complicit.";
    announce("Copied the current token status to the clipboard.");
    return;
  }

  headlineEl.textContent = "Sharing unavailable. Please describe the disaster manually.";
  announce("Sharing is unavailable in this browser.");
}

function playVictoryTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();

  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  [440, 554.37, 659.25].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.06);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.06);
    oscillator.stop(now + 0.3 + index * 0.06);
  });

  window.setTimeout(() => {
    audioContext.close().catch(() => {});
  }, 700);
}

function formatSigned(value) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function handleKeydown(event) {
  if (event.code !== "Space") {
    return;
  }

  const target = event.target;
  const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tagName === "button" || tagName === "input" || tagName === "textarea") {
    return;
  }

  event.preventDefault();
  spin();
}
