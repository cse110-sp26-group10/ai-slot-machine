const STORAGE_KEY = "token-tycoon-9000-state";
const STARTING_TOKENS = 120;
const SPIN_COST = 15;
const UPGRADE_COST = 25;

const SYMBOLS = [
  { text: "Prompt", weight: 4 },
  { text: "GPU", weight: 4 },
  { text: "Token", weight: 5 },
  { text: "Hallucination", weight: 3 },
  { text: "Pivot", weight: 3 },
  { text: "Synergy", weight: 2 },
  { text: "Moat", weight: 2 },
  { text: "Vaporware", weight: 3 },
  { text: "AGI Soon", weight: 1 },
  { text: "Ethics Deck", weight: 2 }
];

const MOODS = [
  "Cautiously Overfit",
  "GPU-Starved",
  "Prompt Sensitive",
  "Buzzword Positive",
  "Funding Dependent"
];

const ROASTS = [
  "\"We don't burn cash, we tokenize ambition.\"",
  "\"Our moat is that nobody understands the pricing page.\"",
  "\"The model is 90% confidence and 10% electricity bill.\"",
  "\"We solved alignment by renaming the roadmap 'trust layer.'\"",
  "\"Every hallucination is just a visionary pre-announcement.\"",
  "\"We are proudly human-in-the-loop because QA quit.\""
];

const reels = [
  document.getElementById("reel0"),
  document.getElementById("reel1"),
  document.getElementById("reel2")
];

const tokenBalance = document.getElementById("tokenBalance");
const spinCost = document.getElementById("spinCost");
const modelMood = document.getElementById("modelMood");
const resultMessage = document.getElementById("resultMessage");
const tokenDelta = document.getElementById("tokenDelta");
const roastMessage = document.getElementById("roastMessage");
const spinButton = document.getElementById("spinButton");
const upgradeButton = document.getElementById("upgradeButton");
const roastButton = document.getElementById("roastButton");
const confettiCanvas = document.getElementById("confettiCanvas");

let state = loadState();
let spinning = false;
let confettiBits = [];
let audioContext;

spinCost.textContent = String(SPIN_COST);
render();
bindEvents();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function bindEvents() {
  spinButton.addEventListener("click", spin);
  upgradeButton.addEventListener("click", buyUpgrade);
  roastButton.addEventListener("click", refreshRoast);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tokens: STARTING_TOKENS, mood: randomItem(MOODS) };
    }

    const parsed = JSON.parse(raw);
    return {
      tokens: Number.isFinite(parsed.tokens) ? parsed.tokens : STARTING_TOKENS,
      mood: MOODS.includes(parsed.mood) ? parsed.mood : randomItem(MOODS)
    };
  } catch {
    return { tokens: STARTING_TOKENS, mood: randomItem(MOODS) };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  tokenBalance.textContent = String(state.tokens);
  modelMood.textContent = state.mood;
  tokenBalance.classList.remove("balance-flash");
  void tokenBalance.offsetWidth;
  tokenBalance.classList.add("balance-flash");

  const broke = state.tokens < SPIN_COST;
  spinButton.disabled = spinning || broke;
  upgradeButton.disabled = spinning || state.tokens < UPGRADE_COST;

  if (broke) {
    resultMessage.textContent = "You are out of tokens. The startup recommends a bridge round.";
    tokenDelta.textContent = "No spin budget remains. Please locate a more gullible investor.";
  }
}

async function spin() {
  if (spinning || state.tokens < SPIN_COST) {
    return;
  }

  spinning = true;
  state.tokens -= SPIN_COST;
  state.mood = randomItem(MOODS);
  resultMessage.textContent = "Running inference across three entirely unnecessary GPUs...";
  tokenDelta.textContent = `Spent ${SPIN_COST} tokens to ask the machine if vibes count as product.`;
  render();
  saveState();
  beep(220, 0.06, "square");

  const finalSymbols = await Promise.all(
    reels.map((reel, index) => {
      reel.classList.add("spinning");
      const duration = 850 + index * 280;
      return stopReel(reel, duration, index);
    })
  );

  reels.forEach((reel) => reel.classList.remove("spinning"));
  scoreSpin(finalSymbols);
  spinning = false;
  render();
  saveState();
}

function stopReel(reel, duration, index) {
  return new Promise((resolve) => {
    const start = performance.now();
    const interval = 70 + index * 12;
    let lastStep = 0;

    function update(now) {
      if (now - start >= duration) {
        const picked = weightedSymbol();
        reel.textContent = picked;
        resolve(picked);
        return;
      }

      if (now - lastStep >= interval) {
        reel.textContent = weightedSymbol();
        lastStep = now;
      }

      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  });
}

function scoreSpin(symbols) {
  const counts = symbols.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const best = values[0] || 0;
  let winnings = 0;
  let message = "";

  if (best === 3) {
    winnings = 90;
    message = `Triple ${symbols[0]}! The market rewards your completely unsustainable narrative.`;
    launchConfetti();
    beep(660, 0.12, "triangle");
    beep(880, 0.15, "triangle", 120);
  } else if (best === 2) {
    winnings = 30;
    const matched = Object.keys(counts).find((symbol) => counts[symbol] === 2);
    message = `Double ${matched}. Congratulations, you monetized a slide deck.`;
    beep(520, 0.1, "sine");
  } else if (symbols.includes("AGI Soon")) {
    winnings = 45;
    message = "You landed AGI Soon. Nobody knows what it means, but the valuation doubled.";
    launchConfetti();
    beep(760, 0.12, "sawtooth");
  } else if (symbols.includes("Hallucination") && symbols.includes("Ethics Deck")) {
    winnings = 5;
    message = "Hallucination plus Ethics Deck. Legal approved the apology template.";
    beep(300, 0.08, "square");
  } else {
    winnings = 0;
    message = "No payout. The board suggests adding 'agentic' to the homepage.";
    beep(180, 0.08, "square");
  }

  state.tokens += winnings;
  resultMessage.textContent = message;
  tokenDelta.textContent =
    winnings > 0
      ? `Net result: +${winnings - SPIN_COST} tokens after fees. Efficient? Not remotely.`
      : `Net result: -${SPIN_COST} tokens. The machine calls this a data acquisition expense.`;
  roastMessage.textContent = randomItem(ROASTS);
}

function buyUpgrade() {
  if (spinning || state.tokens < UPGRADE_COST) {
    return;
  }

  state.tokens -= UPGRADE_COST;
  state.mood = "Buzzword Positive";
  resultMessage.textContent = "Upgrade installed. The app now uses twice as many acronyms and no extra logic.";
  tokenDelta.textContent = `Spent ${UPGRADE_COST} tokens on alignment theater. Investors found it reassuring.`;
  roastMessage.textContent = "\"We replaced safety work with a tasteful gradient and called it governance.\"";
  saveState();
  render();
  beep(410, 0.08, "triangle");
}

function refreshRoast() {
  roastMessage.textContent = randomItem(ROASTS);
  resultMessage.textContent = "Fresh investor update generated. Substance remains optional.";
  tokenDelta.textContent = "Zero tokens spent. The machine can still produce hot air for free.";
  beep(350, 0.05, "sine");
}

function weightedSymbol() {
  const pool = SYMBOLS.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol.text));
  return randomItem(pool);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  drawConfetti();
}

function launchConfetti() {
  confettiBits = Array.from({ length: 140 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * confettiCanvas.height * 0.2,
    size: 6 + Math.random() * 10,
    speedX: -2 + Math.random() * 4,
    speedY: 2 + Math.random() * 5,
    color: randomItem(["#ff8f00", "#ff5a36", "#81f2c8", "#fff8ec"])
  }));

  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    updateConfetti();
    drawConfetti();

    if (elapsed < 1800) {
      requestAnimationFrame(frame);
    } else {
      confettiBits = [];
      drawConfetti();
    }
  }

  requestAnimationFrame(frame);
}

function updateConfetti() {
  confettiBits.forEach((bit) => {
    bit.x += bit.speedX;
    bit.y += bit.speedY;
    bit.speedY += 0.04;
  });
}

function drawConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiBits.forEach((bit) => {
    ctx.fillStyle = bit.color;
    ctx.fillRect(bit.x, bit.y, bit.size, bit.size * 0.7);
  });
}

function beep(frequency, duration, type, delay = 0) {
  try {
    audioContext = audioContext || new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startAt = audioContext.currentTime + delay / 1000;

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  } catch {
    // Audio can fail before user interaction in some browsers; the app still works without it.
  }
}
