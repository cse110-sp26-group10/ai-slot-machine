const STORAGE_KEY = "token-drain-3000-state";
const STARTING_BALANCE = 120;
const SPIN_COST = 15;

const symbols = [
  { icon: "🤖", label: "assistant", weight: 4 },
  { icon: "🪙", label: "token", weight: 4 },
  { icon: "🔥", label: "gpu", weight: 3 },
  { icon: "🧠", label: "reasoning", weight: 3 },
  { icon: "📉", label: "unit economics", weight: 2 },
  { icon: "💸", label: "burn rate", weight: 2 }
];

const spinBanter = [
  "Spending tokens to save time, then spending time to justify the tokens.",
  "Your prompt has entered the monetization funnel.",
  "The machine is benchmarking vibes against revenue.",
  "Another spin funded by pure strategic ambiguity.",
  "Investors nodded. Nobody understood the dashboard."
];

const winLines = {
  "🤖🤖🤖": { payout: 90, text: "Three assistants aligned. Congratulations on automating an email draft." },
  "🪙🪙🪙": { payout: 120, text: "Token jackpot. A startup just raised on this exact business model." },
  "🔥🔥🔥": { payout: 75, text: "All GPUs lit up. Your cloud bill also won." },
  "🧠🧠🧠": { payout: 80, text: "Peak reasoning. The model now explains why the invoice doubled." },
  "📉📉📉": { payout: 55, text: "You found the hidden efficiency plan: lower expectations." },
  "💸💸💸": { payout: 45, text: "Burn rate bonus. It is technically a liquidity event." }
};

const state = loadState();

const elements = {
  machine: document.querySelector(".machine"),
  balance: document.getElementById("tokenBalance"),
  spinCost: document.getElementById("spinCost"),
  spinCount: document.getElementById("spinCount"),
  totalWon: document.getElementById("totalWon"),
  totalSpent: document.getElementById("totalSpent"),
  bestPayout: document.getElementById("bestPayout"),
  message: document.getElementById("message"),
  spinButton: document.getElementById("spinButton"),
  resetButton: document.getElementById("resetButton"),
  reels: [
    document.getElementById("reel1"),
    document.getElementById("reel2"),
    document.getElementById("reel3")
  ]
};

elements.spinCost.textContent = SPIN_COST;

render();

elements.spinButton.addEventListener("click", async () => {
  if (state.balance < SPIN_COST) {
    setMessage("Out of tokens. The AI economy suggests acquiring new capital or lowering your standards.");
    elements.machine.classList.remove("is-winning");
    elements.machine.classList.add("is-broke");
    vibrate([80, 40, 80]);
    return;
  }

  state.balance -= SPIN_COST;
  state.totalSpent += SPIN_COST;
  state.spins += 1;
  render();
  setMessage(randomItem(spinBanter));
  elements.spinButton.disabled = true;
  elements.machine.classList.remove("is-broke", "is-winning");

  const result = await spinReels();
  const key = result.map((item) => item.icon).join("");
  const uniqueCount = new Set(result.map((item) => item.icon)).size;
  const exactWin = winLines[key];

  let payout = 0;
  let resultText = "";

  if (exactWin) {
    payout = exactWin.payout;
    resultText = exactWin.text;
  } else if (uniqueCount === 1) {
    payout = 35;
    resultText = "A fully synchronized hallucination. Unexpectedly profitable.";
  } else if (uniqueCount === 2) {
    payout = 20;
    resultText = "Two of a kind. The board is calling it product-market fit.";
  } else if (key.includes("🪙💸") || key.includes("💸🪙")) {
    payout = 10;
    resultText = "You won just enough tokens to keep making bad decisions.";
  } else {
    resultText = "No payout. The machine recommends a premium subscription tier.";
  }

  state.balance += payout;
  state.totalWon += payout;
  state.bestPayout = Math.max(state.bestPayout, payout);
  saveState(state);
  render();

  if (payout > 0) {
    celebrateWin(payout, resultText);
  } else {
    setMessage(resultText);
    vibrate(120);
  }

  elements.spinButton.disabled = false;
});

elements.resetButton.addEventListener("click", () => {
  Object.assign(state, freshState());
  saveState(state);
  render();
  setMessage("Hype cycle reset. Fresh tokens deployed into the content furnace.");
  elements.machine.classList.remove("is-broke", "is-winning");
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...freshState(), ...JSON.parse(raw) } : freshState();
  } catch {
    return freshState();
  }
}

function freshState() {
  return {
    balance: STARTING_BALANCE,
    spins: 0,
    totalWon: 0,
    totalSpent: 0,
    bestPayout: 0
  };
}

function saveState(nextState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function render() {
  elements.balance.textContent = state.balance;
  elements.spinCount.textContent = state.spins;
  elements.totalWon.textContent = state.totalWon;
  elements.totalSpent.textContent = state.totalSpent;
  elements.bestPayout.textContent = state.bestPayout;
  elements.spinButton.disabled = state.balance < SPIN_COST;
}

function setMessage(text) {
  elements.message.textContent = text;
}

async function spinReels() {
  const results = [];

  for (let index = 0; index < elements.reels.length; index += 1) {
    const reel = elements.reels[index];
    const result = weightedRandomSymbol();
    results.push(result);
    await animateReel(reel, result, index * 120);
  }

  return results;
}

function animateReel(reel, finalSymbol, delay) {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      const burst = 10 + Math.floor(Math.random() * 5);
      let ticks = 0;

      const interval = window.setInterval(() => {
        reel.textContent = randomItem(symbols).icon;
        ticks += 1;

        if (ticks >= burst) {
          window.clearInterval(interval);
          reel.textContent = finalSymbol.icon;
          reel.animate(
            [
              { transform: "translateY(-10px) scale(1.02)" },
              { transform: "translateY(0) scale(1)" }
            ],
            { duration: 260, easing: "cubic-bezier(.17,.89,.32,1.28)" }
          );
          resolve();
        }
      }, 80);
    }, delay);
  });
}

function weightedRandomSymbol() {
  const pool = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol));
  return randomItem(pool);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function celebrateWin(payout, resultText) {
  elements.machine.classList.remove("is-broke");
  elements.machine.classList.add("is-winning");
  setMessage(`${resultText} +${payout} tokens credited to your speculative AI wallet.`);
  vibrate([80, 50, 120]);

  if ("speechSynthesis" in window && payout >= 75) {
    const utterance = new SpeechSynthesisUtterance("Jackpot. Narrative achieved.");
    utterance.rate = 1;
    utterance.pitch = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

saveState(state);
