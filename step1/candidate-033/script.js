const symbols = ["🤖", "🪙", "🔥", "🧠", "📉", "💸"];
const spinCost = 15;
const storageKey = "token-sink-3000-state";

const roasts = [
  "The model thanked you for your payment and returned three confident lies.",
  "Incredible loss. Somewhere, a GPU just bought a yacht.",
  "That spin had real startup energy: expensive, loud, and directionless.",
  "You generated premium slop with artisanal latency.",
  "The machine says your prompt lacked 'strategic clarity' and extra funding.",
  "Great news: your tokens were successfully converted into vibes."
];

const facts = [
  "Analysts predict the token economy will continue until someone asks for profit.",
  "A venture capitalist called this 'disruptive' after losing 400 tokens in nine minutes.",
  "User retention remains high because the exit button is emotionally unavailable.",
  "Every jackpot is proudly audited by a panel of stochastic parrots.",
  "The casino now offers enterprise pricing for people who enjoy larger mistakes."
];

const state = loadState();

const reelElements = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");
const soundToggle = document.getElementById("sound-toggle");
const tokenBalance = document.getElementById("token-balance");
const jackpotCount = document.getElementById("jackpot-count");
const message = document.getElementById("message");
const factBox = document.getElementById("fact-box");

let audioContext;
let soundEnabled = false;
let spinning = false;

render();

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetState);
soundToggle.addEventListener("click", toggleSound);

function loadState() {
  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return { balance: 120, jackpots: 0, lastMessage: "" };
  }

  try {
    return JSON.parse(saved);
  } catch {
    return { balance: 120, jackpots: 0, lastMessage: "" };
  }
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  tokenBalance.textContent = String(state.balance);
  jackpotCount.textContent = String(state.jackpots);
  message.textContent =
    state.lastMessage || "You're up 120 tokens. The board believes in your next terrible idea.";
  factBox.textContent = facts[Math.floor(Math.random() * facts.length)];
  spinButton.disabled = spinning || state.balance < spinCost;

  if (state.balance < spinCost && !spinning) {
    message.textContent = "Wallet empty. Even satire has a monetization floor. Hit reset for fresh tokens.";
  }
}

async function spin() {
  if (spinning || state.balance < spinCost) {
    return;
  }

  spinning = true;
  state.balance -= spinCost;
  state.lastMessage = `You spent ${spinCost} tokens to ask the machine for one more miracle.`;
  render();
  saveState();

  playTone(220, 0.08);

  const result = [];

  for (let index = 0; index < reelElements.length; index += 1) {
    const reel = reelElements[index];
    reel.classList.add("spinning");

    await delay(350 + index * 180);

    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    result.push(symbol);
    reel.textContent = symbol;
    reel.classList.remove("spinning");
    playTone(320 + index * 80, 0.05);
  }

  const { payout, text, jackpot } = evaluateSpin(result);
  state.balance += payout;
  state.jackpots += jackpot ? 1 : 0;
  state.lastMessage = text;
  spinning = false;
  render();
  saveState();
}

function evaluateSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const [topCount = 0] = values;
  const [first] = result;

  if (topCount === 3) {
    if (first === "🪙") {
      celebrate();
      return {
        payout: 120,
        jackpot: true,
        text: "Three coins! The machine has mistaken you for a profitable use case. +120 tokens."
      };
    }

    if (first === "🤖") {
      celebrate();
      return {
        payout: 90,
        jackpot: true,
        text: "Triple robots! You have achieved full automation of gambling. +90 tokens."
      };
    }

    if (first === "🔥") {
      celebrate();
      return {
        payout: 60,
        jackpot: true,
        text: "Triple fire! Your runway is gone, but somehow you made +60 tokens."
      };
    }

    celebrate();
    return {
      payout: 45,
      jackpot: true,
      text: `Three ${first} in a row. Statistically suspicious and worth +45 tokens.`
    };
  }

  if (topCount === 2) {
    return {
      payout: 25,
      jackpot: false,
      text: `A matching pair. The machine calls this 'product-market fit.' +25 tokens.`
    };
  }

  return {
    payout: 0,
    jackpot: false,
    text: roasts[Math.floor(Math.random() * roasts.length)]
  };
}

function resetState() {
  state.balance = 120;
  state.jackpots = 0;
  state.lastMessage = "Fresh wallet, fresh delusion. 120 new tokens have entered the arena.";
  reelElements.forEach((reel, index) => {
    reel.textContent = symbols[index];
    reel.classList.remove("spinning");
  });
  render();
  saveState();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggle.textContent = `Sound: ${soundEnabled ? "On" : "Off"}`;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));

  if (soundEnabled) {
    ensureAudioContext();
    playTone(520, 0.04);
  }
}

function ensureAudioContext() {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      audioContext = new AudioContextCtor();
    }
  }

  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency, duration) {
  if (!soundEnabled) {
    return;
  }

  ensureAudioContext();

  if (!audioContext) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function celebrate() {
  document.body.animate(
    [
      { transform: "translateY(0)" },
      { transform: "translateY(-3px)" },
      { transform: "translateY(0)" }
    ],
    { duration: 280, iterations: 2 }
  );

  playTone(660, 0.08);
  setTimeout(() => playTone(880, 0.12), 80);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
