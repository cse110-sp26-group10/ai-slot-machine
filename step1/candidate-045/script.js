const SYMBOLS = [
  "PROMPT",
  "TOKEN",
  "GPU",
  "CACHE",
  "VIBE",
  "SPAM",
  "HYPE",
  "404",
];

const state = loadState();

const walletValue = document.querySelector("#walletValue");
const spinCostValue = document.querySelector("#spinCostValue");
const jackpotValue = document.querySelector("#jackpotValue");
const headlineMessage = document.querySelector("#headlineMessage");
const resultValue = document.querySelector("#resultValue");
const snarkValue = document.querySelector("#snarkValue");
const betRange = document.querySelector("#betRange");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");
const reels = Array.from({ length: 3 }, (_, index) =>
  document.querySelector(`#reel${index}`)
);

const snarkByOutcome = {
  jackpot: [
    "Three matching outputs. Somewhere an AI startup just added $400M to its deck.",
    "Jackpot. The machine calls this 'profitable inference,' which should worry you.",
    "The model aligned with shareholder value for 2.4 seconds.",
  ],
  partial: [
    "Two symbols matched. Barely enough signal to justify another demo.",
    "Partial hit. Management is calling it product-market fit.",
    "Congratulations on your modest pile of synthetic optimism.",
  ],
  loss: [
    "No match. Your tokens were converted directly into heat and investor jargon.",
    "The reels hallucinated a business model and billed you anyway.",
    "Another clean transfer from your wallet into the Great GPU Bonfire.",
  ],
  broke: [
    "Wallet depleted. Please insert more tokens or a stronger narrative.",
    "You are out of runway, but not out of AI opinions.",
    "The machine suggests pivoting to 'agentic monetization' and trying again.",
  ],
};

render();

betRange.addEventListener("input", () => {
  state.bet = Number(betRange.value);
  render();
  persistState();
});

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

function spin() {
  if (state.isSpinning) {
    return;
  }

  if (state.wallet < state.bet) {
    showToast("Insufficient tokens. The machine respects insolvency only technically.");
    state.wallet = Math.max(state.wallet, 0);
    setStatus("Out of tokens.", randomFrom(snarkByOutcome.broke));
    render();
    persistState();
    return;
  }

  state.isSpinning = true;
  state.wallet -= state.bet;
  setControlsDisabled(true);
  setStatus("Spinning the context window...", "The cost meter spins faster than the reels.");
  render();
  persistState();

  if ("vibrate" in navigator) {
    navigator.vibrate([30, 20, 40]);
  }

  const finalSymbols = reels.map(() => randomSymbol());

  reels.forEach((reel, index) => {
    reel.classList.add("is-spinning");

    const intervalId = window.setInterval(() => {
      reel.textContent = randomSymbol();
    }, 90 + index * 40);

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      reel.classList.remove("is-spinning");
      reel.textContent = finalSymbols[index];
      if (index === reels.length - 1) {
        settleSpin(finalSymbols);
      }
    }, 850 + index * 380);
  });
}

function settleSpin(symbols) {
  const counts = countMatches(symbols);
  const highestMatch = Math.max(...Object.values(counts));

  let payout = 0;
  let outcome = "loss";
  let headline = "The machine extracted value from you.";
  let result = `Lost ${state.bet} tokens`;

  if (highestMatch === 3) {
    payout = state.bet * 6;
    outcome = "jackpot";
    headline = "Full alignment event. Tokens materialized from pure hype.";
    result = `Jackpot: +${payout} tokens`;
    state.jackpots += 1;
  } else if (highestMatch === 2) {
    payout = state.bet * 2;
    outcome = "partial";
    headline = "The machine grudgingly returned some of your own money.";
    result = `Matched pair: +${payout} tokens`;
  }

  state.wallet += payout;
  state.isSpinning = false;

  const flashClass = outcome === "loss" ? "loss-flash" : "win-flash";
  document.querySelector(".reel-board").classList.add(flashClass);
  window.setTimeout(() => {
    document.querySelector(".reel-board").classList.remove(flashClass);
  }, 600);

  setStatus(result, randomFrom(snarkByOutcome[outcome]));
  headlineMessage.textContent = headline;
  showToast(buildToastMessage(outcome, payout));
  playTone(outcome);
  maybeAnnounce(outcome, result);
  setControlsDisabled(false);
  render();
  persistState();

  if (state.wallet < state.bet) {
    setStatus(resultValue.textContent, randomFrom(snarkByOutcome.broke));
    persistState();
  }
}

function render() {
  walletValue.textContent = String(state.wallet);
  spinCostValue.textContent = String(state.bet);
  jackpotValue.textContent = String(state.jackpots);
  betRange.value = String(state.bet);
  spinButton.disabled = state.isSpinning || state.wallet < state.bet;
}

function resetGame() {
  state.wallet = 120;
  state.bet = 15;
  state.jackpots = 0;
  state.isSpinning = false;
  reels.forEach((reel, index) => {
    reel.textContent = SYMBOLS[index];
    reel.classList.remove("is-spinning");
  });
  headlineMessage.textContent = "Ready to convert vibes into invoiceable compute.";
  setStatus("Economy rebooted.", "Fresh tokens loaded. The satire remains solvent.");
  setControlsDisabled(false);
  render();
  persistState();
  showToast("Game reset. The token bubble has been responsibly reinflated.");
}

function setStatus(result, snark) {
  resultValue.textContent = result;
  snarkValue.textContent = snark;
}

function setControlsDisabled(disabled) {
  spinButton.disabled = disabled;
  betRange.disabled = disabled;
}

function buildToastMessage(outcome, payout) {
  if (outcome === "jackpot") {
    return `Jackpot. ${payout} tokens generated from premium-grade artificial confidence.`;
  }
  if (outcome === "partial") {
    return `Pair matched. ${payout} tokens recovered before the machine changed its mind.`;
  }
  return "Loss recorded. Your wallet subsidized another round of speculative automation.";
}

function maybeAnnounce(outcome, result) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  if (outcome === "jackpot" || outcome === "loss") {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      outcome === "jackpot"
        ? `Jackpot. ${result}. Please enjoy this brief illusion of AI profitability.`
        : "Loss. Tokens consumed. Please continue feeding the machine."
    );
    utterance.rate = 1.05;
    utterance.pitch = outcome === "jackpot" ? 1.2 : 0.8;
    window.speechSynthesis.speak(utterance);
  }
}

function playTone(outcome) {
  if (!("AudioContext" in window || "webkitAudioContext" in window)) {
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = outcome === "loss" ? "sawtooth" : "triangle";
  oscillator.frequency.value = outcome === "jackpot" ? 620 : outcome === "partial" ? 420 : 160;
  gain.gain.value = 0.0001;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscillator.start(now);
  oscillator.stop(now + 0.3);
  oscillator.addEventListener("ended", () => ctx.close(), { once: true });
}

function showToast(message) {
  const existingToast = document.querySelector(".toast");
  if (existingToast) {
    existingToast.remove();
  }

  const template = document.querySelector("#toastTemplate");
  const toast = template.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);
  toast.animate(
    [
      { transform: "translateY(18px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    { duration: 220, easing: "ease-out", fill: "forwards" }
  );

  window.setTimeout(() => {
    toast.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        { transform: "translateY(12px)", opacity: 0 },
      ],
      { duration: 200, easing: "ease-in", fill: "forwards" }
    );
    window.setTimeout(() => toast.remove(), 210);
  }, 2400);
}

function countMatches(symbols) {
  return symbols.reduce((accumulator, symbol) => {
    accumulator[symbol] = (accumulator[symbol] ?? 0) + 1;
    return accumulator;
  }, {});
}

function randomSymbol() {
  return randomFrom(SYMBOLS);
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function loadState() {
  try {
    const rawState = window.localStorage.getItem("token-grinder-state");
    if (!rawState) {
      return { wallet: 120, bet: 15, jackpots: 0, isSpinning: false };
    }
    const parsed = JSON.parse(rawState);
    return {
      wallet: Number(parsed.wallet) || 120,
      bet: [5, 10, 15, 20, 25, 30].includes(Number(parsed.bet)) ? Number(parsed.bet) : 15,
      jackpots: Number(parsed.jackpots) || 0,
      isSpinning: false,
    };
  } catch {
    return { wallet: 120, bet: 15, jackpots: 0, isSpinning: false };
  }
}

function persistState() {
  const snapshot = {
    wallet: state.wallet,
    bet: state.bet,
    jackpots: state.jackpots,
  };
  window.localStorage.setItem("token-grinder-state", JSON.stringify(snapshot));
}
