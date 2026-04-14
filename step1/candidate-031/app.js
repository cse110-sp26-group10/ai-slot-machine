const symbols = [
  { icon: "🤖", label: "Model", payout: 18 },
  { icon: "🪙", label: "Token", payout: 22 },
  { icon: "🔥", label: "GPU Fire", payout: 12 },
  { icon: "🧠", label: "Synthetic Insight", payout: 30 },
  { icon: "💸", label: "Burn Rate", payout: 10 },
  { icon: "📉", label: "Valuation Reset", payout: 16 },
];

const spinCost = 15;
let tokens = 120;
let totalSpent = 0;
let lastAnnouncement = "The machine is ready to monetize your curiosity.";
let spinning = false;

const reels = [
  document.getElementById("reel-0"),
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
];

const tokenCount = document.getElementById("token-count");
const spinCostNode = document.getElementById("spin-cost");
const moodNode = document.getElementById("mood");
const resultLine = document.getElementById("result-line");
const spendLine = document.getElementById("spend-line");
const spinButton = document.getElementById("spin-button");
const speakStatus = document.getElementById("speak-status");
const machineCard = document.querySelector(".machine-card");
const burstTemplate = document.getElementById("burst-template");

spinCostNode.textContent = String(spinCost);

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function updateHud() {
  tokenCount.textContent = String(tokens);

  if (tokens >= 150) {
    moodNode.textContent = "Delusionally liquid";
  } else if (tokens >= 70) {
    moodNode.textContent = "Cautiously bullish";
  } else if (tokens >= spinCost) {
    moodNode.textContent = "Pivoting to B2B";
  } else {
    moodNode.textContent = "Seeking emergency seed round";
  }

  spinButton.disabled = spinning || tokens < spinCost;
  spinButton.textContent = spinning
    ? "Consulting the probability engine..."
    : tokens >= spinCost
      ? `Spend ${spinCost} tokens to spin`
      : "Out of tokens. Please monetize harder.";
}

function setMessage(resultText, spendText, tone) {
  resultLine.textContent = resultText;
  spendLine.textContent = spendText;
  lastAnnouncement = `${resultText} ${spendText}`;

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
      "loss"
    );
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(lastAnnouncement);
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

  if (uniqueIcons === 1) {
    const payout = results[0].payout * 3;
    tokens += payout;
    totalSpent += spinCost;
    burstCoins(10);
    maybeCelebrate(true);
    setMessage(
      `Jackpot: triple ${labels[0]}s. The machine minted ${payout} tokens out of pure investor theater.`,
      `You spent ${totalSpent} tokens overall, which somehow counts as product-market fit.`,
      "win"
    );
    return;
  }

  if (uniqueIcons === 2) {
    const payout = 12;
    tokens += payout;
    totalSpent += spinCost;
    burstCoins(5);
    maybeCelebrate(false);
    setMessage(
      `Two reels aligned. The casino grants ${payout} consolation tokens and calls it AI synergy.`,
      `Lifetime burn: ${totalSpent} tokens. Excellent progress toward a monetized personality.`,
      "win"
    );
    return;
  }

  totalSpent += spinCost;
  setMessage(
    `No match. The model confidently predicted vibes instead of value.`,
    `You are now ${totalSpent} tokens deep into the dream of frictionless automation.`,
    "loss"
  );
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
  if (spinning || tokens < spinCost) {
    return;
  }

  tokens -= spinCost;
  spinning = true;
  updateHud();
  setMessage(
    "Spinning the reels. Please wait while the machine converts electricity into confidence.",
    `A fresh ${spinCost}-token fee has been forwarded to the narrative layer.`,
    "loss"
  );
  animateSpin();
}

spinButton.addEventListener("click", handleSpin);
speakStatus.addEventListener("click", speakLatestResult);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleSpin();
  }
});

updateHud();
