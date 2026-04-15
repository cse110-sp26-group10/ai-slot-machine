const symbols = [
  { icon: "🤖", label: "Model", payout: 18 },
  { icon: "🪙", label: "Token", payout: 22 },
  { icon: "🔥", label: "GPU Fire", payout: 12 },
  { icon: "🧠", label: "Synthetic Insight", payout: 30 },
  { icon: "💸", label: "Burn Rate", payout: 10 },
  { icon: "📉", label: "Valuation Reset", payout: 16 },
];

const spinCost = 15;
const maxHistoryItems = 6;
const storageKey = "token-burn-casino-state-v2";
const defaultAnnouncement = "The machine is ready to monetize your curiosity.";

function buildInitialState() {
  return {
    tokens: 120,
    totalSpent: 0,
    totalWon: 0,
    spinCount: 0,
    winCount: 0,
    streak: 0,
    maxStreak: 0,
    bestPayout: 0,
    lastPayout: 0,
    currentResult: "Welcome back, visionary. The machine is ready to monetize your curiosity.",
    currentSpend: "No tokens wasted yet. A suspiciously efficient quarter.",
    pillTone: "neutral",
    pillLabel: "Market Open",
    lastAnnouncement: defaultAnnouncement,
    history: [
      {
        title: "Quarter opened",
        detail: "Fresh tokens issued. Governance remains weak and vibes remain strong.",
        tone: "neutral",
      },
    ],
  };
}

function loadState() {
  try {
    const savedState = window.localStorage.getItem(storageKey);

    if (!savedState) {
      return buildInitialState();
    }

    const parsedState = JSON.parse(savedState);
    return {
      ...buildInitialState(),
      ...parsedState,
      history: Array.isArray(parsedState.history) && parsedState.history.length > 0
        ? parsedState.history.slice(0, maxHistoryItems)
        : buildInitialState().history,
    };
  } catch {
    return buildInitialState();
  }
}

const state = loadState();
let spinning = false;

const reels = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];

const tokenCount = document.getElementById("token-count");
const spinCostNode = document.getElementById("spin-cost");
const moodNode = document.getElementById("mood");
const winRateNode = document.getElementById("win-rate");
const trendLine = document.getElementById("trend-line");
const spinCountNode = document.getElementById("spin-count");
const streakCountNode = document.getElementById("streak-count");
const bestPayoutNode = document.getElementById("best-payout");
const roiNode = document.getElementById("roi");
const resultLine = document.getElementById("result-line");
const spendLine = document.getElementById("spend-line");
const resultPill = document.getElementById("result-pill");
const historyList = document.getElementById("history-list");
const spinButton = document.getElementById("spin-button");
const speakStatus = document.getElementById("speak-status");
const resetButton = document.getElementById("reset-button");
const machineCard = document.querySelector(".machine-card");
const burstTemplate = document.getElementById("burst-template");

spinCostNode.textContent = String(spinCost);

function saveState() {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // Ignore storage failures so the machine still works in restricted contexts.
  }
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function addHistoryEntry(title, detail, tone) {
  state.history.unshift({ title, detail, tone });
  state.history = state.history.slice(0, maxHistoryItems);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getMood() {
  const net = state.totalWon - state.totalSpent;

  if (state.tokens < spinCost) {
    return "Seeking emergency seed round";
  }

  if (state.streak >= 3 || net >= 45) {
    return "Delusionally liquid";
  }

  if (state.winCount > 0 && net >= 0) {
    return "Cautiously bullish";
  }

  if (state.spinCount >= 4 && state.winCount === 0) {
    return "Rebranding the deck";
  }

  return "Pivoting to B2B";
}

function getTrendLine() {
  if (state.spinCount === 0) {
    return "No spins yet. Analysts remain blissfully uninformed.";
  }

  if (state.streak >= 2) {
    return `Heat check: ${state.streak} straight wins. Compliance has stopped answering email.`;
  }

  if (state.bestPayout >= 60) {
    return `Best quarter event: ${state.bestPayout} tokens from one highly theatrical outcome.`;
  }

  if (state.totalSpent > state.totalWon) {
    return `Burn exceeds output by ${state.totalSpent - state.totalWon} tokens. The board calls this investment.`;
  }

  return `Treasury is up ${state.totalWon - state.totalSpent} tokens. Expect an unnecessary keynote soon.`;
}

function updateResultPill(tone, label) {
  resultPill.className = `result-pill ${tone}`;
  resultPill.textContent = label;
}

function renderHistory() {
  historyList.innerHTML = "";

  state.history.forEach((entry) => {
    const item = document.createElement("li");
    item.className = `history-item ${entry.tone}`;

    const title = document.createElement("strong");
    title.className = "history-title";
    title.textContent = entry.title;

    const detail = document.createElement("p");
    detail.className = "history-detail";
    detail.textContent = entry.detail;

    item.append(title, detail);
    historyList.append(item);
  });
}

function updateHud() {
  const roi = state.totalSpent > 0 ? ((state.totalWon - state.totalSpent) / state.totalSpent) * 100 : 0;
  const winRate = state.spinCount > 0 ? (state.winCount / state.spinCount) * 100 : 0;

  tokenCount.textContent = String(state.tokens);
  moodNode.textContent = getMood();
  winRateNode.textContent = formatPercent(winRate);
  trendLine.textContent = getTrendLine();
  spinCountNode.textContent = String(state.spinCount);
  streakCountNode.textContent = String(state.streak);
  bestPayoutNode.textContent = String(state.bestPayout);
  roiNode.textContent = formatPercent(roi);

  spinButton.disabled = spinning || state.tokens < spinCost;
  spinButton.textContent = spinning
    ? "Consulting the probability engine..."
    : state.tokens >= spinCost
      ? `Spend ${spinCost} tokens to spin`
      : "Out of tokens. Please monetize harder.";

  renderHistory();
}

function setMessage(resultText, spendText, tone, pillLabel) {
  state.currentResult = resultText;
  state.currentSpend = spendText;
  state.pillTone = tone;
  state.pillLabel = pillLabel;
  resultLine.textContent = resultText;
  spendLine.textContent = spendText;
  state.lastAnnouncement = `${resultText} ${spendText}`;

  updateResultPill(tone, pillLabel);

  machineCard.classList.remove("win", "loss");
  void machineCard.offsetWidth;
  machineCard.classList.add(tone);
}

function burstCoins(count) {
  for (let index = 0; index < count; index += 1) {
    const token = burstTemplate.content.firstElementChild.cloneNode(true);
    token.style.setProperty("--x", `${window.innerWidth / 2}px`);
    token.style.setProperty("--y", `${window.innerHeight / 2}px`);
    token.style.setProperty("--dx", `${(Math.random() - 0.5) * 220}px`);
    token.style.setProperty("--dy", `${-80 - Math.random() * 180}px`);
    document.body.appendChild(token);
    token.addEventListener("animationend", () => token.remove(), { once: true });
  }
}

function speakLatestResult() {
  if (!("speechSynthesis" in window)) {
    setMessage(
      "Your browser declined the voice pack upsell.",
      "Even the platform APIs are protecting you from AI hype.",
      "loss",
      "Muted"
    );
    saveState();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.lastAnnouncement);
  utterance.rate = 1.02;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function maybeCelebrate(isBigWin) {
  if ("vibrate" in navigator) {
    navigator.vibrate(isBigWin ? [120, 50, 120, 50, 200] : [90, 40, 90]);
  }
}

function resolveSpin(results) {
  const labels = results.map((entry) => entry.label);
  const uniqueIcons = new Set(results.map((entry) => entry.icon)).size;
  state.spinCount += 1;
  state.totalSpent += spinCost;

  if (uniqueIcons === 1) {
    const payout = results[0].payout * 3;
    state.tokens += payout;
    state.totalWon += payout;
    state.lastPayout = payout;
    state.winCount += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.bestPayout = Math.max(state.bestPayout, payout);
    burstCoins(10);
    maybeCelebrate(true);
    setMessage(
      `Jackpot: triple ${labels[0]}s. The machine minted ${payout} tokens out of pure investor theater.`,
      `Gross burn is ${state.totalSpent} tokens. Net hype remains comfortably detached from reality.`,
      "win",
      "Jackpot"
    );
    addHistoryEntry(
      "Triple-match liquidity event",
      `${labels[0]}s lined up and produced ${payout} tokens. Nobody asked for audited math.`,
      "win"
    );
    saveState();
    return;
  }

  if (uniqueIcons === 2) {
    const payout = 12;
    state.tokens += payout;
    state.totalWon += payout;
    state.lastPayout = payout;
    state.winCount += 1;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.bestPayout = Math.max(state.bestPayout, payout);
    burstCoins(5);
    maybeCelebrate(false);
    setMessage(
      `Two reels aligned. The casino grants ${payout} consolation tokens and calls it AI synergy.`,
      `Lifetime burn: ${state.totalSpent} tokens. This quarter is now being framed as a strategic near-win.`,
      "win",
      "Near Miss"
    );
    addHistoryEntry(
      "Synergy bonus approved",
      `A two-symbol alignment generated ${payout} tokens and a very aggressive internal memo.`,
      "win"
    );
    saveState();
    return;
  }

  state.lastPayout = 0;
  state.streak = 0;
  setMessage(
    "No match. The model confidently predicted vibes instead of value.",
    `You are now ${state.totalSpent} tokens deep into the dream of frictionless automation.`,
    "loss",
    "Miss"
  );
  addHistoryEntry(
    "Forecast missed",
    "The reels produced no usable alignment, but management remains excited about the roadmap.",
    "loss"
  );
  saveState();
}

function animateSpin() {
  const finalResults = reels.map(() => randomSymbol());

  reels.forEach((reel, reelIndex) => {
    reel.classList.add("spinning");
    const interval = window.setInterval(() => {
      reel.textContent = randomSymbol().icon;
    }, 90 + reelIndex * 30);

    window.setTimeout(() => {
      window.clearInterval(interval);
      reel.classList.remove("spinning");
      reel.textContent = finalResults[reelIndex].icon;

      if (reelIndex === reels.length - 1) {
        spinning = false;
        resolveSpin(finalResults);
        updateHud();
      }
    }, 900 + reelIndex * 450);
  });
}

function handleSpin() {
  if (spinning || state.tokens < spinCost) {
    return;
  }

  state.tokens -= spinCost;
  spinning = true;
  updateHud();
  setMessage(
    "Spinning the reels. Please wait while the machine converts electricity into confidence.",
    `A fresh ${spinCost}-token fee has been forwarded to the narrative layer.`,
    "loss",
    "Spinning"
  );
  saveState();
  animateSpin();
}

function resetGame() {
  const confirmed = window.confirm(
    "Reset the quarter and wipe all saved hype metrics?"
  );

  if (!confirmed) {
    return;
  }

  Object.assign(state, buildInitialState());
  reels.forEach((reel, index) => {
    reel.textContent = symbols[index].icon;
    reel.classList.remove("spinning");
  });

  spinning = false;
  setMessage(
    "Fresh quarter initialized. The board has approved another avoidable experiment.",
    "Wallet restored, history cleared, and accountability gently postponed.",
    "win",
    "Reset"
  );
  saveState();
  updateHud();
}

spinButton.addEventListener("click", handleSpin);
speakStatus.addEventListener("click", speakLatestResult);
resetButton.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target === document.body) {
    event.preventDefault();
    handleSpin();
  }
});

updateResultPill(state.pillTone, state.pillLabel);
resultLine.textContent = state.currentResult;
spendLine.textContent = state.currentSpend;
updateHud();
