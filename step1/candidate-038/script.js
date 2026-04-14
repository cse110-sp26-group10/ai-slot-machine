const symbols = ["🤖", "💸", "🔥", "🧠", "✨", "🪙"];
const symbolNames = {
  "🤖": "hallucinating chatbot",
  "💸": "burn-rate spiral",
  "🔥": "GPU overheating",
  "🧠": "prompt wizard",
  "✨": "slide-deck sparkle",
  "🪙": "token drip"
};

const payoutTable = {
  "🤖": 120,
  "💸": 90,
  "🔥": 75,
  "🧠": 65,
  "✨": 50,
  "🪙": 45
};

const sarcasticWins = [
  "Your demo impressed a venture capitalist who has not used the product.",
  "The benchmark looked incredible once everyone stopped asking follow-up questions.",
  "A new dashboard was born. Nobody knows why, but morale is up.",
  "Somebody said 'agentic' in a meeting and your valuation doubled for six seconds."
];

const sarcasticLosses = [
  "The machine spent your tokens on a keynote animation and called it infrastructure.",
  "A premium model autocomplete suggested buying more premium model autocomplete.",
  "Your winnings were immediately redirected to cloud spend with a very optimistic graph.",
  "The board approved a token burn to increase strategic momentum."
];

const spendingIdeas = [
  "3 tokens: one branded lanyard for your invisible user conference",
  "17 tokens: a celebratory API call that returns pure confidence",
  "26 tokens: a consultation on whether your toaster has product-market fit",
  "41 tokens: fresh jargon for the same old automation",
  "88 tokens: a synthetic cofounder with impeccable LinkedIn energy",
  "144 tokens: enough GPU time to reinvent autocomplete as destiny"
];

const storageKey = "token-burn-casino-state";

const balanceNode = document.getElementById("balance");
const spinCostNode = document.getElementById("spin-cost");
const moodNode = document.getElementById("mood");
const resultMessageNode = document.getElementById("result-message");
const eventLogNode = document.getElementById("event-log");
const spendingListNode = document.getElementById("spending-list");
const betInput = document.getElementById("bet");
const betOutput = document.getElementById("bet-output");
const spinButton = document.getElementById("spin-button");
const resetButton = document.getElementById("reset-button");
const soundToggle = document.getElementById("sound-toggle");
const machineCard = document.querySelector(".machine-card");
const reelNodes = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const reelFrames = Array.from(document.querySelectorAll(".reel"));
const logTemplate = document.getElementById("log-item-template");

const initialState = {
  balance: 120,
  bet: 15,
  soundEnabled: false,
  lastOutcome: "ready",
  history: ["Fresh seed funding secured. Accountability postponed."]
};

let state = loadState();
let audioContext;

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return { ...initialState };
    }

    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 5) : initialState.history
    };
  } catch {
    return { ...initialState };
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function updateSpendingList() {
  const dynamicIdea = `${Math.max(1, Math.round(state.balance / 3))} tokens: ${
    state.balance > 100
      ? "a fully animated roadmap to nowhere"
      : "one more pivot before lunch"
  }`;

  const ideas = [dynamicIdea, ...spendingIdeas].slice(0, 4);
  spendingListNode.innerHTML = "";

  ideas.forEach((idea) => {
    const item = document.createElement("li");
    item.textContent = idea;
    spendingListNode.appendChild(item);
  });
}

function updateStatus() {
  balanceNode.textContent = String(state.balance);
  spinCostNode.textContent = String(state.bet);
  betInput.value = String(state.bet);
  betOutput.value = `${state.bet} tokens`;
  soundToggle.textContent = `Sound: ${state.soundEnabled ? "On" : "Off"}`;
  soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));

  if (state.balance <= 0) {
    moodNode.textContent = "Pre-revenue serenity";
    machineCard.classList.add("is-broke");
    spinButton.disabled = true;
    resultMessageNode.textContent = "You are out of tokens. Time to announce a strategic reset.";
    resultMessageNode.className = "message-loss";
  } else if (state.balance < state.bet) {
    moodNode.textContent = "Cash runway concern";
    machineCard.classList.remove("is-broke");
    spinButton.disabled = true;
    resultMessageNode.textContent = "Your current bet is too rich for your token reality. Lower the spend or raise another round.";
    resultMessageNode.className = "message-neutral";
  } else {
    machineCard.classList.remove("is-broke");
    spinButton.disabled = false;
    moodNode.textContent = state.lastOutcome === "win" ? "Unreasonably bullish" : "Cautiously hype";
  }

  renderHistory();
  updateSpendingList();
}

function renderHistory() {
  eventLogNode.innerHTML = "";
  state.history.slice(0, 4).forEach((entry) => {
    const fragment = logTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".event-item");
    item.textContent = entry;
    eventLogNode.appendChild(fragment);
  });
}

function setMessage(text, tone) {
  resultMessageNode.textContent = text;
  resultMessageNode.className = tone;
}

function pushHistory(entry) {
  state.history.unshift(entry);
  state.history = state.history.slice(0, 5);
}

function getOutcome(results, bet) {
  const [first, second, third] = results;

  if (first === second && second === third) {
    return {
      payout: payoutTable[first] + bet,
      tone: "message-win",
      outcome: "win",
      message: `${results.join(" ")}. Jackpot. ${randomItem(sarcasticWins)}`
    };
  }

  if (first === second || second === third || first === third) {
    return {
      payout: bet + 20,
      tone: "message-win",
      outcome: "win",
      message: `${results.join(" ")}. A pair! The market confuses momentum for fundamentals.`
    };
  }

  if (results.includes("💸") && results.includes("🔥")) {
    return {
      payout: 0,
      tone: "message-loss",
      outcome: "loss",
      message: `${results.join(" ")}. Burn rate met literal burn. ${randomItem(sarcasticLosses)}`
    };
  }

  return {
    payout: 0,
    tone: "message-loss",
    outcome: "loss",
    message: `${results.join(" ")}. No match. The machine used your bet to buy ${symbolNames[randomItem(results)]}.`
  };
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function playTone(frequency, duration, type = "sine", gain = 0.03) {
  if (!state.soundEnabled) {
    return;
  }

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.value = gain;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000);
}

async function animateSpin(finalSymbols) {
  const spinRounds = [10, 14, 18];

  for (let reelIndex = 0; reelIndex < reelNodes.length; reelIndex += 1) {
    const reel = reelNodes[reelIndex];
    const frame = reelFrames[reelIndex];
    frame.classList.add("spinning");

    for (let count = 0; count < spinRounds[reelIndex]; count += 1) {
      reel.textContent = randomItem(symbols);
      playTone(250 + reelIndex * 100 + count * 8, 60, "square", 0.018);
      await sleep(65);
    }

    reel.textContent = finalSymbols[reelIndex];
    frame.classList.remove("spinning");
    playTone(440 + reelIndex * 60, 140, "triangle", 0.025);
    await sleep(130);
  }
}

async function spin() {
  if (state.balance < state.bet) {
    return;
  }

  spinButton.disabled = true;
  betInput.disabled = true;
  resetButton.disabled = true;
  setMessage("Allocating tokens to the vibe-based inference engine...", "message-neutral");

  state.balance -= state.bet;
  updateStatus();

  const results = Array.from({ length: 3 }, () => randomItem(symbols));
  await animateSpin(results);

  const outcome = getOutcome(results, state.bet);
  state.balance += outcome.payout;
  state.lastOutcome = outcome.outcome;
  setMessage(outcome.message, outcome.tone);

  const net = outcome.payout - state.bet;
  const historyLine = net >= 0
    ? `+${net} tokens after rolling ${results.join(" ")}`
    : `${net} tokens after rolling ${results.join(" ")}`;
  pushHistory(historyLine);

  if (outcome.outcome === "win") {
    playTone(660, 120, "triangle", 0.04);
    playTone(880, 160, "triangle", 0.03);
  } else {
    playTone(180, 220, "sawtooth", 0.025);
  }

  saveState();
  updateStatus();
  betInput.disabled = false;
  resetButton.disabled = false;
}

function resetGame() {
  state = { ...initialState, history: ["New funding round closed. Nobody asked about revenue."] };
  reelNodes[0].textContent = "🤖";
  reelNodes[1].textContent = "💸";
  reelNodes[2].textContent = "🔥";
  setMessage("Fresh capital deployed. Please misuse it responsibly.", "message-neutral");
  saveState();
  updateStatus();
}

betInput.addEventListener("input", (event) => {
  state.bet = Number(event.target.value);
  saveState();
  updateStatus();
});

spinButton.addEventListener("click", () => {
  void spin().finally(() => {
    updateStatus();
  });
});

resetButton.addEventListener("click", resetGame);

soundToggle.addEventListener("click", async () => {
  state.soundEnabled = !state.soundEnabled;
  saveState();

  if (state.soundEnabled && !audioContext) {
    audioContext = new AudioContext();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    playTone(520, 120, "triangle", 0.03);
  }

  updateStatus();
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (!spinButton.disabled) {
      void spin().finally(() => {
        updateStatus();
      });
    }
  }
});

updateStatus();
setMessage("Fresh capital deployed. Please misuse it responsibly.", "message-neutral");
