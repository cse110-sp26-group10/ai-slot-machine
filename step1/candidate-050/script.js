const STORAGE_KEY = "token-furnace-save";
const SYMBOLS = ["TOKEN", "GPU", "AGENT", "HYPE", "PROMPT", "404"];
const PAYOUTS = {
  TOKEN: 90,
  GPU: 60,
  AGENT: 45,
};

const state = loadState();
const balanceEl = document.querySelector("#token-balance");
const jackpotEl = document.querySelector("#jackpot");
const spinCostEl = document.querySelector("#spin-cost");
const spinButton = document.querySelector("#spin-button");
const slider = document.querySelector("#bet-slider");
const resultMessage = document.querySelector("#result-message");
const machine = document.querySelector("#machine");
const resetButton = document.querySelector("#reset-button");
const messages = Object.fromEntries(
  [...document.querySelector("#messages-template").content.children].map((node) => [
    node.dataset.key,
    node.textContent,
  ])
);

render();

slider.addEventListener("input", () => {
  state.bet = Number(slider.value);
  saveState();
  render();
});

spinButton.addEventListener("click", async () => {
  if (state.balance < state.bet) {
    announce(messages.broke);
    thump([50, 30, 50]);
    return;
  }

  state.balance -= state.bet;
  saveState();
  render();
  setControlsDisabled(true);
  machine.classList.add("spinning");

  const results = [];
  for (let i = 0; i < 3; i += 1) {
    results.push(await spinReel(i));
  }

  machine.classList.remove("spinning");
  const winnings = score(results);
  state.balance += winnings;
  state.totalWon += Math.max(winnings, 0);
  saveState();
  renderResults(results, winnings);
  setControlsDisabled(false);
});

resetButton.addEventListener("click", () => {
  Object.assign(state, defaultState());
  saveState();
  render();
  announce("Wallet reset. The machine forgives nothing, but it does allow retries.");
});

function defaultState() {
  return {
    balance: 120,
    bet: 15,
    totalWon: 0,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  balanceEl.textContent = String(state.balance);
  jackpotEl.textContent = String(state.totalWon);
  spinCostEl.textContent = String(state.bet);
  spinButton.textContent = `Burn ${state.bet} tokens`;
  slider.value = String(state.bet);
  spinButton.disabled = state.balance < state.bet;
}

async function spinReel(index) {
  const target = document.querySelector(`#reel-${index}`);

  for (let tick = 0; tick < 16 + index * 5; tick += 1) {
    target.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    clickTone(180 + index * 50 + tick * 8, 0.025);
    await wait(55 + index * 10);
  }

  const finalSymbol = weightedPick();
  target.textContent = finalSymbol;
  animateReveal(target);
  return finalSymbol;
}

function weightedPick() {
  const roll = Math.random();
  if (roll < 0.16) return "TOKEN";
  if (roll < 0.31) return "GPU";
  if (roll < 0.46) return "AGENT";
  if (roll < 0.64) return "PROMPT";
  if (roll < 0.82) return "HYPE";
  return "404";
}

function score(results) {
  const [a, b, c] = results;

  if (a === b && b === c) {
    return PAYOUTS[a] ?? 35;
  }

  if (a === b || b === c || a === c) {
    return 20;
  }

  return 0;
}

function renderResults(results, winnings) {
  machine.classList.toggle("win", winnings > 0);
  setTimeout(() => machine.classList.remove("win"), 1200);

  if (winnings === PAYOUTS.TOKEN && results.every((item) => item === "TOKEN")) {
    announce(messages.jackpot);
    celebrate(720, 0.16);
    thump([120, 40, 140]);
    return;
  }

  if (winnings === PAYOUTS.GPU && results.every((item) => item === "GPU")) {
    announce(messages.gpu);
    celebrate(540, 0.12);
    return;
  }

  if (winnings === PAYOUTS.AGENT && results.every((item) => item === "AGENT")) {
    announce(messages.agent);
    celebrate(460, 0.11);
    return;
  }

  if (winnings === 20) {
    announce(`${messages.double} You clawed back ${winnings} tokens.`);
    celebrate(360, 0.08);
    return;
  }

  announce(`${messages.miss} You donated ${state.bet} tokens to the spreadsheet economy.`);
}

function announce(message) {
  resultMessage.textContent = message;
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1.02;
    utterance.pitch = 0.88;
    window.speechSynthesis.speak(utterance);
  }
}

function setControlsDisabled(disabled) {
  spinButton.disabled = disabled || state.balance < state.bet;
  slider.disabled = disabled;
  resetButton.disabled = disabled;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateReveal(element) {
  element.animate(
    [
      { transform: "translateY(-10px) scale(0.96)", opacity: 0.3 },
      { transform: "translateY(0) scale(1)", opacity: 1 },
    ],
    {
      duration: 220,
      easing: "cubic-bezier(.19,1,.22,1)",
    }
  );
}

let audioContext;

function clickTone(frequency, duration) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  audioContext ??= new AudioCtx();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = "triangle";
  gain.gain.value = 0.02;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration);
}

function celebrate(baseFrequency, duration) {
  clickTone(baseFrequency, duration);
  clickTone(baseFrequency * 1.25, duration + 0.03);
  clickTone(baseFrequency * 1.5, duration + 0.05);
  thump([80, 20, 120]);
}

function thump(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
