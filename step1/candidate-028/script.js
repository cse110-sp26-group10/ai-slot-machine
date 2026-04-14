const SYMBOLS = [
  { name: "TOKEN", payout: 50 },
  { name: "GPU", payout: 30 },
  { name: "PROMPT", payout: 20 },
  { name: "BUG", payout: -10 },
  { name: "PIVOT", payout: 0 },
  { name: "HYPE", payout: 10 },
];

const STORAGE_KEY = "candidate-28-token-burner-state";
const SPIN_COST = 15;

const state = loadState();

const tokenBalance = document.querySelector("#tokenBalance");
const streakCount = document.querySelector("#streakCount");
const statusMessage = document.querySelector("#statusMessage");
const lastOutcome = document.querySelector("#lastOutcome");
const burnSummary = document.querySelector("#burnSummary");
const spinButton = document.querySelector("#spinButton");
const shareButton = document.querySelector("#shareButton");
const resetButton = document.querySelector("#resetButton");
const reels = [
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
  document.querySelector("#reel3"),
];
const machineCard = document.querySelector(".machine-card");

render();

spinButton.addEventListener("click", spin);
shareButton.addEventListener("click", shareProgress);
resetButton.addEventListener("click", resetGame);

function loadState() {
  const fallback = {
    balance: 120,
    streak: 0,
    spins: 0,
    totalSpent: 0,
    totalWon: 0,
    lastMessage: "No monetization event yet.",
  };

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenBalance.textContent = state.balance;
  streakCount.textContent = state.streak;
  lastOutcome.textContent = state.lastMessage;
  burnSummary.textContent =
    `${state.spins} spins, ${state.totalSpent} tokens burned, ${state.totalWon} tokens extracted from the hype market.`;
  spinButton.disabled = state.balance < SPIN_COST;

  if (state.balance < SPIN_COST) {
    statusMessage.textContent = "Wallet depleted. Please secure additional funding from a confused board.";
  }
}

async function spin() {
  if (state.balance < SPIN_COST) {
    return;
  }

  state.balance -= SPIN_COST;
  state.spins += 1;
  state.totalSpent += SPIN_COST;
  statusMessage.textContent = "Generating premium nonsense...";
  spinButton.disabled = true;

  reels.forEach((reel) => reel.classList.add("spinning"));

  for (let index = 0; index < reels.length; index += 1) {
    await wait(350 + index * 180);
    const symbol = getRandomSymbol();
    reels[index].textContent = symbol.name;
    chirp(240 + index * 100, 0.05);
  }

  reels.forEach((reel) => reel.classList.remove("spinning"));

  const outcome = reels.map((reel) => reel.textContent);
  const result = evaluateOutcome(outcome);

  state.balance += result.delta;
  state.totalWon += Math.max(result.delta, 0);
  state.streak = result.delta > 0 ? state.streak + 1 : 0;
  state.lastMessage = result.message;

  statusMessage.textContent = result.status;
  flashMachine(result.delta > 0 ? "win" : "loss");
  chirp(result.delta > 0 ? 660 : 140, 0.12);

  if (state.streak >= 3) {
    state.balance += 25;
    state.totalWon += 25;
    statusMessage.textContent = "Engagement loop achieved. Bonus 25 tokens for weaponized retention.";
    state.lastMessage = `${result.message} Bonus: retention team awarded 25 tokens.`;
  }

  saveState();
  render();
}

function evaluateOutcome(outcome) {
  const counts = outcome.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const [topSymbol, topCount] = entries[0];

  if (topCount === 3) {
    const jackpotMap = {
      TOKEN: 150,
      GPU: 90,
      PROMPT: 70,
      BUG: -40,
      PIVOT: 45,
      HYPE: 60,
    };

    const delta = jackpotMap[topSymbol] ?? 50;
    return {
      delta,
      message: `Triple ${topSymbol}. The machine declared this a strategic breakthrough.`,
      status: delta > 0
        ? `Jackpot: ${delta} tokens. Congratulations on your synthetic value creation.`
        : `Triple ${topSymbol}. Remarkable. You paid extra for the outage.`,
    };
  }

  if (topCount === 2) {
    if (topSymbol === "BUG") {
      return {
        delta: -20,
        message: "Two BUG symbols. The red team just got promoted at your expense.",
        status: "Incident detected. -20 tokens for emergency patch theater.",
      };
    }

    return {
      delta: 30,
      message: `Two ${topSymbol} symbols. That is enough momentum for a keynote.`,
      status: "Partial match. +30 tokens from people who stopped reading after the headline.",
    };
  }

  return {
    delta: 0,
    message: "No match. The app produced vibes instead of value.",
    status: "Miss. Tokens converted directly into heat.",
  };
}

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function resetGame() {
  state.balance = 120;
  state.streak = 0;
  state.spins = 0;
  state.totalSpent = 0;
  state.totalWon = 0;
  state.lastMessage = "Wallet reset. The cap table has been spiritually cleansed.";

  reels[0].textContent = "TOKEN";
  reels[1].textContent = "GPU";
  reels[2].textContent = "PROMPT";
  statusMessage.textContent = "Fresh funding round closed. Please misuse it responsibly.";

  saveState();
  render();
}

async function shareProgress() {
  const summary = `Candidate 28: I have ${state.balance} AI tokens after ${state.spins} spins in Token Burner 9000. This is somehow called innovation.`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Candidate 28: Token Burner 9000",
        text: summary,
      });
      statusMessage.textContent = "Public embarrassment successfully syndicated.";
      return;
    }

    await navigator.clipboard.writeText(summary);
    statusMessage.textContent = "Score copied to clipboard for maximum cringe distribution.";
  } catch {
    statusMessage.textContent = "Share failed. Even the browser refused to endorse this strategy.";
  }
}

function flashMachine(mode) {
  machineCard.classList.remove("flash-win", "flash-loss");
  machineCard.classList.add(mode === "win" ? "flash-win" : "flash-loss");
  window.setTimeout(() => {
    machineCard.classList.remove("flash-win", "flash-loss");
  }, 550);
}

function chirp(frequency, duration) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  const audioContext = chirp.audioContext || new AudioContextClass();
  chirp.audioContext = audioContext;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.02;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  const now = audioContext.currentTime;
  oscillator.start(now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.stop(now + duration);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
