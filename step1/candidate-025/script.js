const STARTING_TOKENS = 125;
const SPIN_COST = 25;
const BAILOUT_AMOUNT = 100;
const STORAGE_KEYS = {
  balance: "ai-slot-balance",
  best: "ai-slot-best-balance",
  log: "ai-slot-event-log",
};

const SYMBOLS = [
  { icon: "🤖", label: "bot" },
  { icon: "🪙", label: "token" },
  { icon: "💸", label: "burn rate" },
  { icon: "🧠", label: "prompt engineer" },
  { icon: "🚀", label: "hype cycle" },
  { icon: "💰", label: "VC money" },
  { icon: "📉", label: "benchmark chart" },
  { icon: "☠️", label: "hallucination" },
];

const WIN_MESSAGES = [
  "The demo impressed one executive who still thinks transformers are literal robots.",
  "A venture capitalist mistook your slot machine for a roadmap and funded it.",
  "Three shiny icons aligned and the tokens rained down like irresponsible cloud credits.",
  "Against all odds, the AI did a useful thing once.",
];

const LOSS_MESSAGES = [
  "The model used your tokens to summarize a tweet thread badly.",
  "Another spin, another invoice from the GPU cluster.",
  "Your carefully engineered prompt has been converted into warm investor vibes.",
  "The machine generated confidence, not value.",
];

const dom = {
  balance: document.querySelector("#token-balance"),
  best: document.querySelector("#best-balance"),
  cost: document.querySelector("#spin-cost"),
  banner: document.querySelector("#status-banner"),
  summary: document.querySelector("#round-summary"),
  spinButton: document.querySelector("#spin-button"),
  seedButton: document.querySelector("#seed-button"),
  eventLog: document.querySelector("#event-log"),
  reels: [...document.querySelectorAll("[data-reel]")],
  symbols: [0, 1, 2].map((index) => document.querySelector(`#reel-${index}`)),
  machine: document.querySelector(".machine"),
};

let balance = readNumber(STORAGE_KEYS.balance, STARTING_TOKENS);
let bestBalance = readNumber(STORAGE_KEYS.best, balance);
let eventLog = readLog();
let spinning = false;

dom.cost.textContent = formatTokens(SPIN_COST);
render();

dom.spinButton.addEventListener("click", spin);
dom.seedButton.addEventListener("click", requestBailout);

function spin() {
  if (spinning) {
    return;
  }

  if (balance < SPIN_COST) {
    updateStatus(
      "Out of tokens. Even the AI says your runway is gone.",
      "Ask for a bailout or refresh your delusions."
    );
    flashMachine("flash-loss");
    return;
  }

  spinning = true;
  balance -= SPIN_COST;
  render();
  dom.spinButton.disabled = true;
  dom.banner.textContent = "Streaming three premium nonsense tokens...";

  const result = drawSymbols(3);
  animateSpin(result).then(() => {
    const outcome = scoreSpin(result);
    balance += outcome.payout;
    bestBalance = Math.max(bestBalance, balance);

    updateStatus(outcome.banner, outcome.summary);
    pushEvent(`${result.map((entry) => entry.icon).join(" ")} ${outcome.logLine}`);
    persistState();
    render();
    flashMachine(outcome.payout >= SPIN_COST ? "flash-win" : "flash-loss");
    if (navigator.vibrate) {
      navigator.vibrate(outcome.payout >= SPIN_COST ? [80, 40, 80] : [120]);
    }

    dom.spinButton.disabled = false;
    spinning = false;
  });
}

function requestBailout() {
  if (spinning) {
    return;
  }

  balance += BAILOUT_AMOUNT;
  bestBalance = Math.max(bestBalance, balance);
  updateStatus(
    "Emergency funding secured.",
    "A VC heard the word 'AI' and gave you 100 more tokens."
  );
  pushEvent("💰 Bailout secured. The pitch deck had no numbers, only gradients.");
  persistState();
  render();
  flashMachine("flash-win");
}

function drawSymbols(count) {
  return Array.from({ length: count }, () => {
    const randomIndex = Math.floor(Math.random() * SYMBOLS.length);
    return SYMBOLS[randomIndex];
  });
}

function animateSpin(result) {
  const animations = dom.reels.map((reel, index) => {
    const symbolNode = dom.symbols[index];
    const previewIcons = Array.from({ length: 7 }, () => randomSymbol().icon);
    let step = 0;

    const timer = window.setInterval(() => {
      symbolNode.textContent = previewIcons[step % previewIcons.length];
      step += 1;
    }, 70);

    return reel
      .animate(
        [
          { transform: "translateY(0) rotate(0deg)" },
          { transform: "translateY(-8px) rotate(-1deg)" },
          { transform: "translateY(0) rotate(0deg)" },
        ],
        {
          duration: 650 + index * 220,
          easing: "cubic-bezier(.2,.8,.2,1)",
        }
      )
      .finished.finally(() => {
        window.clearInterval(timer);
        symbolNode.textContent = result[index].icon;
      });
  });

  return Promise.all(animations);
}

function scoreSpin(result) {
  const icons = result.map((entry) => entry.icon);
  const counts = icons.reduce((accumulator, icon) => {
    accumulator[icon] = (accumulator[icon] || 0) + 1;
    return accumulator;
  }, {});

  const hasSkull = icons.includes("☠️");
  const allEqual = Object.values(counts).includes(3);
  const twoOfKind = Object.values(counts).includes(2);
  const isSeriesACombo = ["🧠", "💰", "🚀"].every((icon) => icons.includes(icon));

  if (hasSkull) {
    return {
      payout: 0,
      banner: "Production incident detected.",
      summary: "A hallucination slipped into the reel. Your tokens were incinerated by a hotfix sprint.",
      logLine: "The model went off-policy and took the quarter with it.",
    };
  }

  if (allEqual) {
    return {
      payout: 200,
      banner: "Jackpot. Pure synthetic synergy.",
      summary: pick(WIN_MESSAGES),
      logLine: `Triple ${result[0].label}. You pocketed 200 tokens.`,
    };
  }

  if (isSeriesACombo) {
    return {
      payout: 140,
      banner: "Series A secured.",
      summary: "A prompt engineer, investor money, and a rocket emoji created temporary market confidence.",
      logLine: "The startup-industrial complex delivered 140 tokens.",
    };
  }

  if (twoOfKind) {
    return {
      payout: 60,
      banner: "Respectable benchmark theater.",
      summary: "Two matching icons fooled everyone into believing the product has traction.",
      logLine: "Two of a kind bought you 60 tokens.",
    };
  }

  return {
    payout: 10,
    banner: "Consolation prize unlocked.",
    summary: pick(LOSS_MESSAGES),
    logLine: "You got 10 pity tokens for staying online.",
  };
}

function updateStatus(banner, summary) {
  dom.banner.textContent = banner;
  dom.summary.textContent = summary;
}

function pushEvent(message) {
  eventLog.unshift(message);
  eventLog = eventLog.slice(0, 6);
}

function render() {
  dom.balance.textContent = formatTokens(balance);
  dom.best.textContent = formatTokens(bestBalance);
  dom.spinButton.disabled = spinning || balance < SPIN_COST;
  dom.spinButton.textContent =
    balance >= SPIN_COST ? `Spend ${SPIN_COST} tokens` : "Need more tokens";
  dom.eventLog.innerHTML = "";

  if (eventLog.length === 0) {
    pushEvent("🪙 You arrived with 125 tokens and more confidence than evidence.");
  }

  for (const item of eventLog) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    dom.eventLog.append(listItem);
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.balance, String(balance));
  localStorage.setItem(STORAGE_KEYS.best, String(bestBalance));
  localStorage.setItem(STORAGE_KEYS.log, JSON.stringify(eventLog));
}

function readNumber(key, fallback) {
  const value = Number(localStorage.getItem(key));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readLog() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.log) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
}

function randomSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function flashMachine(className) {
  dom.machine.classList.remove("flash-win", "flash-loss");
  dom.machine.classList.add(className);
  window.setTimeout(() => dom.machine.classList.remove(className), 420);
}

function formatTokens(value) {
  return new Intl.NumberFormat("en-US").format(value);
}
