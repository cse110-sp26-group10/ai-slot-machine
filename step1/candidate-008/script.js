const symbols = [
  { icon: "🪙", label: "Token" },
  { icon: "🤖", label: "Hallucination" },
  { icon: "🔥", label: "GPU Fire" },
  { icon: "📈", label: "Growth Chart" },
  { icon: "🧠", label: "Synthetic Insight" },
  { icon: "🫠", label: "Alignment Slip" },
  { icon: "💼", label: "Enterprise Upsell" },
  { icon: "🧃", label: "VC Juice" },
];

const spinCost = 75;
const startingTokens = 1200;
const bestBalanceKey = "token-extraction-casino-best-balance";

const spendSinks = [
  { title: "Prompt laundering fee", ratio: 0.25, copy: "A consultant polished your question into the same question." },
  { title: "Context window expansion", ratio: 0.35, copy: "Congratulations, the model can now forget more things at a higher price." },
  { title: "GPU cooling surcharge", ratio: 0.2, copy: "The racks remained warm and spiritually expensive." },
  { title: "Agent orchestration overhead", ratio: 0.4, copy: "Several autonomous interns debated your request in parallel." },
  { title: "Enterprise dashboard seat", ratio: 0.3, copy: "One executive can now monitor token evaporation in real time." },
];

const payouts = {
  threeMatch: 420,
  twoMatch: 160,
  tokenTriple: 900,
  chaosTriple: 40,
};

const state = {
  balance: startingTokens,
  spins: 0,
  won: 0,
  burned: 0,
  bestBalance: startingTokens,
  spinning: false,
};

const ui = {
  balance: document.getElementById("token-balance"),
  hype: document.getElementById("hype-meter"),
  spinCount: document.getElementById("spin-count"),
  won: document.getElementById("tokens-won"),
  burned: document.getElementById("tokens-burned"),
  bestBalance: document.getElementById("best-balance"),
  resultTitle: document.getElementById("result-title"),
  resultCopy: document.getElementById("result-copy"),
  spendTitle: document.getElementById("spend-title"),
  spendCopy: document.getElementById("spend-copy"),
  feed: document.getElementById("feed"),
  spinButton: document.getElementById("spin-button"),
  resetButton: document.getElementById("reset-button"),
  reels: [
    document.getElementById("reel-1"),
    document.getElementById("reel-2"),
    document.getElementById("reel-3"),
  ],
  machine: document.querySelector(".machine"),
};

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function setHypeMeter() {
  if (state.balance >= 2200) {
    ui.hype.textContent = "Unicorn";
    return;
  }

  if (state.balance >= 1400) {
    ui.hype.textContent = "Series B";
    return;
  }

  if (state.balance >= 700) {
    ui.hype.textContent = "Seed Round";
    return;
  }

  ui.hype.textContent = "Down Round";
}

function pushFeed(message) {
  const item = document.createElement("li");
  item.textContent = message;
  ui.feed.prepend(item);

  while (ui.feed.children.length > 6) {
    ui.feed.removeChild(ui.feed.lastChild);
  }
}

function render() {
  state.bestBalance = Math.max(state.bestBalance, state.balance);
  window.localStorage.setItem(bestBalanceKey, String(state.bestBalance));

  ui.balance.textContent = formatNumber(state.balance);
  ui.spinCount.textContent = formatNumber(state.spins);
  ui.won.textContent = formatNumber(state.won);
  ui.burned.textContent = formatNumber(state.burned);
  ui.bestBalance.textContent = formatNumber(state.bestBalance);
  ui.spinButton.disabled = state.spinning || state.balance < spinCost;
  ui.spinButton.textContent =
    state.balance < spinCost ? "Out of Tokens" : "Spin the Model";
  setHypeMeter();
}

function evaluateSpin(results) {
  const [a, b, c] = results.map((item) => item.label);

  if (a === "Token" && b === "Token" && c === "Token") {
    return {
      win: payouts.tokenTriple,
      title: "Jackpot: infinite synergies.",
      copy: "Three pure tokens. Investors are calling this artificial revenue.",
    };
  }

  if (a === b && b === c) {
    return {
      win: payouts.threeMatch,
      title: `Triple ${a}.`,
      copy: `A perfectly aligned stack of ${a.toLowerCase()} has impressed the market for no clear reason.`,
    };
  }

  if (a === b || b === c || a === c) {
    return {
      win: payouts.twoMatch,
      title: "Partial benchmark victory.",
      copy: "Two matching symbols is more than enough for a keynote slide.",
    };
  }

  return {
    win: payouts.chaosTriple,
    title: "Chaotic demo bonus.",
    copy: "Nothing matched, but the machine called it emergent behavior and shipped anyway.",
  };
}

function spendWinnings(win) {
  if (win <= 0) {
    return {
      burned: 0,
      title: "No upsell selected.",
      copy: "There were no winnings available for immediate monetization.",
    };
  }

  const sink = spendSinks[Math.floor(Math.random() * spendSinks.length)];
  const burned = Math.min(win, Math.round(win * sink.ratio));

  return {
    burned,
    title: sink.title,
    copy: sink.copy,
  };
}

function animateReels(finalResults) {
  const intervals = [];

  ui.machine.classList.remove("flash-win", "flash-loss");
  ui.reels.forEach((reel) => reel.parentElement.classList.add("spinning"));

  finalResults.forEach((result, index) => {
    const interval = window.setInterval(() => {
      ui.reels[index].textContent = randomSymbol().icon;
    }, 90);

    intervals.push(interval);

    window.setTimeout(() => {
      window.clearInterval(interval);
      ui.reels[index].textContent = result.icon;
      ui.reels[index].parentElement.classList.remove("spinning");
    }, 650 + index * 260);
  });

  return 650 + finalResults.length * 260;
}

function spin() {
  if (state.spinning || state.balance < spinCost) {
    return;
  }

  state.spinning = true;
  state.spins += 1;
  state.balance -= spinCost;
  state.burned += spinCost;
  ui.resultTitle.textContent = "Inference in progress.";
  ui.resultCopy.textContent = "Sampling premium nonsense from three expensive reels.";
  ui.spendTitle.textContent = "Preparing monetization.";
  ui.spendCopy.textContent = "Any successful output will be converted into overhead.";
  render();

  const results = [randomSymbol(), randomSymbol(), randomSymbol()];
  const animationTime = animateReels(results);

  window.setTimeout(() => {
    const outcome = evaluateSpin(results);
    const spend = spendWinnings(outcome.win);
    const netGain = outcome.win - spend.burned;

    state.won += outcome.win;
    state.burned += spend.burned;
    state.balance += netGain;
    state.spinning = false;

    ui.resultTitle.textContent = outcome.title;
    ui.resultCopy.textContent = `${outcome.copy} Gross win: ${formatNumber(outcome.win)} tokens. Net after platform drama: ${formatNumber(netGain)}.`;
    ui.spendTitle.textContent = spend.title;
    ui.spendCopy.textContent = `${spend.copy} ${formatNumber(spend.burned)} tokens disappeared on contact.`;
    ui.machine.classList.add(netGain > spinCost ? "flash-win" : "flash-loss");

    pushFeed(
      `${outcome.title} You paid ${spinCost}, won ${outcome.win}, and burned ${spend.burned} on ${spend.title.toLowerCase()}.`
    );

    if (state.balance < spinCost) {
      ui.resultTitle.textContent = "Runway depleted.";
      ui.resultCopy.textContent =
        "The machine suggests raising another round or clicking New Funding Round.";
    }

    render();
  }, animationTime);
}

function resetGame() {
  state.balance = startingTokens;
  state.spins = 0;
  state.won = 0;
  state.burned = 0;
  state.spinning = false;

  const starter = [symbols[1], symbols[2], symbols[0]];
  starter.forEach((symbol, index) => {
    ui.reels[index].textContent = symbol.icon;
    ui.reels[index].parentElement.classList.remove("spinning");
  });

  ui.resultTitle.textContent = "Fresh liquidity acquired.";
  ui.resultCopy.textContent =
    "A new funding round has restored confidence and exactly the same questionable business model.";
  ui.spendTitle.textContent = "No upsell selected.";
  ui.spendCopy.textContent =
    "The machine is waiting to convert your curiosity into recurring cost.";
  ui.feed.innerHTML = "";
  pushFeed("Funding round closed. Token burn can resume.");
  render();
}

function loadBestBalance() {
  const saved = Number(window.localStorage.getItem(bestBalanceKey));

  if (Number.isFinite(saved) && saved > 0) {
    state.bestBalance = saved;
  }
}

ui.spinButton.addEventListener("click", spin);
ui.resetButton.addEventListener("click", resetGame);

loadBestBalance();
resetGame();
