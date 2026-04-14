const symbols = [
  "GPU",
  "404",
  "LOL",
  "BOT",
  "SPAM",
  "HYPE",
  "COPE",
  "PROMPT",
];

const fakePurchases = [
  "enterprise autocomplete for your toaster",
  "a synthetic thought leader bundle",
  "VIP access to a chatbot apology",
  "six premium hallucinations",
  "cloud-hosted confidence with no benchmarks",
  "a blockchain-ready mood board for agents",
  "one suspiciously expensive GPU nap",
];

const state = {
  balance: 120,
  jackpots: 0,
  spinning: false,
};

const storageKey = "token-burn-casino-save";

const tokenBalance = document.getElementById("tokenBalance");
const betInput = document.getElementById("betInput");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const resultMessage = document.getElementById("resultMessage");
const lastPayout = document.getElementById("lastPayout");
const aiPurchase = document.getElementById("aiPurchase");
const jackpotCount = document.getElementById("jackpotCount");
const reels = Array.from({ length: 3 }, (_, index) => document.getElementById(`reel${index}`));

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    if (typeof parsed.balance === "number") state.balance = parsed.balance;
    if (typeof parsed.jackpots === "number") state.jackpots = parsed.jackpots;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function saveState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ balance: state.balance, jackpots: state.jackpots }),
  );
}

function clampBet(value) {
  if (!Number.isFinite(value)) return 10;
  return Math.min(50, Math.max(5, Math.round(value / 5) * 5));
}

function updateView() {
  tokenBalance.textContent = state.balance.toString();
  jackpotCount.textContent = state.jackpots.toString();
  betInput.value = clampBet(Number(betInput.value)).toString();
}

function choose(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function setMessage(text, mood) {
  resultMessage.textContent = text;
  resultMessage.classList.remove("celebrate", "shake");
  void resultMessage.offsetWidth;
  if (mood) resultMessage.classList.add(mood);
}

function beep(frequency, duration) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!beep.ctx) beep.ctx = new AudioContextClass();
  const ctx = beep.ctx;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.02;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function pulseFeedback(kind) {
  if (navigator.vibrate) {
    navigator.vibrate(kind === "win" ? [80, 40, 80] : [120]);
  }

  if (kind === "win") {
    beep(660, 0.12);
    setTimeout(() => beep(880, 0.16), 110);
  } else {
    beep(180, 0.18);
  }
}

function animateReel(reel, finalSymbol, delay) {
  return new Promise((resolve) => {
    let ticks = 0;
    const totalTicks = 12 + delay * 4;
    const interval = setInterval(() => {
      reel.textContent = choose(symbols);
      ticks += 1;

      if (ticks >= totalTicks) {
        clearInterval(interval);
        reel.textContent = finalSymbol;
        reel.animate(
          [
            { transform: "translateY(-14px)", opacity: 0.6 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 220, easing: "cubic-bezier(.17,.84,.44,1)" },
        );
        resolve();
      }
    }, 70 + delay * 35);
  });
}

function scoreSpin(results, bet) {
  const counts = results.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const topCount = Math.max(...Object.values(counts));
  const [first] = results;

  if (topCount === 3) {
    const jackpot = bet * (first === "GPU" ? 12 : 8);
    return {
      payout: jackpot,
      purchase: "absolutely nothing because this counts as ARR now",
      message:
        first === "GPU"
          ? `Triple GPU. Investors are calling this artificial revenue. You win ${jackpot} tokens.`
          : `Three ${first}s. The machine has mistaken you for a founder. You win ${jackpot} tokens.`,
      jackpot: true,
      mood: "celebrate",
    };
  }

  if (topCount === 2) {
    const payout = bet * 2;
    return {
      payout,
      purchase: choose(fakePurchases),
      message: `Two-of-a-kind. The AI gives back ${payout} tokens, then invoices you for ${choose(
        fakePurchases,
      )}.`,
      jackpot: false,
      mood: "celebrate",
    };
  }

  return {
    payout: 0,
    purchase: choose(fakePurchases),
    message: `No match. ${bet} tokens were immediately reinvested into ${choose(
      fakePurchases,
    )}.`,
    jackpot: false,
    mood: "shake",
  };
}

async function spin() {
  if (state.spinning) return;

  const bet = clampBet(Number(betInput.value));
  if (state.balance < bet) {
    setMessage("Wallet empty. Even satire has a burn rate. Reset or lower the prompt budget.", "shake");
    return;
  }

  state.spinning = true;
  spinButton.disabled = true;
  betInput.disabled = true;

  state.balance -= bet;
  updateView();
  setMessage("Deploying speculative intelligence to the reels...", null);
  aiPurchase.textContent = "compute bill pending";
  lastPayout.textContent = `-${bet} tokens`;

  const results = reels.map(() => choose(symbols));
  await Promise.all(reels.map((reel, index) => animateReel(reel, results[index], index)));

  const outcome = scoreSpin(results, bet);
  state.balance += outcome.payout;
  if (outcome.jackpot) state.jackpots += 1;

  lastPayout.textContent = `${outcome.payout} tokens`;
  aiPurchase.textContent = outcome.purchase;
  setMessage(outcome.message, outcome.mood);
  pulseFeedback(outcome.payout > 0 ? "win" : "lose");

  saveState();
  updateView();

  state.spinning = false;
  spinButton.disabled = false;
  betInput.disabled = false;
}

function reset() {
  state.balance = 120;
  state.jackpots = 0;
  reels.forEach((reel, index) => {
    reel.textContent = ["404", "GPU", "LOL"][index];
  });
  aiPurchase.textContent = "nothing yet";
  lastPayout.textContent = "0 tokens";
  setMessage("Wallet reset. Fresh tokens, same bad decisions.", null);
  saveState();
  updateView();
}

document.querySelectorAll("[data-bet-step]").forEach((button) => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.betStep);
    betInput.value = clampBet(Number(betInput.value) + step).toString();
  });
});

betInput.addEventListener("change", () => {
  betInput.value = clampBet(Number(betInput.value)).toString();
});

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", reset);

loadState();
updateView();
