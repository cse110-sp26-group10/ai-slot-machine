const SPIN_COST = 15;
const STARTING_TOKENS = 120;
const SYMBOLS = ["🤖", "🔥", "💸", "💎", "🧠", "📉", "💀"];

const payouts = {
  "🤖🤖🤖": 80,
  "🔥🔥🔥": 60,
  "💎💎💎": 50,
  "🧠🧠🧠": 45,
  "💸💸💸": 30,
  "📉📉📉": 25,
};

const pairMessages = [
  "Two reels aligned. The machine is calling it a strategic partnership.",
  "A matching pair. Product says that's basically profitability.",
  "Mild success detected. Expect a keynote about it by sunset.",
];

const failMessages = [
  "No match. The AI assures you the loss is actually a premium feature.",
  "The reels produced a visionary mess. Investors are strangely excited.",
  "Nothing lined up. Great demo energy, questionable business model.",
  "Total chaos. The machine recommends buying more tokens and reframing the outcome.",
];

const moods = [
  "Confidently Wrong",
  "Disruptively Synergized",
  "Unreasonably Optimistic",
  "Prompt-Engineered",
  "Benchmark Adjacent",
];

const tokenBalance = document.querySelector("#token-balance");
const machineMood = document.querySelector("#machine-mood");
const statusMessage = document.querySelector("#status-message");
const spinButton = document.querySelector("#spin-button");
const resetButton = document.querySelector("#reset-button");
const soundButton = document.querySelector("#sound-button");
const reelElements = [
  document.querySelector("#reel-1"),
  document.querySelector("#reel-2"),
  document.querySelector("#reel-3"),
];

let tokens = STARTING_TOKENS;
let isSpinning = false;
let soundEnabled = true;
let audioContext;

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateBalance() {
  tokenBalance.textContent = String(tokens);
  spinButton.disabled = isSpinning || tokens < SPIN_COST;
}

function setMessage(message) {
  statusMessage.textContent = message;
  machineMood.textContent = randomItem(moods);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getOutcome(symbols) {
  const joined = symbols.join("");
  const uniqueCount = new Set(symbols).size;
  const hasSkull = symbols.includes("💀");

  if (payouts[joined]) {
    return {
      delta: payouts[joined],
      message: `Jackpot: ${joined} delivers ${payouts[joined]} fresh tokens and unbearable founder confidence.`,
      win: true,
    };
  }

  if (uniqueCount === 2) {
    return {
      delta: 20,
      message: randomItem(pairMessages),
      win: true,
    };
  }

  if (hasSkull) {
    return {
      delta: -10,
      message: "A skull slipped into the stack. The machine charged a hallucination penalty.",
      win: false,
    };
  }

  return {
    delta: 0,
    message: randomItem(failMessages),
    win: false,
  };
}

function ensureAudio() {
  if (!soundEnabled) {
    return null;
  }

  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) {
      return null;
    }
    audioContext = new Context();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function beep(frequency, duration, type = "sine", gainValue = 0.03) {
  const context = ensureAudio();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

async function playSpinAudio(result) {
  if (!soundEnabled) {
    return;
  }

  beep(320, 0.08, "square");
  await sleep(90);
  beep(380, 0.08, "square");
  await sleep(90);
  beep(result.win ? 620 : 180, result.win ? 0.22 : 0.16, result.win ? "triangle" : "sawtooth");
}

async function spin() {
  if (isSpinning || tokens < SPIN_COST) {
    if (tokens < SPIN_COST) {
      setMessage("You are out of prompt tokens. Reboot the startup to keep pretending.");
    }
    return;
  }

  isSpinning = true;
  tokens -= SPIN_COST;
  updateBalance();
  setMessage("Inference in progress. Please admire the theatrical latency.");
  reelElements.forEach((reel) => reel.classList.remove("win"));
  reelElements.forEach((reel) => reel.classList.add("spinning"));

  const finalSymbols = [];

  for (let i = 0; i < reelElements.length; i += 1) {
    const reel = reelElements[i];
    for (let tick = 0; tick < 9 + i * 3; tick += 1) {
      reel.textContent = randomSymbol();
      await sleep(80);
    }
    const symbol = randomSymbol();
    reel.textContent = symbol;
    finalSymbols.push(symbol);
  }

  reelElements.forEach((reel) => reel.classList.remove("spinning"));

  const result = getOutcome(finalSymbols);
  tokens += result.delta;
  updateBalance();
  setMessage(
    `${result.message} Net change: ${result.delta >= 0 ? "+" : ""}${result.delta} tokens.`
  );

  if (result.win) {
    reelElements.forEach((reel) => {
      if (finalSymbols.filter((symbol) => symbol === reel.textContent).length > 1 || new Set(finalSymbols).size === 1) {
        reel.classList.add("win");
      }
    });
  }

  await playSpinAudio(result);

  isSpinning = false;
  updateBalance();
}

function resetGame() {
  tokens = STARTING_TOKENS;
  isSpinning = false;
  reelElements.forEach((reel) => {
    reel.classList.remove("spinning", "win");
    reel.textContent = randomSymbol();
  });
  setMessage("Fresh runway secured. Time to convert more tokens into applause.");
  updateBalance();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  setMessage(
    soundEnabled
      ? "Audio restored. The machine can chirp about disruption again."
      : "Audio muted. The machine will now mock you silently."
  );
});

updateBalance();
resetGame();
