const STORAGE_KEY = "vc-funding-simulator-state";
const TRACK_CYCLES = 10;
const INITIAL_WALLET = 120;
const SPIN_COST = 15;
const PAIR_PAYOUT = 20;
const HISTORY_LIMIT = 8;
const REEL_COUNT = 3;
const REEL_BASE_CYCLE = 2;
const REEL_STOP_CYCLE = TRACK_CYCLES - 2;
const REEL_STEP_MS = 70;
const REEL_SETTLE_MS = 450;
const REEL_STOP_DELAYS = [950, 1250, 1550];
const DEFAULT_SYMBOLS = [0, 1, 2];

const symbols = [
  { key: "GPU", subtitle: "rack-grade swagger", payout: 150 },
  { key: "AGI", subtitle: "timeline unspecified", payout: 120 },
  { key: "Hallucination", subtitle: "creative certainty", payout: 66 },
  { key: "Moat", subtitle: "slide-deck defense", payout: 90 },
  { key: "Pivot", subtitle: "strategy in a trench coat", payout: 54 },
  { key: "Synergy", subtitle: "consulting-grade fog", payout: 72 }
];

const payoutLookup = Object.fromEntries(symbols.map(({ key, payout }) => [key, payout]));

const DEFAULT_VIEW = {
  outcome: "neutral",
  badge: "Market Open",
  headline: "The machine is ready to reposition your losses as strategy.",
  summary: "Pull the lever and let three AI buzzwords decide whether finance calls it vision or a crater.",
  formula: `Each spin burns ${SPIN_COST} tokens. Any pair refunds ${PAIR_PAYOUT}. Triples unlock peak nonsense.`
};

const SIGNAL_BY_OUTCOME = {
  neutral: {
    pill: "Series A-ish",
    copy: "Investor optics currently unstable"
  },
  win: {
    pill: "Narrative Momentum",
    copy: "Several fleece vests are mistaking luck for diligence"
  },
  loss: {
    pill: "Due Diligence",
    copy: "Someone finally opened the burn-rate spreadsheet"
  }
};

const dom = {
  walletValue: document.getElementById("walletValue"),
  walletMeterFill: document.getElementById("walletMeterFill"),
  spinCostValue: document.getElementById("spinCostValue"),
  moodValue: document.getElementById("moodValue"),
  spinButton: document.getElementById("spinButton"),
  resetButton: document.getElementById("resetButton"),
  soundButton: document.getElementById("soundButton"),
  resultBadge: document.getElementById("resultBadge"),
  headline: document.getElementById("headline"),
  summary: document.getElementById("summary"),
  spinFormula: document.getElementById("spinFormula"),
  signalPill: document.getElementById("signalPill"),
  signalCopy: document.getElementById("signalCopy"),
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
presentState(DEFAULT_VIEW);
renderAll();
attachEventListeners();

function createBaseState() {
  return {
    wallet: INITIAL_WALLET,
    spinCost: SPIN_COST,
    soundEnabled: true,
    spinCount: 0,
    winStreak: 0,
    netChange: 0,
    bestHitLabel: "None",
    bestHitAmount: 0,
    history: [],
    currentSymbols: [...DEFAULT_SYMBOLS],
    lastOutcome: "neutral",
    isSpinning: false
  };
}

function loadState() {
  const fallback = createBaseState();

  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (!savedState || typeof savedState !== "object") {
      return fallback;
    }

    return {
      ...fallback,
      ...savedState,
      currentSymbols: sanitizeSymbolList(savedState.currentSymbols),
      history: Array.isArray(savedState.history) ? savedState.history.slice(0, HISTORY_LIMIT) : fallback.history,
      isSpinning: false
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  const {
    wallet,
    spinCost,
    soundEnabled,
    spinCount,
    winStreak,
    netChange,
    bestHitLabel,
    bestHitAmount,
    history,
    currentSymbols,
    lastOutcome
  } = state;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      wallet,
      spinCost,
      soundEnabled,
      spinCount,
      winStreak,
      netChange,
      bestHitLabel,
      bestHitAmount,
      history,
      currentSymbols,
      lastOutcome
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
  const payoutItems = symbols
    .map(({ key, payout }) => {
      return `<li><span class="payout-name">${key} / ${key} / ${key}</span><span class="payout-award">+${payout}</span></li>`;
    })
    .concat(`<li><span class="payout-name">Any Pair</span><span class="payout-award">+${PAIR_PAYOUT}</span></li>`)
    .join("");

  dom.payoutList.innerHTML = payoutItems;
}

function renderReels() {
  const repeatedSymbols = Array.from({ length: TRACK_CYCLES }, () => symbols)
    .flat()
    .map(({ key, subtitle }) => {
      return `
        <article class="symbol-card" aria-hidden="true">
          <span class="symbol-word">${key}</span>
          <span class="symbol-sub">${subtitle}</span>
        </article>
      `;
    })
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
    updateTrackPosition(track, symbolTrackIndex(state.currentSymbols[index], REEL_BASE_CYCLE));
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

function sanitizeSymbolList(list) {
  if (!Array.isArray(list) || list.length !== REEL_COUNT) {
    return [...DEFAULT_SYMBOLS];
  }

  return list.map(sanitizeSymbolIndex);
}

function symbolTrackIndex(symbolIndex, cycleOffset) {
  return cycleOffset * symbols.length + sanitizeSymbolIndex(symbolIndex);
}

function handleSpin() {
  if (state.isSpinning) {
    return;
  }

  if (state.wallet < state.spinCost) {
    presentState(buildInsufficientFundsView());
    audioManager.play("error", state.soundEnabled);
    return;
  }

  state.isSpinning = true;
  setControlsDisabled(true);
  audioManager.play("spin", state.soundEnabled);

  const resultIndices = generateSpinResult();
  const previousSymbols = [...state.currentSymbols];
  const result = evaluateResult(resultIndices);

  applySpinResult(result);

  animateReels(previousSymbols, resultIndices).then(() => {
    state.currentSymbols = resultIndices;

    const view = buildSpinView(result);
    pushHistory(view.combo, result.net, view.historyMessage, result.outcome);

    presentState(view);
    renderAll();
    saveState();

    audioManager.play(result.isWin ? "win" : "loss", state.soundEnabled);
    state.isSpinning = false;
    setControlsDisabled(false);
  });
}

function generateSpinResult() {
  return Array.from({ length: REEL_COUNT }, () => Math.floor(Math.random() * symbols.length));
}

function evaluateResult(indices) {
  const keys = indices.map((index) => symbols[index].key);
  const counts = keys.reduce((accumulator, key) => {
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const countValues = Object.values(counts);
  const tripleKey = countValues.includes(3) ? keys[0] : null;
  const pairKey = countValues.includes(2)
    ? Object.keys(counts).find((key) => counts[key] === 2) || keys[0]
    : null;
  const payout = tripleKey ? payoutLookup[tripleKey] : pairKey ? PAIR_PAYOUT : 0;
  const outcome = payout > 0 ? "win" : "loss";

  return {
    combo: keys.join(" / "),
    payout,
    net: payout - state.spinCost,
    outcome,
    isWin: payout > 0,
    tripleKey,
    pairKey,
    bestHitLabel: tripleKey ? `${tripleKey} x3` : pairKey ? "Any Pair" : "None"
  };
}

function applySpinResult(result) {
  state.wallet += result.net;
  state.spinCount += 1;
  state.netChange += result.net;
  state.winStreak = result.isWin ? state.winStreak + 1 : 0;
  state.lastOutcome = result.outcome;

  if (result.payout > state.bestHitAmount) {
    state.bestHitAmount = result.payout;
    state.bestHitLabel = result.bestHitLabel;
  }
}

function buildSpinView(result) {
  const mood = computeMood();
  const signedNet = formatSigned(result.net);

  if (result.tripleKey) {
    return {
      outcome: "win",
      badge: "Securing VC Funding",
      headline: `${result.tripleKey} just closed the round.`,
      summary: `Investors heard "${result.tripleKey}" three times in a row and immediately confused repetition with inevitability.`,
      formula: `Payout +${result.payout}. Net ${signedNet}. Mood upgraded to ${mood}.`,
      combo: result.combo,
      historyMessage: `Triple ${result.tripleKey} triggered a funding event. The cap table is now 80% vibes.`
    };
  }

  if (result.pairKey) {
    return {
      outcome: "win",
      badge: "Securing VC Funding",
      headline: `${result.pairKey} was enough for a tiny advisory check.`,
      summary: "A matching pair convinced someone in fleece that traction is near. Nobody asked for retention numbers.",
      formula: `Pair refund +${PAIR_PAYOUT}. Net ${signedNet}. Mood upgraded to ${mood}.`,
      combo: result.combo,
      historyMessage: `A ${result.pairKey} pair kept the runway alive. The board called it disciplined optimism.`
    };
  }

  return {
    outcome: "loss",
    badge: "Model Collapse",
    headline: "The demo drifted into a crater.",
    summary: `No alignment, no miracle, just ${result.combo} arguing in public while the runway evaporates.`,
    formula: `Spin cost -${state.spinCost}. Net ${signedNet}. Mood downgraded to ${mood}.`,
    combo: result.combo,
    historyMessage: 'No pair landed. Finance marked the experiment as "research" to avoid follow-up questions.'
  };
}

function buildInsufficientFundsView() {
  return {
    outcome: "loss",
    badge: "Runway Exhausted",
    headline: "The board has discovered arithmetic.",
    summary:
      "You do not have enough tokens for another narrative burn. Reset the wallet and call it a bridge round.",
    formula: `Wallet shortfall detected. You need ${state.spinCost - state.wallet} more tokens to keep pretending.`,
    combo: currentComboText(),
    historyMessage: "No spin occurred because the treasury has entered interpretive accounting."
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
  const animations = dom.reelTracks.map((track, index) => {
    const startIndex = symbolTrackIndex(previousSymbols[index], REEL_BASE_CYCLE);
    const stopIndex = symbolTrackIndex(resultIndices[index], REEL_STOP_CYCLE);
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
      }, REEL_STEP_MS);

      window.setTimeout(() => {
        window.clearInterval(intervalId);
        track.classList.remove("spinning");
        track.style.transition = "transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1.05)";
        updateTrackPosition(track, stopIndex);

        window.setTimeout(() => {
          track.style.transition = "none";
          updateTrackPosition(track, symbolTrackIndex(resultIndices[index], REEL_BASE_CYCLE));
          track.classList.add("settled");
          window.setTimeout(() => track.classList.remove("settled"), 320);
          resolve();
        }, REEL_SETTLE_MS);
      }, REEL_STOP_DELAYS[index] || REEL_STOP_DELAYS[REEL_STOP_DELAYS.length - 1]);
    });
  });

  return Promise.all(animations);
}

function presentState(view) {
  const signal = SIGNAL_BY_OUTCOME[view.outcome] || SIGNAL_BY_OUTCOME.neutral;

  dom.resultBadge.textContent = view.badge;
  dom.resultBadge.className = `result-badge ${view.outcome}`;
  dom.headline.textContent = view.headline;
  dom.summary.textContent = view.summary;
  dom.spinFormula.textContent = view.formula;
  dom.signalPill.textContent = signal.pill;
  dom.signalCopy.textContent = signal.copy;
}

function renderAll() {
  const walletRatio = Math.max(0, Math.min(state.wallet / INITIAL_WALLET, 1));

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
  dom.soundButton.setAttribute("aria-pressed", String(state.soundEnabled));
  dom.walletMeterFill.style.width = `${walletRatio * 100}%`;

  renderHistory();
}

function renderHistory() {
  if (state.history.length === 0) {
    dom.historyList.innerHTML =
      '<li class="history-item history-item-empty"><div class="history-topline"><strong class="history-combo">No spins yet</strong><span class="history-net">0</span></div><p class="history-message">The machine is still drafting its launch thread.</p></li>';
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

function pushHistory(combo, net, message, outcome) {
  state.history.unshift({ combo, net, message, outcome });
  state.history = state.history.slice(0, HISTORY_LIMIT);
}

function setControlsDisabled(isDisabled) {
  dom.spinButton.disabled = isDisabled;
  dom.resetButton.disabled = isDisabled;
}

function resetGame() {
  if (state.isSpinning) {
    return;
  }

  Object.assign(state, {
    ...createBaseState(),
    soundEnabled: state.soundEnabled
  });

  syncVisibleSymbols();
  presentState({
    outcome: "neutral",
    badge: "Market Open",
    headline: "The wallet has been recapitalized for another avoidable lesson.",
    summary: "Fresh runway, same buzzwords, identical governance problems.",
    formula: `Wallet reset to ${INITIAL_WALLET}. Spin cost remains ${SPIN_COST}.`,
    combo: currentComboText(),
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
  return value > 0 ? `+${value}` : `${value}`;
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
    const patterns = {
      spin: [
        [180, start, 0.12, 0.03, "square"],
        [220, start + 0.1, 0.12, 0.025, "square"],
        [260, start + 0.2, 0.12, 0.02, "square"]
      ],
      win: [
        [330, start, 0.16, 0.045],
        [440, start + 0.12, 0.18, 0.05],
        [660, start + 0.24, 0.24, 0.06]
      ],
      loss: [
        [210, start, 0.2, 0.04, "sawtooth"],
        [150, start + 0.16, 0.26, 0.04, "sawtooth"]
      ],
      error: [
        [160, start, 0.12, 0.03, "square"],
        [120, start + 0.12, 0.14, 0.03, "square"]
      ],
      toggle: [
        [520, start, 0.08, 0.03],
        [680, start + 0.08, 0.1, 0.03]
      ]
    };

    (patterns[pattern] || []).forEach((tone) => playTone(...tone));
  }

  return { play };
}