const symbols = [
  { label: "GPU", weight: 2 },
  { label: "TOKEN", weight: 3 },
  { label: "AGENT", weight: 2 },
  { label: "PIVOT", weight: 4 },
  { label: "HYPE", weight: 4 },
  { label: "VIBE", weight: 4 },
  { label: "DEMO", weight: 3 },
  { label: "SLIDE", weight: 3 }
];

const reelNodes = [...document.querySelectorAll(".reel")];
const balanceNode = document.querySelector("#token-balance");
const messageNode = document.querySelector("#message");
const historyNode = document.querySelector("#history");
const template = document.querySelector("#history-item-template");
const spinButton = document.querySelector("#spin-button");
const cashoutButton = document.querySelector("#cashout-button");

const spinCost = 15;
const pityThreshold = 2;

let balance = 120;
let consecutiveLosses = 0;
let spinning = false;

function weightedPick() {
  const expanded = symbols.flatMap((symbol) => Array.from({ length: symbol.weight }, () => symbol.label));
  const index = Math.floor(Math.random() * expanded.length);
  return expanded[index];
}

function addHistory(text) {
  const item = template.content.firstElementChild.cloneNode(true);
  item.textContent = text;
  historyNode.prepend(item);

  while (historyNode.children.length > 6) {
    historyNode.lastElementChild.remove();
  }
}

function setMessage(text) {
  messageNode.textContent = text;
}

function updateBalance() {
  balanceNode.textContent = String(balance);
  spinButton.disabled = spinning || balance < spinCost;
}

function countMatches(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  return Object.values(counts).sort((a, b) => b - a)[0];
}

function evaluateResult(result) {
  const [a, b, c] = result;

  if (a === b && b === c) {
    if (a === "GPU") return { payout: 90, text: "Triple GPU. You monetized raw heat and called it infrastructure." };
    if (a === "AGENT") return { payout: 65, text: "Triple AGENT. Congratulations, you have replaced one intern with six dashboards." };
    if (a === "TOKEN") return { payout: 50, text: "Triple TOKEN. Securities lawyers are typing at unprecedented speed." };
    return { payout: 40, text: `Triple ${a}. The machine has mistaken repetition for product-market fit.` };
  }

  if (countMatches(result) >= 2) {
    return { payout: 20, text: "Two reels matched. Close enough for a keynote and a waitlist." };
  }

  return { payout: 0, text: "No match. The burn rate remains fully aligned with the roadmap." };
}

function highlightWins(result, payout) {
  reelNodes.forEach((node) => node.classList.remove("win"));

  if (!payout) return;

  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const winningSymbol = Object.entries(counts).find(([, count]) => count > 1)?.[0] ?? result[0];

  reelNodes.forEach((node, index) => {
    if (result[index] === winningSymbol) {
      node.classList.add("win");
    }
  });
}

function pityRig(result) {
  if (consecutiveLosses < pityThreshold) {
    return result;
  }

  const bonusSymbol = Math.random() > 0.5 ? "TOKEN" : "AGENT";
  return [bonusSymbol, bonusSymbol, weightedPick()];
}

function animateSpin(finalResult) {
  const totalTicks = 14;
  let tick = 0;

  reelNodes.forEach((node) => {
    node.classList.remove("win");
    node.classList.add("spinning");
  });

  const timer = window.setInterval(() => {
    tick += 1;

    reelNodes.forEach((node, index) => {
      node.textContent = tick >= totalTicks - index * 2 ? finalResult[index] : weightedPick();
    });

    if (tick >= totalTicks + 4) {
      window.clearInterval(timer);
      reelNodes.forEach((node) => node.classList.remove("spinning"));
      finishSpin(finalResult);
    }
  }, 90);
}

function finishSpin(result) {
  const outcome = evaluateResult(result);
  balance += outcome.payout;
  consecutiveLosses = outcome.payout === 0 ? consecutiveLosses + 1 : 0;
  spinning = false;
  highlightWins(result, outcome.payout);

  const summary = `${result.join(" / ")} -> ${outcome.payout ? `+${outcome.payout}` : "+0"} tokens`;
  addHistory(summary);
  setMessage(outcome.text);
  updateBalance();
}

function spin() {
  if (spinning || balance < spinCost) {
    return;
  }

  balance -= spinCost;
  spinning = true;
  updateBalance();
  setMessage("Allocating premium inference budget. Please wait while the machine hallucinates value.");

  const seededResult = reelNodes.map(() => weightedPick());
  const finalResult = pityRig(seededResult);
  animateSpin(finalResult);
}

function cashOutBuzzwords() {
  if (spinning) {
    return;
  }

  const spend = Math.min(balance, 25);

  if (spend === 0) {
    setMessage("Wallet empty. Even the buzzword vendor is asking for cash.");
    return;
  }

  balance -= spend;
  updateBalance();

  const lines = [
    `You spent ${spend} tokens on a "context-native paradigm shift."`,
    `You spent ${spend} tokens on an enterprise-grade vibe cascade.`,
    `You spent ${spend} tokens on an AI moat made of PDFs.`,
    `You spent ${spend} tokens on a keynote with no working demo.`
  ];
  const line = lines[Math.floor(Math.random() * lines.length)];
  setMessage(line);
  addHistory(`Buzzword purchase -> -${spend} tokens`);
}

spinButton.addEventListener("click", spin);
cashoutButton.addEventListener("click", cashOutBuzzwords);

updateBalance();
addHistory("Machine initialized -> budget loaded with 120 tokens");
