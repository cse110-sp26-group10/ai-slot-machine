const STORAGE_KEY = "vc-funding-simulator-state";
const TRACK_CYCLES = 10;
const INITIAL_WALLET = 120;
const SPIN_COST = 15;
const PAIR_PAYOUT = 20;
const HISTORY_LIMIT = 8;

const symbols = [
  { key: "GPU", subtitle: "rack-grade swagger", payout: 150 },
  { key: "AGI", subtitle: "timeline unspecified", payout: 120 },
  { key: "Hallucination", subtitle: "creative certainty", payout: 66 },
  { key: "Moat", subtitle: "slide-deck defense", payout: 90 },
  { key: "Pivot", subtitle: "strategy in a trench coat", payout: 54 },
  { key: "Synergy", subtitle: "consulting-grade fog", payout: 72 }
];

const payoutLookup = Object.fromEntries(symbols.map((symbol) => [symbol.key, symbol.payout]));

const dom = {
  walletValue: document.getElementById("walletValue"),
  spinCostValue: document.getElementById("spinCostValue"),
  moodValue: document.getElementById("moodValue"),
  spinButton: document.getElementById("spinButton"),
  resetButton: document.getElementById("resetButton"),
  soundButton: document.getElementById("soundButton"),
  resultBadge: document.getElementById("resultBadge"),
  headline: document.getElementById("headline"),
  summary: document.getElementById("summary"),
  spinFormula: document.getElementById("spinFormula"),
  spinCountValue: document.getElementById("spinCountValue"),
  bestHitValue: document.getElementById("bestHitValue"),
  winStreakValue: document.getElementById("winStreakValue"),
  netValue: document.getElementById("netValue"),
  payoutList: document.getElementById("payoutList"),
  historyList: document.getElementById("historyList"),
  historyItemTemplate: document.getElementById("historyItemTemplate"),
  reelTracks: Array.from(document.querySelectorAll(".reel-track"))
};

const audioManager = createAudioManager();

const state = loadState();

renderPayouts();
renderReels();
renderAll();
attachEventListeners();

function loadState() {
  const fallback = {
    wallet: INITIAL_WALLET,
    spinCost: SPIN_COST,
    soundEnabled: true,
    spinCount: 0,
    winStreak: 0,
    netChange: 0,
    bestHitLabel: "None",
    bestHitAmount: 0,
    history: [],
    currentSymbols: [0, 1, 2],
    lastOutcome: "neutral"
  };

  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (!savedState || typeof savedState !== "object") {
      return fallback;
    }

    return {
      ...fallback,
      ...savedState,
      currentSymbols: Array.isArray(savedState.currentSymbols) && savedState.currentSymbols.length === 3
        ? savedState.currentSymbols.map(sanitizeSymbolIndex)
        : fallback.currentSymbols,
      history: Array.isArray(savedState.history) ? savedState.history.slice(0, HISTORY_LIMIT) : fallback.history
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      wallet: state.wallet,
      spinCost: state.spinCost,
      soundEnabled: state.soundEnabled,
      spinCount: state.spinCount,
      winStreak: state.winStreak,
      netChange: state.netChange,
      bestHitLabel: state.bestHitLabel,
      bestHitAmount: state.bestHitAmount,
      history: state.history,
      currentSymbols: state.currentSymbols,
      lastOutcome: state.lastOutcome
    })
  );
}

function attachEventListeners() {
  dom.spinButton.addEventListener("click", handleSpin);
  dom.resetButton.addEventListener("click", resetGame);
  dom.soundButton.addEventListener("click", toggleSound);

  window.addEventListener("resize", syncVisibleSymbols);
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();

      if (!state.isSpinning) {
        handleSpin();
      }
    }
  });
}

function renderPayouts() {
  const payoutMarkup = [
    ...symbols.map(
      (symbol) =>
        `<li><span class="payout-name">${symbol.key} / ${symbol.key} / ${symbol.key}</span><span class="payout-award">+${symbol.payout}</span></li>`
    ),
    `<li><span class="payout-name">Any Pair</span><span class="payout-award">+${PAIR_PAYOUT}</span></li>`
  ].join("");

  dom.payoutList.innerHTML = payoutMarkup;
}

function renderReels() {
  const repeatedSymbols = Array.from({ length: TRACK_CYCLES }, () => symbols)
    .flat()
    .map(
      (symbol) => `
        <article class="symbol-card" aria-hidden="true">
          <span class="symbol-word">${symbol.key}</span>
          <span class="symbol-sub">${symbol.subtitle}</span>
        </article>
      `
    )
    .join("");

  dom.reelTracks.forEach((track) => {
    track.innerHTML = repeatedSymbols;
  });

  syncVisibleSymbols();
}

function syncVisibleSymbols() {
  dom.reelTracks.forEach((track, index) => {
    track.style.transition = "none";
    track.classList.remove("spinning", "settled");
    updateTrackPosition(track, symbolTrackIndex(state.currentSymbols[index], 2));
  });
}

function updateTrackPosition(track, trackIndex) {
  const cardHeight = track.firstElementChild?.offsetHeight || 82;
  const windowHeight = track.parentElement?.clientHeight || 246;
  const centerOffset = (windowHeight - cardHeight) / 2;
  track.style.transform = `translateY(${centerOffset - trackIndex * cardHeight}px)`;
}

function sanitizeSymbolIndex(value) {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return 0;
  }

  const safeIndex = Math.floor(normalized) % symbols.length;
  return safeIndex < 0 ? safeIndex + symbols.length : safeIndex;
}

function symbolTrackIndex(symbolIndex, cycleOffset) {
  return cycleOffset * symbols.length + sanitizeSymbolIndex(symbolIndex);
}

function handleSpin() {
  if (state.isSpinning) {
    return;
  }

  if (state.wallet < state.spinCost) {
    presentState({
      outcome: "loss",
      badge: "Runway Exhausted",
      headline: "The board has discovered arithmetic.",
      summary:
        "You do not have enough tokens for another narrative burn. Reset the wallet and call it a bridge round.",
      formula: `Wallet shortfall detected. You need ${state.spinCost - state.wallet} more tokens to keep pretending.`,
      combo: currentComboText(),
      net: 0,
      historyMessage: "No spin occurred because the treasury has entered interpretive accounting."
    });
    audioManager.play("error", state.soundEnabled);
    return;
  }

  state.isSpinning = true;
  setControlsDisabled(true);
  audioManager.play("spin", state.soundEnabled);

  const resultIndices = generateSpinResult();
  const result = evaluateResult(resultIndices);
  const previousSymbols = [...state.currentSymbols];

  state.wallet -= state.spinCost;
  state.wallet += result.payout;
  state.spinCount += 1;
  state.netChange += result.net;
  state.winStreak = result.isWin ? state.winStreak + 1 : 0;
  state.lastOutcome = result.outcome;

  if (result.payout > state.bestHitAmount) {
    state.bestHitAmount = result.payout;
    state.bestHitLabel = result.bestHitLabel;
  }

  const spinView = buildSpinView(result, resultIndices);

  animateReels(previousSymbols, resultIndices).then(() => {
    state.currentSymbols = resultIndices;
    state.history.unshift({
      combo: spinView.combo,
      net: result.net,
      message: spinView.historyMessage,
      outcome: result.outcome
    });
    state.history = state.history.slice(0, HISTORY_LIMIT);

    presentState(spinView);
    renderAll();
    saveState();

    audioManager.play(result.isWin ? "win" : "loss", state.soundEnabled);
    state.isSpinning = false;
    setControlsDisabled(false);
  });
}

function generateSpinResult() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * symbols.length));
}

function evaluateResult(indices) {
  const keys = indices.map((index) => symbols[index].key);
  const counts = keys.reduce((accumulator, key) => {
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const countValues = Object.values(counts);
  const isTriple = countValues.includes(3);
  const isPair = countValues.includes(2);

  if (isTriple) {
    const winningKey = keys[0];
    const payout = payoutLookup[winningKey];

    return {
      outcome: "win",
      payout,
      net: payout - state.spinCost,
      isWin: true,
      bestHitLabel: `${winningKey} x3`
    };
  }

  if (isPair) {
    return {
      outcome: "win",
      payout: PAIR_PAYOUT,
      net: PAIR_PAYOUT - state.spinCost,
      isWin: true,
      bestHitLabel: "Any Pair"
    };
  }

  return {
    outcome: "loss",
    payout: 0,
    net: -state.spinCost,
    isWin: false,
    bestHitLabel: "None"
  };
}

function buildSpinView(result, indices) {
  const keys = indices.map((index) => symbols[index].key);
  const combo = keys.join(" / ");
  const mood = computeMood();
  const signedNet = formatSigned(result.net);

  if (result.outcome === "win" && result.payout > PAIR_PAYOUT) {
    return {
      outcome: "win",
      badge: "Securing VC Funding",
      headline: `${keys[0]} just closed the round.`,
      summary: `Investors heard "${keys[0]}" three times in a row and immediately confused repetition with inevitability.`,
      formula: `Payout +${result.payout}. Net ${signedNet}. Mood upgraded to ${mood}.`,
      combo,
      net: result.net,
      historyMessage: `Triple ${keys[0]} triggered a funding event. The cap table is now 80% vibes.`
    };
  }

  if (result.outcome === "win") {
    const pairKey = keys.find((key, index) => keys.indexOf(key) !== index);

    return {
      outcome: "win",
      badge: "Securing VC Funding",
      headline: `${pairKey} was enough for a tiny advisory check.`,
      summary: "A matching pair convinced someone in fleece that traction is near. Nobody asked for retention numbers.",
      formula: `Pair refund +${PAIR_PAYOUT}. Net ${signedNet}. Mood upgraded to ${mood}.`,
      combo,
      net: result.net,
      historyMessage: `A ${pairKey} pair kept the runway alive. The board called it disciplined optimism.`
    };
  }

  return {
    outcome: "loss",
    badge: "Model Collapse",
    headline: "The demo drifted into a crater.",
    summary: `No alignment, no miracle, just ${combo} arguing in public while the runway evaporates.`,
    formula: `Spin cost -${state.spinCost}. Net ${signedNet}. Mood downgraded to ${mood}.`,
    combo,
    net: result.net,
    historyMessage: `No pair landed. Finance marked the experiment as "research" to avoid follow-up questions.`
  };
}

function computeMood() {
  if (state.wallet < state.spinCost) {
    return "In Bankruptcy Prompting";
  }

  if (state.winStreak >= 2) {
    return "Pitch-Deck Euphoric";
  }

  if (state.lastOutcome === "win") {
    return "Cautiously Unicorn";
  }

  if (state.wallet <= INITIAL_WALLET / 2) {
    return "Pivoting Aggressively";
  }

  return "Overfitted";
}

function animateReels(previousSymbols, resultIndices) {
  const stopDelays = [950, 1250, 1550];

  const animations = dom.reelTracks.map((track, index) => {
    const startIndex = symbolTrackIndex(previousSymbols[index], 2);
    const stopIndex = symbolTrackIndex(resultIndices[index], TRACK_CYCLES - 2);
    let rollingIndex = startIndex;

    track.classList.remove("settled");
    track.classList.add("spinning");
    track.style.transition = "none";
    updateTrackPosition(track, startIndex);
    void track.offsetHeight;

    return new Promise((resolve) => {
      const intervalId = window.setInterval(() => {
        rollingIndex += 1;
        updateTrackPosition(track, rollingIndex);
      }, 70);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        track.classList.remove("spinning");
        track.style.transition = "transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1.05)";
        updateTrackPosition(track, stopIndex);

        window.setTimeout(() => {
          track.style.transition = "none";
          updateTrackPosition(track, symbolTrackIndex(resultIndices[index], 2));
          track.classList.add("settled");
          window.setTimeout(() => track.classList.remove("settled"), 320);
          resolve();
        }, 450);
      }, stopDelays[index]);
    });
  });

  return Promise.all(animations);
}

function presentState(view) {
  dom.resultBadge.textContent = view.badge;
  dom.resultBadge.className = `result-badge ${view.outcome}`;
  dom.headline.textContent = view.headline;
  dom.summary.textContent = view.summary;
  dom.spinFormula.textContent = view.formula;
}

function renderAll() {
  dom.walletValue.textContent = state.wallet;
  dom.spinCostValue.textContent = state.spinCost;
  dom.moodValue.textContent = computeMood();
  dom.spinCountValue.textContent = state.spinCount;
  dom.bestHitValue.textContent =
    state.bestHitAmount > 0 ? `${state.bestHitLabel} (+${state.bestHitAmount})` : "None";
  dom.winStreakValue.textContent = state.winStreak;
  dom.netValue.textContent = formatSigned(state.netChange);
  dom.spinButton.textContent = `Burn ${state.spinCost} Tokens`;
  dom.soundButton.textContent = state.soundEnabled ? "Sound On" : "Sound Off";

  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    dom.historyList.innerHTML =
      '<li class="history-item"><div class="history-topline"><strong class="history-combo">No spins yet</strong><span class="history-net">0</span></div><p class="history-message">The machine is still drafting its launch thread.</p></li>';
    return;
  }

  dom.historyList.innerHTML = "";

  state.history.forEach((entry) => {
    const fragment = dom.historyItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".history-item");

    item.classList.add(entry.outcome);
    fragment.querySelector(".history-combo").textContent = entry.combo;
    fragment.querySelector(".history-net").textContent = formatSigned(entry.net);
    fragment.querySelector(".history-message").textContent = entry.message;
    dom.historyList.appendChild(fragment);
  });
}

function setControlsDisabled(isDisabled) {
  dom.spinButton.disabled = isDisabled;
  dom.resetButton.disabled = isDisabled;
}

function resetGame() {
  if (state.isSpinning) {
    return;
  }

  state.wallet = INITIAL_WALLET;
  state.spinCost = SPIN_COST;
  state.spinCount = 0;
  state.winStreak = 0;
  state.netChange = 0;
  state.bestHitLabel = "None";
  state.bestHitAmount = 0;
  state.history = [];
  state.currentSymbols = [0, 1, 2];
  state.lastOutcome = "neutral";

  syncVisibleSymbols();
  presentState({
    outcome: "neutral",
    badge: "Market Open",
    headline: "The wallet has been recapitalized for another avoidable lesson.",
    summary: "Fresh runway, same buzzwords, identical governance problems.",
    formula: `Wallet reset to ${INITIAL_WALLET}. Spin cost remains ${SPIN_COST}.`,
    combo: currentComboText(),
    net: 0,
    historyMessage: "Treasury reset completed."
  });
  renderAll();
  saveState();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  renderAll();
  saveState();

  if (state.soundEnabled) {
    audioManager.play("toggle", true);
  }
}

function currentComboText() {
  return state.currentSymbols.map((index) => symbols[index].key).join(" / ");
}

function formatSigned(value) {
  if (value > 0) {
    return `+${value}`;
  }

  return `${value}`;
}

function createAudioManager() {
  let audioContext;

  function ensureContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  }

  function playTone(frequency, startTime, duration, volume, type = "triangle") {
    const context = ensureContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.03);
  }

  function play(pattern, isEnabled) {
    if (!isEnabled) {
      return;
    }

    const context = ensureContext();

    if (!context) {
      return;
    }

    const start = context.currentTime + 0.01;

    if (pattern === "spin") {
      playTone(180, start, 0.12, 0.03, "square");
      playTone(220, start + 0.1, 0.12, 0.025, "square");
      playTone(260, start + 0.2, 0.12, 0.02, "square");
      return;
    }

    if (pattern === "win") {
      playTone(330, start, 0.16, 0.045);
      playTone(440, start + 0.12, 0.18, 0.05);
      playTone(660, start + 0.24, 0.24, 0.06);
      return;
    }

    if (pattern === "loss") {
      playTone(210, start, 0.2, 0.04, "sawtooth");
      playTone(150, start + 0.16, 0.26, 0.04, "sawtooth");
      return;
    }

    if (pattern === "error") {
      playTone(160, start, 0.12, 0.03, "square");
      playTone(120, start + 0.12, 0.14, 0.03, "square");
      return;
    }

    if (pattern === "toggle") {
      playTone(520, start, 0.08, 0.03);
      playTone(680, start + 0.08, 0.1, 0.03);
    }
  }

  return { play };
}
