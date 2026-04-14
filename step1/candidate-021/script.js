const symbols = [
  {
    label: "GPU",
    pairPayout: 20,
    triplePayout: 85,
    line: "Three GPUs. Congratulations, your startup can now render one demo video.",
  },
  {
    label: "TOKN",
    pairPayout: 18,
    triplePayout: 70,
    line: "Triple TOKN. Pure circular economy: you paid tokens to win slightly more tokens.",
  },
  {
    label: "SEED",
    pairPayout: 16,
    triplePayout: 60,
    line: "Triple SEED. A16z has liked your napkin sketch.",
  },
  {
    label: "MOAT",
    pairPayout: 24,
    triplePayout: 95,
    line: "Triple MOAT. Nobody knows what you do, which investors are calling defensibility.",
  },
  {
    label: "PIVT",
    pairPayout: 14,
    triplePayout: 55,
    line: "Triple PIVT. The product failed, but the rebrand tests well.",
  },
  {
    label: "BUG",
    pairPayout: -8,
    triplePayout: -35,
    line: "Triple BUG. Your model shipped a hallucinated invoice to finance.",
  },
];

const economyDefaults = {
  balance: 120,
  lifetimeWins: 0,
  taxesPaid: 0,
  streak: 0,
  history: [
    "System booted. Initial funding round closed at <strong>120 tokens</strong> and one concerning amount of confidence.",
  ],
};

const spinCost = 15;
const storageKey = "ai-slot-machine-economy-v1";

const state = loadState();

const elements = {
  balance: document.getElementById("tokenBalance"),
  spinCost: document.getElementById("spinCost"),
  lifetimeWins: document.getElementById("lifetimeWins"),
  taxMeter: document.getElementById("taxMeter"),
  streak: document.getElementById("streakCount"),
  status: document.getElementById("statusLine"),
  history: document.getElementById("historyList"),
  template: document.getElementById("historyTemplate"),
  spinButton: document.getElementById("spinButton"),
  resetButton: document.getElementById("resetButton"),
  reels: [0, 1, 2].map((index) => document.getElementById(`reel${index}`)),
};

elements.spinCost.textContent = String(spinCost);
render();

elements.spinButton.addEventListener("click", spin);
elements.resetButton.addEventListener("click", resetEconomy);

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return structuredClone(economyDefaults);
    }

    const saved = JSON.parse(raw);
    return {
      ...structuredClone(economyDefaults),
      ...saved,
      history: Array.isArray(saved.history) && saved.history.length
        ? saved.history.slice(0, 6)
        : structuredClone(economyDefaults).history,
    };
  } catch {
    return structuredClone(economyDefaults);
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function render() {
  elements.balance.textContent = String(state.balance);
  elements.lifetimeWins.textContent = String(state.lifetimeWins);
  elements.taxMeter.textContent = String(state.taxesPaid);
  elements.streak.textContent = String(state.streak);
  elements.spinButton.textContent = `Burn ${spinCost} Tokens`;
  elements.spinButton.disabled = state.balance < spinCost;

  elements.history.innerHTML = "";
  state.history.forEach((entry) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    item.innerHTML = entry;
    elements.history.appendChild(item);
  });

  if (state.balance < spinCost) {
    setStatus(
      "status-danger",
      "You are out of tokens. The board recommends a fresh funding round or the reset button."
    );
  }
}

async function spin() {
  if (state.balance < spinCost || elements.spinButton.disabled) {
    return;
  }

  elements.spinButton.disabled = true;
  state.balance -= spinCost;

  setStatus("status-loss", "Consulting the model weights, burning compute, and pretending this is deterministic...");

  const results = [];
  for (let index = 0; index < elements.reels.length; index += 1) {
    const result = await animateReel(elements.reels[index], 700 + index * 240);
    results.push(result);
  }

  const outcome = evaluateSpin(results);
  applyOutcome(outcome, results);
  render();
  persist();
}

function animateReel(reelElement, durationMs) {
  const start = performance.now();
  const animation = reelElement.animate(
    [
      { transform: "translateY(-30px)", opacity: 0.25, filter: "blur(4px)" },
      { transform: "translateY(0)", opacity: 1, filter: "blur(0)" },
    ],
    {
      duration: 180,
      iterations: Math.max(3, Math.floor(durationMs / 180)),
      easing: "ease-in-out",
    }
  );

  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      const symbol = randomSymbol();
      reelElement.textContent = symbol.label;

      if (elapsed < durationMs) {
        window.setTimeout(tick, 90);
        return;
      }

      animation.cancel();
      resolve(symbol);
    };

    tick();
  });
}

function evaluateSpin(results) {
  const labels = results.map((result) => result.label);
  const counts = labels.reduce((map, label) => {
    map[label] = (map[label] || 0) + 1;
    return map;
  }, {});

  const [bestLabel, bestCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const bestSymbol = results.find((symbol) => symbol.label === bestLabel);

  if (bestCount === 3) {
    return {
      tone: bestSymbol.label === "BUG" ? "status-danger" : "status-win",
      payout: bestSymbol.triplePayout,
      headline: bestSymbol.line,
    };
  }

  if (bestCount === 2) {
    return {
      tone: bestSymbol.label === "BUG" ? "status-danger" : "status-loss",
      payout: bestSymbol.pairPayout,
      headline:
        bestSymbol.label === "BUG"
          ? "Two BUGs. Legal says this is still a soft launch, but the support inbox disagrees."
          : `Two ${bestSymbol.label}. Investors call this traction because no one can prove otherwise.`,
    };
  }

  const minorTax = 4 + Math.floor(Math.random() * 6);
  return {
    tone: "status-loss",
    payout: -minorTax,
    headline: `No match. A consultant billed <strong>${minorTax} tokens</strong> to say "agentic" twelve times.`,
  };
}

function applyOutcome(outcome, results) {
  const net = outcome.payout;
  const prettyResults = results.map((item) => item.label).join(" • ");

  if (net >= 0) {
    state.balance += net;
    state.lifetimeWins += net;
    state.streak += 1;
  } else {
    state.balance = Math.max(0, state.balance + net);
    state.taxesPaid += Math.abs(net);
    state.streak = 0;
  }

  if (outcome.headline.includes("BUG")) {
    state.taxesPaid += 6;
  }

  addHistory(
    `<strong>${prettyResults}</strong> -> ${outcome.headline} Net result: <strong>${formatSigned(net)}</strong> tokens.`
  );
  setStatus(outcome.tone, `${stripTags(outcome.headline)} Net: ${formatSigned(net)} tokens.`);
  celebrate(outcome);
}

function addHistory(message) {
  state.history.unshift(message);
  state.history = state.history.slice(0, 6);
}

function resetEconomy() {
  Object.assign(state, structuredClone(economyDefaults));
  elements.reels.forEach((reel, index) => {
    reel.textContent = symbols[index].label;
  });
  setStatus("status-loss", "Economy reset. The cap table has been spiritually cleansed.");
  render();
  persist();
}

function setStatus(toneClass, message) {
  elements.status.className = `status-line ${toneClass}`;
  elements.status.textContent = message;
}

function celebrate(outcome) {
  if (navigator.vibrate) {
    navigator.vibrate(outcome.payout >= 0 ? [80, 40, 120] : [50, 30, 50]);
  }

  const reelFrame = document.querySelector(".reel-frame");
  reelFrame.animate(
    outcome.payout >= 0
      ? [
          { boxShadow: "0 0 0 rgba(82, 227, 194, 0)" },
          { boxShadow: "0 0 36px rgba(82, 227, 194, 0.55)" },
          { boxShadow: "0 0 0 rgba(82, 227, 194, 0)" },
        ]
      : [
          { transform: "translateX(0)" },
          { transform: "translateX(-8px)" },
          { transform: "translateX(8px)" },
          { transform: "translateX(0)" },
        ],
    {
      duration: 480,
      easing: "ease-out",
    }
  );
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
}

function stripTags(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent || container.innerText || "";
}
