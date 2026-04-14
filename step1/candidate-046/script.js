const symbols = ["🤖", "🪙", "🔥", "📉", "🧃"];
const state = {
  balance: 120,
  spinCost: 15,
  jackpot: 250,
  spinning: false,
  fundingClaims: 0
};

const reelElements = Array.from({ length: 3 }, (_, index) =>
  document.getElementById(`reel-${index}`)
);

const balanceEl = document.getElementById("token-balance");
const spinCostEl = document.getElementById("spin-cost");
const jackpotEl = document.getElementById("jackpot-value");
const statusEl = document.getElementById("status-line");
const logEl = document.getElementById("event-log");
const spinButton = document.getElementById("spin-button");
const bonusButton = document.getElementById("bonus-button");
const machineEl = document.querySelector(".machine");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function render() {
  balanceEl.textContent = String(state.balance);
  spinCostEl.textContent = String(state.spinCost);
  jackpotEl.textContent = String(state.jackpot);
  spinButton.disabled = state.spinning || state.balance < state.spinCost;
}

function addLog(message) {
  const item = document.createElement("li");
  item.textContent = message;
  logEl.prepend(item);

  while (logEl.children.length > 6) {
    logEl.removeChild(logEl.lastElementChild);
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function evaluate(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});
  const values = Object.values(counts).sort((a, b) => b - a);

  if (values[0] === 3) {
    const symbol = result[0];
    if (symbol === "🤖") {
      return {
        payout: state.jackpot,
        message: "Three chatbots aligned. The hype cycle paid out the full jackpot."
      };
    }

    if (symbol === "🪙") {
      return {
        payout: 120,
        message: "Pure token symmetry. Someone will call this product-market fit."
      };
    }

    if (symbol === "🔥") {
      return {
        payout: 90,
        message: "Three fires. Congratulations on monetizing the burn rate."
      };
    }

    return {
      payout: 70,
      message: "Triple match achieved. The deck now says autonomous revenue."
    };
  }

  if (values[0] === 2) {
    return {
      payout: 35,
      message: "Two symbols matched. Not profit, but enough to extend the runway."
    };
  }

  return {
    payout: 0,
    message: "No match. You generated vibes, metrics, and zero usable margin."
  };
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

async function animateSpin() {
  state.spinning = true;
  render();

  reelElements.forEach((reel) => reel.classList.add("spinning"));

  for (let frame = 0; frame < 12; frame += 1) {
    reelElements.forEach((reel) => {
      reel.textContent = randomSymbol();
    });
    await delay(80 + frame * 4);
  }

  const result = reelElements.map(() => randomSymbol());

  for (let index = 0; index < result.length; index += 1) {
    reelElements[index].textContent = result[index];
    await delay(160);
  }

  reelElements.forEach((reel) => reel.classList.remove("spinning"));
  return result;
}

function pulseMachine(className) {
  machineEl.classList.remove("flash-win", "flash-loss");
  machineEl.classList.add(className);
  window.setTimeout(() => machineEl.classList.remove(className), 700);
}

async function handleSpin() {
  if (state.spinning || state.balance < state.spinCost) {
    setStatus("Insufficient tokens. Try external funding or reduce your model ambitions.");
    return;
  }

  state.balance -= state.spinCost;
  setStatus(`Spent ${state.spinCost} tokens to ask the machine for one more breakthrough.`);
  addLog(`Spin purchased for ${state.spinCost} tokens. Unit economics remain fictional.`);
  render();

  const result = await animateSpin();
  const outcome = evaluate(result);
  state.balance += outcome.payout;

  if (outcome.payout > 0) {
    pulseMachine("flash-win");
    setStatus(`${result.join(" ")}. ${outcome.message} Net payout: ${outcome.payout} tokens.`);
    addLog(`${result.join(" ")} paid ${outcome.payout} tokens back into the wallet.`);
  } else {
    pulseMachine("flash-loss");
    setStatus(`${result.join(" ")}. ${outcome.message}`);
    addLog(`${result.join(" ")} delivered only strategic storytelling.`);
  }

  if (state.balance === 0) {
    setStatus("Wallet empty. The machine achieved what the AI industry calls efficiency.");
    addLog("All tokens exhausted. Pivot deck generation imminent.");
  }

  state.spinning = false;
  render();
}

function handleFunding() {
  if (state.spinning) {
    return;
  }

  state.fundingClaims += 1;
  const grant = Math.max(30, 70 - state.fundingClaims * 10);
  state.balance += grant;
  state.jackpot += 10;

  setStatus(
    `A venture capitalist heard the phrase "agentic" and injected ${grant} tokens. Jackpot inflated to ${state.jackpot}.`
  );
  addLog(`Funding round ${state.fundingClaims}: +${grant} tokens for existing near the word AI.`);

  if (state.fundingClaims >= 4) {
    bonusButton.disabled = true;
    bonusButton.textContent = "Funding Dried Up";
    addLog("Investors now request revenue, which has complicated the story.");
  }

  render();
}

spinButton.addEventListener("click", handleSpin);
bonusButton.addEventListener("click", handleFunding);

render();
