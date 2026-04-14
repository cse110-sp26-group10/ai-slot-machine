const STARTING_TOKENS = 100;
const SPIN_COST = 15;
const JACKPOT_REWARD = 250;
const PROMPT_TRIPLE_REWARD = 120;
const MATCH_REWARD = 35;
const STORAGE_KEY = "token-sink-3000-state";
const SYMBOLS = ["GPU", "PROMPT", "LAG", "404", "BOT", "COPE"];

const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");
const tokenBalance = document.getElementById("token-balance");
const spinCost = document.getElementById("spin-cost");
const statusMessage = document.getElementById("status-message");
const statusPanel = document.querySelector(".status-panel");
const reelNodes = [
  document.getElementById("reel-1"),
  document.getElementById("reel-2"),
  document.getElementById("reel-3"),
];

let state = loadState();

spinCost.textContent = String(SPIN_COST);
render();

spinButton.addEventListener("click", handleSpin);
resetButton.addEventListener("click", resetGame);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      tokens: STARTING_TOKENS,
      reels: ["GPU", "GPU", "GPU"],
      message: "Your seed funding has been converted into vibes. Pull the lever.",
      tone: "neutral",
    };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return {
      tokens: STARTING_TOKENS,
      reels: ["GPU", "GPU", "GPU"],
      message: "Storage corruption detected. Very authentic startup energy.",
      tone: "neutral",
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenBalance.textContent = String(state.tokens);
  spinButton.textContent =
    state.tokens >= SPIN_COST ? `Burn ${SPIN_COST} Tokens` : "Out Of Tokens";
  spinButton.disabled = state.tokens < SPIN_COST;

  reelNodes.forEach((node, index) => {
    node.textContent = state.reels[index];
  });

  statusMessage.textContent = state.message;
  statusPanel.className = "status-panel";

  if (state.tone) {
    statusPanel.classList.add(state.tone);
  }
}

function resetGame() {
  state = {
    tokens: STARTING_TOKENS,
    reels: ["GPU", "GPU", "GPU"],
    message: "Cap table reset. Congratulations on your fresh delusion.",
    tone: "neutral",
  };

  saveState();
  render();
  buzz([30, 40, 30]);
}

async function handleSpin() {
  if (state.tokens < SPIN_COST) {
    state.message =
      "You are out of tokens. Time to tell investors the product is now 'community driven.'";
    state.tone = "broke";
    saveState();
    render();
    buzz([80, 40, 80]);
    return;
  }

  state.tokens -= SPIN_COST;
  spinButton.disabled = true;

  const results = await Promise.all(
    reelNodes.map((node, index) => animateReel(node, 700 + index * 220))
  );

  const outcome = scoreSpin(results);
  state.reels = results;
  state.tokens += outcome.reward;
  state.message = outcome.message;
  state.tone = outcome.tone;

  saveState();
  render();
  celebrate(outcome);
}

function animateReel(node, duration) {
  const start = performance.now();

  return new Promise((resolve) => {
    function frame(now) {
      if (now - start < duration) {
        node.textContent = pickSymbol();
        requestAnimationFrame(frame);
        return;
      }

      const finalSymbol = pickSymbol();
      node.textContent = finalSymbol;
      node.classList.remove("flash");
      void node.offsetWidth;
      node.classList.add("flash");
      resolve(finalSymbol);
    }

    requestAnimationFrame(frame);
  });
}

function scoreSpin(results) {
  const [first, second, third] = results;
  const allSame = first === second && second === third;
  const anyMatch = new Set(results).size < 3;

  if (allSame && first === "GPU") {
    return {
      reward: JACKPOT_REWARD,
      tone: "win",
      message:
        "TRIPLE GPU. The cloud bill is enormous, but so is your ego. +250 tokens.",
    };
  }

  if (allSame && first === "PROMPT") {
    return {
      reward: PROMPT_TRIPLE_REWARD,
      tone: "win",
      message:
        "TRIPLE PROMPT. You reused context instead of brute-forcing it. +120 tokens.",
    };
  }

  if (allSame) {
    return {
      reward: 80,
      tone: "win",
      message: `Triple ${first}. Somehow the nonsense aligned. +80 tokens.`,
    };
  }

  if (anyMatch) {
    return {
      reward: MATCH_REWARD,
      tone: "win",
      message: `Two symbols matched. The machine calls this 'efficiency gains.' +${MATCH_REWARD} tokens.`,
    };
  }

  return {
    reward: 0,
    tone: state.tokens === 0 ? "broke" : "lose",
    message:
      "No match. Your prompt budget has been safely converted into shareholder poetry.",
  };
}

function celebrate(outcome) {
  if (outcome.reward >= 80) {
    document.body.animate(
      [
        { transform: "translateY(0)" },
        { transform: "translateY(-6px)" },
        { transform: "translateY(0)" },
      ],
      { duration: 340, easing: "ease-out" }
    );
    buzz([60, 30, 80, 30, 100]);
    return;
  }

  if (outcome.reward > 0) {
    buzz([35]);
    return;
  }

  buzz([120]);
}

function pickSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function buzz(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
