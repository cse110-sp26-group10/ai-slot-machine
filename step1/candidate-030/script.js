const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const JACKPOT_WIN = 180;
const DOUBLE_WIN = 40;
const CASHBACK_WIN = 10;
const SYMBOLS = [
  { icon: "🤖", label: "AI avatar" },
  { icon: "🧠", label: "overfit brain" },
  { icon: "💸", label: "burn rate" },
  { icon: "📉", label: "valuation correction" },
  { icon: "🫠", label: "hallucination blob" },
  { icon: "🪙", label: "token coin" },
];

const reelElements = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

const reelWindows = reelElements.map((reelElement) => reelElement.parentElement);
const tokenBalanceElement = document.getElementById("token-balance");
const spinCostElement = document.getElementById("spin-cost");
const jackpotValueElement = document.getElementById("jackpot-value");
const statusMessageElement = document.getElementById("status-message");
const historyListElement = document.getElementById("history-list");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");

let tokenBalance = STARTING_TOKENS;
let isSpinning = false;
let spinCount = 0;

spinCostElement.textContent = SPIN_COST;
jackpotValueElement.textContent = JACKPOT_WIN;

const history = [
  {
    summary: "Boot sequence",
    detail: "The machine is online and already judging your prompt budget.",
    spin: "Init",
  },
];

function getRandomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function updateBalance() {
  tokenBalanceElement.textContent = tokenBalance;
}

function renderHistory() {
  historyListElement.replaceChildren(
    ...history.map((entry) => {
      const item = document.createElement("li");
      const topline = document.createElement("div");
      const copy = document.createElement("p");

      topline.className = "history-topline";
      copy.className = "history-copy";
      copy.textContent = entry.detail;

      const summarySpan = document.createElement("span");
      summarySpan.textContent = entry.summary;
      const countSpan = document.createElement("span");
      countSpan.textContent = entry.spin;

      topline.append(summarySpan, countSpan);
      item.append(topline, copy);
      return item;
    })
  );
}

function pushHistory(summary, detail, spinLabel = `Spin ${spinCount}`) {
  history.unshift({ summary, detail, spin: spinLabel });
  history.splice(5);
  renderHistory();
}

function setStatusMessage(message) {
  statusMessageElement.textContent = message;
}

function applySpinButtonState() {
  spinButton.disabled = isSpinning || tokenBalance < SPIN_COST;
}

function evaluateSpin(results) {
  const icons = results.map((result) => result.icon);
  const uniqueCount = new Set(icons).size;

  if (uniqueCount === 1) {
    return {
      payout: JACKPOT_WIN,
      summary: "Jackpot",
      detail: `Three ${results[0].label}s. The machine has mistaken luck for product-market fit.`,
      message: `Jackpot. Investors saw three matching symbols and wired you ${JACKPOT_WIN} tokens.`,
    };
  }

  if (uniqueCount === 2) {
    return {
      payout: DOUBLE_WIN,
      summary: "Buzzword alignment",
      detail: "Two matching symbols. That is more than enough evidence for an AI keynote.",
      message: `Two symbols matched. You claw back ${DOUBLE_WIN} tokens from the hype cycle.`,
    };
  }

  if (icons.includes("💸")) {
    return {
      payout: CASHBACK_WIN,
      summary: "Managed burn",
      detail: "You found a money emoji, which counts as fiscal responsibility in AI.",
      message: `One burn-rate icon appeared. The machine reluctantly refunds ${CASHBACK_WIN} tokens.`,
    };
  }

  return {
    payout: 0,
    summary: "Full hallucination",
    detail: "No match, no refund, just vibes and a smoldering token budget.",
    message: "Nothing matched. Your tokens have been converted into a demo nobody asked for.",
  };
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function animateSpin(finalResults) {
  reelWindows.forEach((windowElement) => {
    windowElement.classList.add("spinning");
  });

  for (let step = 0; step < 12; step += 1) {
    reelElements.forEach((reelElement) => {
      reelElement.textContent = getRandomSymbol().icon;
    });
    await sleep(75);
  }

  for (let index = 0; index < reelElements.length; index += 1) {
    reelElements[index].textContent = finalResults[index].icon;
    await sleep(120);
  }

  reelWindows.forEach((windowElement) => {
    windowElement.classList.remove("spinning");
  });
}

async function handleSpin() {
  if (isSpinning || tokenBalance < SPIN_COST) {
    return;
  }

  isSpinning = true;
  spinCount += 1;
  tokenBalance -= SPIN_COST;
  updateBalance();
  applySpinButtonState();
  setStatusMessage("Processing your prompt budget through the silicon sarcasm engine...");

  const results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  await animateSpin(results);

  const outcome = evaluateSpin(results);
  tokenBalance += outcome.payout;
  updateBalance();
  setStatusMessage(outcome.message);
  pushHistory(
    `${outcome.summary}: ${results.map((result) => result.icon).join(" ")}`,
    outcome.detail,
    `Spin ${spinCount}`
  );

  isSpinning = false;
  applySpinButtonState();

  if (tokenBalance < SPIN_COST) {
    setStatusMessage("You are out of tokens. Even the AI bubble has stopped returning your calls.");
  }
}

function resetGame() {
  tokenBalance = STARTING_TOKENS;
  spinCount = 0;
  isSpinning = false;
  reelElements.forEach((reelElement, index) => {
    reelElement.textContent = SYMBOLS[index].icon;
  });
  history.length = 0;
  history.push({
    summary: "Wallet reset",
    detail: "Fresh tokens loaded. Time to pretend this is strategy instead of gambling.",
    spin: "Reset",
  });
  updateBalance();
  renderHistory();
  setStatusMessage("Wallet restored. The machine is ready for more AI-adjacent financial mistakes.");
  applySpinButtonState();
}

spinButton.addEventListener("click", handleSpin);
resetButton.addEventListener("click", resetGame);

updateBalance();
applySpinButtonState();
renderHistory();
