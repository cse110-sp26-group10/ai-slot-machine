const symbols = ["🤖", "🪙", "📉", "🔥", "🧠", "🗑️"];
const spinCost = 15;
const defaultTokens = 120;
const reelDelay = 650;

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2"),
];

const tokenCount = document.getElementById("tokenCount");
const lastResult = document.getElementById("lastResult");
const headline = document.getElementById("headline");
const subline = document.getElementById("subline");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");

let tokens = Number(localStorage.getItem("ai-slot-tokens")) || defaultTokens;
let audioContext;
let spinInterval;

const outcomes = {
  "🪙🪙🪙": {
    payout: 90,
    title: "Crypto cult jackpot",
    detail: "The machine printed tokens. Nobody asked where the value comes from.",
  },
  "📉📉📉": {
    payout: 45,
    title: "Valuation collapse bonus",
    detail: "The AI startup cratered and somehow your side bet paid out.",
  },
  "🤖🤖🤖": {
    payout: 30,
    title: "Model synergy hit",
    detail: "Three bots aligned and generated a memo nobody will read.",
  },
  "🔥🔥🔥": {
    payout: 12,
    title: "GPU overheating",
    detail: "You did not profit, but the datacenter definitely suffered.",
  },
};

render();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetWallet);

function render() {
  tokenCount.textContent = String(tokens);
  localStorage.setItem("ai-slot-tokens", String(tokens));
  spinButton.disabled = tokens < spinCost;
}

function spin() {
  if (tokens < spinCost) {
    setMessage(
      "Out of tokens",
      "Your wallet has been rate-limited. Reset it or seek another funding round."
    );
    flashResult("Broke");
    buzz([120, 50, 120]);
    return;
  }

  ensureAudio();
  tokens -= spinCost;
  render();
  flashResult("Spinning");
  setMessage(
    "Inference in progress",
    "The machine is sampling nonsense from the latent casino."
  );
  spinButton.disabled = true;
  startReelAnimation();
  chirp(420, 0.04);

  const result = Array.from({ length: 3 }, () => symbols[randomInt(symbols.length)]);
  const finalKey = result.join("");

  result.forEach((symbol, index) => {
    window.setTimeout(() => {
      reels[index].textContent = symbol;
      if (index === reels.length - 1) {
        stopReelAnimation();
        settle(finalKey, result);
      }
    }, reelDelay + index * 380);
  });
}

function settle(finalKey, result) {
  const directHit = outcomes[finalKey];
  const pairHit = !directHit && hasPair(result);

  if (directHit) {
    tokens += directHit.payout;
    render();
    flashResult(`+${directHit.payout}`);
    setMessage(directHit.title, directHit.detail);
    chirp(740, 0.08);
    chirp(960, 0.08, 120);
    buzz(70);
  } else if (pairHit) {
    tokens += 10;
    render();
    flashResult("+10");
    setMessage(
      "Pity payout",
      "Two symbols matched, so the machine tossed you enough tokens for more reckless prompting."
    );
    chirp(610, 0.05);
  } else {
    flashResult("-15");
    setMessage(
      "Hallucinated return on investment",
      "No match. The tokens were consumed to produce a confident answer to the wrong question."
    );
    chirp(220, 0.08);
    buzz([180, 40, 180]);
  }

  spinButton.disabled = tokens < spinCost;
}

function resetWallet() {
  tokens = defaultTokens;
  render();
  flashResult("Reset");
  setMessage(
    "Wallet restored",
    "Fresh tokens have been injected. The governance board learned nothing."
  );
  reels.forEach((reel, index) => {
    reel.textContent = symbols[index];
  });
  chirp(520, 0.05);
}

function setMessage(title, detail) {
  headline.textContent = title;
  subline.textContent = detail;
}

function flashResult(text) {
  lastResult.textContent = text;
}

function hasPair(result) {
  return new Set(result).size === 2;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function startReelAnimation() {
  reels.forEach((reel) => reel.classList.add("spinning"));
  clearInterval(spinInterval);
  spinInterval = window.setInterval(() => {
    reels.forEach((reel) => {
      reel.textContent = symbols[randomInt(symbols.length)];
    });
  }, 90);
}

function stopReelAnimation() {
  clearInterval(spinInterval);
  reels.forEach((reel) => reel.classList.remove("spinning"));
}

function ensureAudio() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function chirp(frequency, duration, delay = 0) {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const startTime = audioContext.currentTime + delay / 1000;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function buzz(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
