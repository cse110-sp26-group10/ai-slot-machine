const symbols = [
  { text: "GPU", weight: 3 },
  { text: "404", weight: 3 },
  { text: "NFT", weight: 2 },
  { text: "VC", weight: 2 },
  { text: "AGI", weight: 1 },
  { text: "PPT", weight: 2 },
  { text: "BOT", weight: 3 },
  { text: "DAO", weight: 1 },
];

const upgrades = [
  'You spent 10 tokens on a premium prompt template. It says "be more synergistic."',
  "A consultant sold you an AI roadmap. It is just a triangle with the word SCALE.",
  "You bought a GPU-shaped candle. Performance gains are mostly emotional.",
  'You paid for "thought leadership." It posted a blurry selfie and the word innovate.',
  "Your startup now has an AI ethics board. It is one fern in a ceramic pot.",
];

const moods = [
  "Smugly optimistic",
  "Hallucinating a roadmap",
  "Pivoting to enterprise",
  "Charging by the token",
  "Training on pure vibes",
];

const storageKey = "token-burn-casino-state";
const spinCost = 3;
const initialState = {
  tokens: 30,
  reels: ["404", "GPU", "NFT"],
  moodIndex: 0,
  log: ["Three tokens per spin. Just like a real AI startup, but cheaper."],
};

const tokenCount = document.querySelector("#token-count");
const aiMood = document.querySelector("#ai-mood");
const statusMessage = document.querySelector("#status-message");
const spinButton = document.querySelector("#spin-button");
const cashoutButton = document.querySelector("#cashout-button");
const resetButton = document.querySelector("#reset-button");
const logList = document.querySelector("#event-log");
const reelElements = Array.from(document.querySelectorAll(".reel"));

let state = loadState();

function loadState() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved ? { ...initialState, ...JSON.parse(saved) } : { ...initialState };
  } catch {
    return { ...initialState };
  }
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function weightedPick() {
  const weightedSymbols = symbols.flatMap((symbol) => Array(symbol.weight).fill(symbol.text));
  const index = Math.floor(Math.random() * weightedSymbols.length);
  return weightedSymbols[index];
}

function addLog(message) {
  state.log = [message, ...state.log].slice(0, 6);
}

function render() {
  tokenCount.textContent = String(state.tokens);
  aiMood.textContent = moods[state.moodIndex % moods.length];
  reelElements.forEach((reel, index) => {
    reel.textContent = state.reels[index];
  });

  logList.innerHTML = "";
  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    logList.append(item);
  });

  spinButton.disabled = state.tokens < spinCost;
  cashoutButton.disabled = state.tokens < 10;
  saveState();
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function evaluateSpin(results) {
  const counts = results.reduce((accumulator, value) => {
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  const maxMatch = Math.max(...Object.values(counts));

  reelElements.forEach((reel) => reel.classList.remove("win"));

  if (maxMatch === 3) {
    state.tokens += 18;
    reelElements.forEach((reel) => reel.classList.add("win"));
    setStatus(`Jackpot. The algorithm crowned you ${results[0]}-maxxed and paid out 18 tokens.`);
    addLog(`Triple ${results[0]}. Investors mistake luck for product-market fit.`);
    return;
  }

  if (maxMatch === 2) {
    state.tokens += 7;
    const matchingSymbol = Object.keys(counts).find((key) => counts[key] === 2);
    reelElements.forEach((reel) => {
      if (reel.textContent === matchingSymbol) {
        reel.classList.add("win");
      }
    });
    setStatus(`Two ${matchingSymbol}s. The market rewards your buzzword density with 7 tokens.`);
    addLog(`Matched a pair of ${matchingSymbol}s. Enough for a minor keynote and a major ego.`);
    return;
  }

  setStatus("No match. Please describe this loss as a valuable alignment exercise.");
  addLog(`Missed the board with ${results.join(" / ")}. Your runway is now mostly vibes.`);
}

function animateSpin() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const steps = reducedMotion ? 1 : 10;
  const stepDelay = reducedMotion ? 0 : 90;

  spinButton.disabled = true;
  cashoutButton.disabled = true;
  resetButton.disabled = true;

  reelElements.forEach((reel) => reel.classList.add("spinning"));

  let currentStep = 0;

  const intervalId = window.setInterval(() => {
    reelElements.forEach((reel) => {
      reel.textContent = weightedPick();
    });

    currentStep += 1;

    if (currentStep >= steps) {
      window.clearInterval(intervalId);

      state.reels = reelElements.map(() => weightedPick());
      reelElements.forEach((reel, index) => {
        reel.classList.remove("spinning");
        reel.textContent = state.reels[index];
      });

      evaluateSpin(state.reels);
      state.moodIndex += 1;
      resetButton.disabled = false;
      render();
    }
  }, stepDelay || 1);
}

function spin() {
  if (state.tokens < spinCost) {
    setStatus("You are out of tokens. Even satire has a monetization floor.");
    addLog("Wallet empty. Time to pivot from AI to artisanal lemonade.");
    render();
    return;
  }

  state.tokens -= spinCost;
  setStatus("Feeding tokens into the machine. Somewhere, an API invoice smiles.");
  animateSpin();
}

function buyUpgrade() {
  if (state.tokens < 10) {
    setStatus("Not enough tokens. Fake innovation is still strangely expensive.");
    return;
  }

  state.tokens -= 10;
  const joke = upgrades[Math.floor(Math.random() * upgrades.length)];
  state.moodIndex += 1;
  setStatus(joke);
  addLog(`Upgrade purchased. ${joke}`);
  render();
}

function resetGame() {
  state = { ...initialState };
  setStatus("Wallet reset. The AI economy rises again from pure speculation.");
  render();
}

spinButton.addEventListener("click", spin);
cashoutButton.addEventListener("click", buyUpgrade);
resetButton.addEventListener("click", resetGame);

render();
