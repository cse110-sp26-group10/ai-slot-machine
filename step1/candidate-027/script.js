const symbols = [
  { icon: "🤖", label: "Auto-Generated Insight" },
  { icon: "🪙", label: "Prompt Token" },
  { icon: "📈", label: "Hype Curve" },
  { icon: "🔥", label: "GPU Burn" },
  { icon: "🧠", label: "Synthetic Genius" },
  { icon: "💸", label: "Subscription Creep" },
  { icon: "🫠", label: "Hallucinated Citation" },
];

const STORAGE_KEY = "ai-slot-machine-balance";
const STARTING_TOKENS = 100;
const SPIN_COST = 5;

const reels = [
  document.querySelector("#reel0"),
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
];
const tokenBalance = document.querySelector("#tokenBalance");
const burnRate = document.querySelector("#burnRate");
const message = document.querySelector("#message");
const spinButton = document.querySelector("#spinButton");
const resetButton = document.querySelector("#resetButton");

let balance = Number.parseInt(localStorage.getItem(STORAGE_KEY) || "", 10);
if (Number.isNaN(balance)) {
  balance = STARTING_TOKENS;
}

renderBalance();
setMessage("Welcome back, founder. Your runway is measured in button presses.");

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetWallet);

async function spin() {
  if (balance < SPIN_COST) {
    setMessage("Out of tokens. Time to pivot into AI consulting.");
    speak("You are out of tokens.");
    return;
  }

  spinButton.disabled = true;
  clearWinnerStyles();
  balance -= SPIN_COST;
  renderBalance();
  setMessage("Deploying expensive inference...");

  const result = await animateReels();
  const payout = score(result);

  balance += payout.amount;
  localStorage.setItem(STORAGE_KEY, String(balance));
  renderBalance();
  setMessage(payout.message);

  if (payout.amount > 0) {
    celebrate();
    speak(`You won ${payout.amount} AI tokens.`);
  } else {
    speak("No payout. The machine suggests buying more credits.");
  }

  spinButton.disabled = false;
}

function resetWallet() {
  balance = STARTING_TOKENS;
  localStorage.setItem(STORAGE_KEY, String(balance));
  renderBalance();
  clearWinnerStyles();
  setMessage("Wallet reset. Fresh tokens, same bad decisions.");
}

function renderBalance() {
  tokenBalance.textContent = String(balance);
  burnRate.textContent = `${SPIN_COST} / spin`;
}

function setMessage(text) {
  message.textContent = text;
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

async function animateReels() {
  const spins = reels.map((reel, index) => {
    const duration = 900 + index * 260 + Math.random() * 260;
    return spinReel(reel, duration);
  });

  return Promise.all(spins);
}

function spinReel(reel, duration) {
  return new Promise((resolve) => {
    const tickRate = 85;

    const intervalId = window.setInterval(() => {
      const symbol = randomSymbol();
      reel.textContent = symbol.icon;
      reel.setAttribute("aria-label", symbol.label);
    }, tickRate);

    reel.animate(
      [
        { transform: "translateY(0) scale(1)", filter: "blur(0px)" },
        { transform: "translateY(-8px) scale(1.03)", filter: "blur(1px)" },
        { transform: "translateY(0) scale(1)", filter: "blur(0px)" },
      ],
      {
        duration,
        easing: "ease-in-out",
      }
    );

    window.setTimeout(() => {
      window.clearInterval(intervalId);
      const finalSymbol = randomSymbol();
      reel.textContent = finalSymbol.icon;
      reel.setAttribute("aria-label", finalSymbol.label);
      resolve(finalSymbol);
    }, duration);
  });
}

function score(result) {
  const icons = result.map((entry) => entry.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});
  const matchCount = Math.max(...Object.values(counts));

  if (matchCount === 3) {
    reels.forEach((reel) => reel.classList.add("is-winning"));
    return {
      amount: 30,
      message: `Jackpot. The board approved your ${result[0].label.toLowerCase()} strategy. +30 tokens.`,
    };
  }

  if (matchCount === 2) {
    const matchedIcon = Object.keys(counts).find((icon) => counts[icon] === 2);
    reels.forEach((reel) => {
      if (reel.textContent === matchedIcon) {
        reel.classList.add("is-winning");
      }
    });

    return {
      amount: 10,
      message: "Two of a kind. Congratulations on your modestly overvalued prototype. +10 tokens.",
    };
  }

  return {
    amount: 0,
    message: "No match. The machine spent your tokens on a keynote deck.",
  };
}

function clearWinnerStyles() {
  reels.forEach((reel) => reel.classList.remove("is-winning"));
}

function celebrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 40, 120]);
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1.05;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}
