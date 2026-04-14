const symbols = ["🤖", "🪙", "💥", "📉", "🧠", "💸", "🫠"];

const symbolNames = {
  "🤖": "automation bot",
  "🪙": "token stack",
  "💥": "hallucination burst",
  "📉": "valuation collapse",
  "🧠": "overfit brain",
  "💸": "burn rate",
  "🫠": "ethics disclaimer"
};

const triplePayouts = {
  "🪙": 120,
  "🤖": 90,
  "💥": 75,
  "🧠": 65,
  "💸": 50,
  "📉": 45,
  "🫠": 40
};

const moods = [
  "Smug",
  "Overtrained",
  "Pivoting",
  "Token Hungry",
  "Benchmarking",
  "Legally Distinct"
];

const pairMessages = [
  "Two symbols matched. The AI calls that “emergent intelligence” and invoices you anyway.",
  "A pair! Barely enough structure for a startup deck, but it pays.",
  "Pattern detected. The machine is now calling itself a research lab."
];

const missMessages = [
  "No match. Your tokens were reinvested into vibes and unrequested summaries.",
  "The reels missed. The AI used your credits to generate a longer apology.",
  "Nothing lined up. Management says the burn rate is actually a moat.",
  "Bust. The machine insists this was a strategic fine-tuning expense."
];

const jackpotMessages = {
  "🪙": "Triple tokens! The machine accidentally created real value. Security has been notified.",
  "🤖": "Three bots aligned. Congratulations, you automated a meeting about automating meetings.",
  "💥": "Hallucination jackpot! The AI invented profits and paid you in confidence.",
  "🧠": "Overfit brain sweep. The model memorized the slot machine and called it reasoning.",
  "💸": "Burn-rate bonanza. Somehow losing money became a premium feature.",
  "📉": "Valuation collapse combo. Investors panicked, and token prices went on clearance.",
  "🫠": "Ethics disclaimer trifecta. The machine feels bad, but not bad enough to stop."
};

const state = {
  balance: 120,
  spinCost: 15,
  spinning: false,
  log: ["System booted. Confidence level: 104%."]
};

const reelNodes = [0, 1, 2].map((index) => document.getElementById(`reel${index}`));
const tokenBalanceNode = document.getElementById("tokenBalance");
const systemMoodNode = document.getElementById("systemMood");
const messageNode = document.getElementById("message");
const eventLogNode = document.getElementById("eventLog");
const spinButton = document.getElementById("spinButton");
const resetButton = document.getElementById("resetButton");
const machineNode = document.querySelector(".machine");

function updateUi() {
  tokenBalanceNode.textContent = String(state.balance);
  spinButton.disabled = state.spinning || state.balance < state.spinCost;
  systemMoodNode.textContent = state.balance < state.spinCost ? "Broke" : moods[state.balance % moods.length];

  if (state.balance < state.spinCost && !state.spinning) {
    messageNode.textContent = "You ran out of tokens. Classic AI business model: spend first, maybe infer later.";
  }

  eventLogNode.innerHTML = "";
  state.log.slice(0, 5).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    eventLogNode.appendChild(item);
  });
}

function addLog(entry) {
  state.log.unshift(entry);
  updateUi();
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function evaluateSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] ?? 0) + 1;
    return map;
  }, {});

  const [topSymbol, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  if (topCount === 3) {
    return {
      payout: triplePayouts[topSymbol],
      message: jackpotMessages[topSymbol],
      tone: "win"
    };
  }

  if (topCount === 2) {
    return {
      payout: 25,
      message: pairMessages[Math.floor(Math.random() * pairMessages.length)],
      tone: "win"
    };
  }

  return {
    payout: 0,
    message: missMessages[Math.floor(Math.random() * missMessages.length)],
    tone: "loss"
  };
}

function setMachineTone(tone) {
  machineNode.classList.remove("celebrate", "broke");

  if (tone === "win") {
    machineNode.classList.add("celebrate");
  } else if (tone === "loss") {
    machineNode.classList.add("broke");
  }
}

async function spin() {
  if (state.spinning || state.balance < state.spinCost) {
    updateUi();
    return;
  }

  state.spinning = true;
  state.balance -= state.spinCost;
  messageNode.textContent = "Allocating premium inference budget. Please enjoy the artificial suspense.";
  updateUi();

  const finalResult = reelNodes.map(() => randomSymbol());

  for (let step = 0; step < 12; step += 1) {
    reelNodes.forEach((node, index) => {
      node.classList.add("spinning");
      node.textContent = step > 8 + index ? finalResult[index] : randomSymbol();
    });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 90 + step * 12);
    });
  }

  reelNodes.forEach((node, index) => {
    node.classList.remove("spinning");
    node.textContent = finalResult[index];
  });

  const outcome = evaluateSpin(finalResult);
  state.balance += outcome.payout;
  state.spinning = false;
  messageNode.textContent = outcome.message;
  setMachineTone(outcome.tone);

  const resultNames = finalResult.map((symbol) => symbolNames[symbol]).join(", ");
  const delta = outcome.payout ? `won ${outcome.payout}` : "lost the spin cost";
  addLog(`Rolled ${resultNames}; ${delta}.`);
}

function resetGame() {
  state.balance = 120;
  state.spinning = false;
  state.log = ["System rebooted. New investors, same bad idea."];
  machineNode.classList.remove("celebrate", "broke");

  reelNodes.forEach((node, index) => {
    node.classList.remove("spinning");
    node.textContent = ["🤖", "💸", "🪙"][index];
  });

  messageNode.textContent = "Fresh capital acquired. The machine is ready to disrespect it.";
  updateUi();
}

spinButton.addEventListener("click", spin);
resetButton.addEventListener("click", resetGame);

updateUi();
