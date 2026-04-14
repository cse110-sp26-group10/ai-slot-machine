const STORAGE_KEY = "token-tugger-9000-state";
const SPIN_COST = 15;
const STARTING_BALANCE = 120;
const MAX_LEDGER_ENTRIES = 8;
const BAILOUT_TOKENS = 45;
const MAX_BAILOUTS = 3;

const defaultSpendItems = [
  { label: "Starter fee", cost: 0 },
];

const symbols = [
  { icon: "\u{1F916}", label: "Hallucination Bot", weight: 3 },
  { icon: "\u{1FA99}", label: "Prompt Token", weight: 4 },
  { icon: "\u{1F525}", label: "GPU Bonfire", weight: 2 },
  { icon: "\u{1F4C9}", label: "Valuation Dip", weight: 3 },
  { icon: "\u{1F9C3}", label: "VC Juice", weight: 2 },
  { icon: "\u{1F4A5}", label: "Cloud Outage", weight: 2 },
  { icon: "\u{1F9E0}", label: "Synthetic Genius", weight: 3 },
];

const moods = [
  "Confidently wrong",
  "Pivoting to enterprise",
  "Benchmarkmaxxing",
  "Pre-seed and overheating",
  "Aligned with quarterly goals",
  "Rate-limited by destiny",
];

const headlines = [
  "Board approves a 14th subscription tier for premium blinking cursors.",
  "Analysts confirm your chatbot now needs a chatbot to explain billing.",
  "Local founder says GPU smoke adds artisanal depth to the product.",
  "Every spin funds a fresh apology post on social media.",
  "The machine is now token-gated for your protection, allegedly.",
  "A memo just leaked: your prompt tokens were translated into vibes.",
];

const excuses = {
  win: [
    "A profitable spin, which management is treating as a branding problem.",
    "Clearly skill-based. Please ignore the weighted capitalism.",
    "The machine achieved temporary excellence before product could intervene.",
  ],
  mixed: [
    "You won, then the platform remembered its values.",
    "Partial success. Finance calls this a monetization handshake.",
    "Two symbols aligned and the machine immediately invoiced the moment.",
  ],
  lose: [
    "Those tokens were reallocated to improve executive mindfulness.",
    "Loss detected. The machine is calling it an inference fee.",
    "Variance is just disruption wearing a visor.",
  ],
  broke: [
    "Out of tokens. Time to go freelance as a prompt whisperer.",
    "Liquidity event postponed until you click reboot.",
  ],
};

const taxLines = [
  "Platform tax: the machine discovered premium air around your winnings.",
  "Safety surcharge: several tokens were spent preventing fun.",
  "Inference rent: the loading shimmer now has a management layer.",
  "Enterprise uplift: product converted your luck into annual pricing.",
  "Compliance snack: the PDF budget remains undefeated.",
];

const walletLines = [
  "Wallet says the tokens are real, spiritually if not financially.",
  "Treasury update: one more spin and accounting becomes interpretive dance.",
  "Your token stash just got benchmarked against a toaster with ambition.",
  "The wallet applauds your courage and questions your judgment.",
  "Finance bot reports strong momentum and weaker fundamentals.",
];

const sessionLines = [
  "The dashboard says engagement is up. It means you clicked twice.",
  "Product insists this is retention. Accounting insists otherwise.",
  "A fresh cohort analysis reveals you are still here, somehow.",
];

const bailoutLines = [
  "A tiny bridge round closed on vibes, menace, and one unusable demo.",
  "Angels wired emergency tokens after seeing the phrase agentic moat on slide seven.",
  "Fresh capital arrived from a cousin who mistook this for infrastructure.",
  "A strategic partner invested 45 tokens and requested zero due diligence.",
];

const spendCatalog = [
  { label: "Agent swarm orchestration surcharge", min: 3, max: 8 },
  { label: "Premium autocomplete aura", min: 2, max: 6 },
  { label: "Context window stretching cream", min: 4, max: 10 },
  { label: "Enterprise hallucination insurance", min: 3, max: 7 },
  { label: "Tasteful loading shimmer subscription", min: 2, max: 5 },
  { label: "Board-ready chart smoothing", min: 1, max: 4 },
  { label: "Compliance fog machine", min: 2, max: 6 },
  { label: "Investor confidence rendering", min: 3, max: 9 },
];

const balanceEl = document.getElementById("balance");
const moodEl = document.getElementById("mood");
const burnRateEl = document.getElementById("burnRate");
const headlineEl = document.getElementById("headline");
const resultTextEl = document.getElementById("resultText");
const multiplierTextEl = document.getElementById("multiplierText");
const excuseTextEl = document.getElementById("excuseText");
const walletLineEl = document.getElementById("walletLine");
const taxLineEl = document.getElementById("taxLine");
const sessionLineEl = document.getElementById("sessionLine");
const streakLineEl = document.getElementById("streakLine");
const grossWinEl = document.getElementById("grossWin");
const spendTotalEl = document.getElementById("spendTotal");
const netResultEl = document.getElementById("netResult");
const netCaptionEl = document.getElementById("netCaption");
const retainedBarEl = document.getElementById("retainedBar");
const retainedPercentEl = document.getElementById("retainedPercent");
const spendListEl = document.getElementById("spendList");
const announcerEl = document.getElementById("announcer");
const spinButton = document.getElementById("spinButton");
const bailoutButton = document.getElementById("bailoutButton");
const shareButton = document.getElementById("shareButton");
const exportButton = document.getElementById("exportButton");
const notifyButton = document.getElementById("notifyButton");
const resetButton = document.getElementById("resetButton");
const ledgerListEl = document.getElementById("ledgerList");
const leverKnobEl = document.getElementById("leverKnob");
const reelEls = [0, 1, 2].map((index) => document.getElementById(`reel-${index}`));
const cardEl = document.querySelector(".machine-card");

let state = loadState();
let spinning = false;
let audioContext = null;

updateReels([symbols[0], symbols[1], symbols[2]]);
render();

spinButton.addEventListener("click", spin);
bailoutButton.addEventListener("click", requestBailout);
shareButton.addEventListener("click", shareStatus);
exportButton.addEventListener("click", exportLedger);
notifyButton.addEventListener("click", enableNotifications);
resetButton.addEventListener("click", resetGame);
document.addEventListener("keydown", handleKeydown);

function loadState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createDefaultState();
    }

    const parsed = JSON.parse(saved);

    return {
      balance: toPositiveNumber(parsed.balance, STARTING_BALANCE),
      lastBurn: toNumber(parsed.lastBurn, 0),
      spins: toNumber(parsed.spins, 0),
      sessionNet: toNumber(parsed.sessionNet, 0),
      profitStreak: toNumber(parsed.profitStreak, 0),
      bestProfitStreak: toNumber(parsed.bestProfitStreak, 0),
      lastGrossWin: toNumber(parsed.lastGrossWin, 0),
      lastSpendTotal: toNumber(parsed.lastSpendTotal, 0),
      lastNet: toNumber(parsed.lastNet, 0),
      bailoutsUsed: clampBailouts(parsed.bailoutsUsed),
      lastSpendItems: normalizeSpendItems(parsed.lastSpendItems),
      ledger: normalizeLedger(parsed.ledger),
    };
  } catch {
    return createDefaultState();
  }
}

function createDefaultState() {
  return {
    balance: STARTING_BALANCE,
    lastBurn: 0,
    spins: 0,
    sessionNet: 0,
    profitStreak: 0,
    bestProfitStreak: 0,
    lastGrossWin: 0,
    lastSpendTotal: 0,
    lastNet: 0,
    bailoutsUsed: 0,
    lastSpendItems: defaultSpendItems,
    ledger: [],
  };
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function normalizeSpendItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return defaultSpendItems;
  }

  return items.slice(0, 5).map((item) => ({
    label: typeof item.label === "string" ? item.label : "Mystery platform charge",
    cost: toNumber(item.cost, 0),
  }));
}

function normalizeLedger(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.slice(0, MAX_LEDGER_ENTRIES).map((item, index) => ({
    spin: toNumber(item.spin, index + 1),
    summary: typeof item.summary === "string" ? item.summary : "Ledger entry unavailable.",
    net: toNumber(item.net, 0),
  }));
}

function toNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function toPositiveNumber(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function clampBailouts(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(MAX_BAILOUTS, Math.floor(value)));
}

function render() {
  balanceEl.textContent = String(state.balance);
  burnRateEl.textContent = `${state.lastBurn} tokens`;
  moodEl.textContent = state.balance < SPIN_COST ? "Funding winter" : moods[state.balance % moods.length];
  sessionLineEl.textContent = `${state.spins} spins, ${formatSigned(state.sessionNet)} tokens net. ${pick(sessionLines)}`;
  streakLineEl.textContent = `Bailouts used: ${state.bailoutsUsed}/${MAX_BAILOUTS}. Best streak: ${state.bestProfitStreak} profitable spins.`;
  grossWinEl.textContent = `${state.lastGrossWin} tokens`;
  spendTotalEl.textContent = `${state.lastSpendTotal} tokens`;
  netResultEl.textContent = `${formatSigned(state.lastNet)} tokens`;
  netResultEl.className = classifyNet(state.lastNet);
  netCaptionEl.textContent = buildNetCaption();

  const retainedPercent = calculateRetainedPercent(state.lastGrossWin, state.lastSpendTotal);
  retainedPercentEl.textContent = `${retainedPercent}%`;
  retainedBarEl.style.width = `${retainedPercent}%`;

  renderSpendItems();
  renderLedger();

  spinButton.disabled = spinning || state.balance < SPIN_COST;
  bailoutButton.disabled = spinning || state.balance >= SPIN_COST || state.bailoutsUsed >= MAX_BAILOUTS;
  shareButton.disabled = spinning;
  exportButton.disabled = spinning || state.ledger.length === 0;
  notifyButton.disabled = spinning || !("Notification" in window);
  spinButton.textContent = state.balance < SPIN_COST ? "Need more tokens" : `Spin For ${SPIN_COST} Tokens`;
  bailoutButton.textContent =
    state.bailoutsUsed >= MAX_BAILOUTS
      ? "Investors stopped replying"
      : state.balance >= SPIN_COST
        ? "Pitch investors for more tokens"
        : `Pitch investors for ${BAILOUT_TOKENS} tokens`;
  notifyButton.textContent = getNotificationLabel();
}

function buildNetCaption() {
  if (state.spins === 0) {
    return "The machine is idle, but finance is ready.";
  }

  if (state.lastNet > 0) {
    return "A rare positive outcome survived the monetization funnel.";
  }

  if (state.lastNet === 0) {
    return "You broke even, which the machine considers a bug.";
  }

  return "Most of your winnings were humanely converted into platform value.";
}

function classifyNet(net) {
  if (net > 0) {
    return "net-positive";
  }

  if (net < 0) {
    return "net-negative";
  }

  return "net-neutral";
}

function calculateRetainedPercent(gross, spent) {
  if (gross <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(((gross - spent) / gross) * 100)));
}

function resetGame() {
  state = createDefaultState();
  saveState();

  headlineEl.textContent = "Machine rebooted. The hype cycle has been restored.";
  resultTextEl.textContent = "Fresh capital acquired. Please waste it responsibly.";
  multiplierTextEl.textContent = "1x due to selective optimism";
  excuseTextEl.textContent = "A brand-new quarter begins with exactly zero lessons learned.";
  walletLineEl.textContent = "Seed round cleared. The machine can now afford one dramatic demo.";
  taxLineEl.textContent = "No surprise platform fee yet.";
  announce("The token machine was rebooted.");
  clearFlash();
  updateReels([symbols[0], symbols[1], symbols[2]]);
  render();
}

function requestBailout() {
  if (spinning) {
    return;
  }

  if (state.balance >= SPIN_COST) {
    headlineEl.textContent = "Runway still exists. Investors demand a little more panic first.";
    announce("Bailout unavailable while you can still afford a spin.");
    return;
  }

  if (state.bailoutsUsed >= MAX_BAILOUTS) {
    headlineEl.textContent = "The term sheet evaporated. Even the AI skeptics passed.";
    excuseTextEl.textContent = "No more bridge rounds. Reboot the hype cycle and pretend it was a pivot.";
    announce("No bailout attempts remaining.");
    return;
  }

  state.balance += BAILOUT_TOKENS;
  state.bailoutsUsed += 1;
  state.lastBurn = 0;
  state.lastGrossWin = BAILOUT_TOKENS;
  state.lastSpendTotal = 0;
  state.lastNet = BAILOUT_TOKENS;
  state.lastSpendItems = [{ label: "Emergency investor optimism", cost: 0 }];
  state.sessionNet += BAILOUT_TOKENS;
  state.profitStreak += 1;
  state.bestProfitStreak = Math.max(state.bestProfitStreak, state.profitStreak);

  headlineEl.textContent = pick(bailoutLines);
  resultTextEl.textContent = `Bridge round secured. ${BAILOUT_TOKENS} tokens hit the wallet before anyone asked about revenue.`;
  multiplierTextEl.textContent = "Infinite x narrative leverage. Gross bailout, zero product proof.";
  excuseTextEl.textContent = "The pitch deck contained three charts, four gradients, and one impossible TAM.";
  walletLineEl.textContent = "Treasury update: the runway now extends several irresponsible decisions.";
  taxLineEl.textContent = "No platform fee this time. Investors chose to be the joke directly.";

  state.ledger.unshift({
    spin: state.spins,
    summary: `Emergency bailout raised ${BAILOUT_TOKENS} tokens after the machine entered a confidence recession.`,
    net: BAILOUT_TOKENS,
  });
  state.ledger = state.ledger.slice(0, MAX_LEDGER_ENTRIES);

  saveState();
  clearFlash();
  cardEl.classList.add("flash-win");
  playVictoryTone();
  maybeNotify("Bridge round closed", `Emergency funding delivered ${BAILOUT_TOKENS} tokens. No one inspected the demo.`);
  announce("Emergency funding secured.");
  render();
}

async function spin() {
  if (spinning || state.balance < SPIN_COST) {
    if (state.balance < SPIN_COST) {
      excuseTextEl.textContent = pick(excuses.broke);
      announce("Not enough tokens to spin.");
    }
    return;
  }

  spinning = true;
  clearFlash();
  state.spins += 1;
  state.balance -= SPIN_COST;
  state.lastBurn = SPIN_COST;
  state.lastGrossWin = 0;
  state.lastSpendTotal = 0;
  state.lastNet = -SPIN_COST;
  state.lastSpendItems = [{ label: "Spin fee", cost: SPIN_COST }];
  saveState();
  render();

  headlineEl.textContent = pick(headlines);
  walletLineEl.textContent = pick(walletLines);
  taxLineEl.textContent = "The platform is scanning for a fee to invent.";

  if ("vibrate" in navigator) {
    navigator.vibrate([20, 50, 20]);
  }

  playTone(220, 0.05, "square");
  pullLever();
  reelEls.forEach((reel) => reel.classList.add("spinning"));

  const finalSymbols = [];

  for (let index = 0; index < reelEls.length; index += 1) {
    const symbol = await spinReel(reelEls[index], index);
    finalSymbols.push(symbol);
  }

  const payout = score(finalSymbols);
  const spendPlan = buildSpendPlan(payout);
  const totalExtraction = Math.min(state.balance + payout.tokens, spendPlan.total);
  const net = payout.tokens - SPIN_COST - totalExtraction;

  state.balance += payout.tokens;
  state.balance = Math.max(0, state.balance - totalExtraction);
  state.lastGrossWin = payout.tokens;
  state.lastSpendTotal = totalExtraction;
  state.lastBurn = SPIN_COST + totalExtraction;
  state.lastNet = net;
  state.lastSpendItems = spendPlan.items;
  state.sessionNet += net;

  if (net > 0) {
    state.profitStreak += 1;
    state.bestProfitStreak = Math.max(state.bestProfitStreak, state.profitStreak);
  } else {
    state.profitStreak = 0;
  }

  addLedgerEntry(finalSymbols, payout, totalExtraction, net);
  saveState();
  presentOutcome(finalSymbols, payout, totalExtraction);

  spinning = false;
  render();
}

function spinReel(reel, index) {
  const duration = 620 + index * 220;
  const interval = 85;

  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      reel.textContent = pick(symbols).icon;
    }, interval);

    window.setTimeout(() => {
      const symbol = weightedPick(symbols);
      window.clearInterval(timer);
      reel.textContent = symbol.icon;
      reel.classList.remove("spinning");
      playTone(310 + index * 70, 0.04, "triangle");
      resolve(symbol);
    }, duration);
  });
}

function score(reels) {
  const icons = reels.map((item) => item.icon);
  const counts = icons.reduce((map, icon) => {
    map[icon] = (map[icon] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((left, right) => right - left);
  const allMatch = values[0] === 3;
  const pair = values[0] === 2;
  const gpuJackpot = icons.every((icon) => icon === "\u{1F525}");
  const outageRefund = icons.every((icon) => icon === "\u{1F4A5}");

  if (gpuJackpot) {
    return { tokens: 150, multiplier: "10x thermal event", type: "win" };
  }

  if (outageRefund) {
    return { tokens: SPIN_COST, multiplier: "1x outage refund", type: "mixed" };
  }

  if (allMatch) {
    return { tokens: 90, multiplier: "6x founder delusion", type: "win" };
  }

  if (pair) {
    return { tokens: 30, multiplier: "2x marketable coincidence", type: "mixed" };
  }

  return { tokens: 0, multiplier: "0x pure disruption", type: "lose" };
}

function presentOutcome(reels, payout, extraction) {
  const labels = reels.map((item) => item.label).join(" • ");

  resultTextEl.textContent =
    state.lastNet >= 0
      ? `${labels}. Net gain: ${state.lastNet} tokens after the platform helped itself.`
      : `${labels}. Net loss: ${Math.abs(state.lastNet)} tokens after the machine's "services."`;

  multiplierTextEl.textContent = `${payout.multiplier}. Gross ${payout.tokens}, auto-spent ${extraction}.`;
  excuseTextEl.textContent = pick(excuses[payout.type]);
  taxLineEl.textContent =
    extraction === 0
      ? "Miracle detected: no extra platform extraction on this spin."
      : `${pick(taxLines)} Total extraction: ${extraction} tokens.`;
  walletLineEl.textContent = pick(walletLines);

  if (payout.type === "win") {
    cardEl.classList.add("flash-win");
    reelEls.forEach((reel) => reel.classList.add("win"));
    playVictoryTone();

    if ("vibrate" in navigator) {
      navigator.vibrate([40, 80, 40, 80, 120]);
    }
  } else if (payout.type === "lose") {
    cardEl.classList.add("flash-lose");
    playTone(165, 0.09, "sawtooth");
  } else {
    cardEl.classList.add("flash-mixed");
    playTone(280, 0.08, "square");
  }

  announce(`Spin complete. ${resultTextEl.textContent}`);
  maybeNotify("Spin complete", buildNotificationBody(payout, extraction));

  window.setTimeout(() => {
    reelEls.forEach((reel) => reel.classList.remove("win"));
  }, 450);
}

function updateReels(reels) {
  reelEls.forEach((reel, index) => {
    reel.textContent = reels[index].icon;
  });
}

function clearFlash() {
  cardEl.classList.remove("flash-win", "flash-lose", "flash-mixed");
}

function renderSpendItems() {
  spendListEl.innerHTML = "";

  state.lastSpendItems.forEach((item) => {
    const row = document.createElement("li");
    const label = document.createElement("span");
    const cost = document.createElement("strong");

    row.className = "spend-item";
    label.textContent = item.label;
    cost.textContent = `${item.cost} tokens`;

    row.append(label, cost);
    spendListEl.append(row);
  });
}

function renderLedger() {
  ledgerListEl.innerHTML = "";

  const items = state.ledger.length
    ? state.ledger
    : [{
        spin: 0,
        summary: "No ledger entries yet. The accountants are stretching.",
        net: 0,
      }];

  items.forEach((entry) => {
    const row = document.createElement("li");
    const spin = document.createElement("span");
    const summary = document.createElement("span");
    const net = document.createElement("strong");

    row.className = "ledger-item";
    spin.className = "ledger-spin";
    summary.className = "ledger-summary";
    net.className = `ledger-net ${classifyLedgerNet(entry.net)}`;

    spin.textContent = `Spin ${entry.spin}`;
    summary.textContent = entry.summary;
    net.textContent = `${formatSigned(entry.net)} tokens`;

    row.append(spin, summary, net);
    ledgerListEl.append(row);
  });
}

function classifyLedgerNet(net) {
  if (net > 0) {
    return "positive";
  }

  if (net < 0) {
    return "negative";
  }

  return "neutral";
}

function addLedgerEntry(reels, payout, extraction, net) {
  const reelLabels = reels.map((item) => item.label).join(", ");
  const summary = `${reelLabels}. Gross ${payout.tokens}, auto-spent ${extraction}, verdict: ${payout.multiplier}.`;

  state.ledger.unshift({
    spin: state.spins,
    summary,
    net,
  });

  state.ledger = state.ledger.slice(0, MAX_LEDGER_ENTRIES);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function weightedPick(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.random() * totalWeight;

  for (const item of items) {
    threshold -= item.weight;
    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSpendPlan(payout) {
  if (payout.tokens === 0) {
    const cost = randomInt(3, 6);

    return {
      total: cost,
      items: [{ label: "Emergency model confidence repaint", cost }],
    };
  }

  const spendCount = payout.type === "win" ? randomInt(2, 4) : randomInt(1, 3);
  const picks = shuffle(spendCatalog).slice(0, spendCount);
  const items = picks.map((item) => ({
    label: item.label,
    cost: randomInt(item.min, item.max),
  }));
  const total = items.reduce((sum, item) => sum + item.cost, 0);

  return { total, items };
}

function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

function announce(message) {
  announcerEl.textContent = message;
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    headlineEl.textContent = "Notifications unavailable. The browser chose inner peace.";
    announce("Notifications are unavailable in this browser.");
    render();
    return;
  }

  if (Notification.permission === "granted") {
    headlineEl.textContent = "Hype alerts already enabled. The machine can now bother you off-spin too.";
    maybeNotify("Alerts already on", "Your token drama remains fully push-enabled.");
    announce("Notifications were already enabled.");
    render();
    return;
  }

  if (Notification.permission === "denied") {
    headlineEl.textContent = "Alerts were blocked. Even the browser has boundaries.";
    announce("Notifications are blocked.");
    render();
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    headlineEl.textContent = "Hype alerts enabled. Your browser is now an accomplice.";
    maybeNotify("Hype alerts enabled", "Expect premium updates whenever the machine monetizes your luck.");
    announce("Notifications enabled.");
  } else {
    headlineEl.textContent = "Alert permission declined. The machine will sulk on-page instead.";
    announce("Notifications were not enabled.");
  }

  render();
}

async function shareStatus() {
  const shareText = `I have ${state.balance} prompt tokens left in Token Tugger 9000 after ${state.spins} spins, and the machine already auto-spent ${state.lastSpendTotal} from my last win because apparently that counts as AI progress.`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Token Tugger 9000",
        text: shareText,
      });
      headlineEl.textContent = "Your token shame has been syndicated.";
      announce("Shared the current token status.");
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(shareText);
      headlineEl.textContent = "Status copied. The clipboard is now complicit.";
      announce("Copied the current token status to the clipboard.");
      return;
    } catch {
      headlineEl.textContent = "Clipboard access failed. Governance blames the browser.";
      announce("Clipboard access failed.");
      return;
    }
  }

  headlineEl.textContent = "Sharing unavailable. Please describe the disaster manually.";
  announce("Sharing is unavailable in this browser.");
}

function exportLedger() {
  if (!state.ledger.length) {
    headlineEl.textContent = "No ledger yet. Spin first so finance has something to misclassify.";
    announce("No ledger entries available to export.");
    return;
  }

  const payload = {
    game: "Token Tugger 9000",
    exportedAt: new Date().toISOString(),
    balance: state.balance,
    spins: state.spins,
    sessionNet: state.sessionNet,
    lastGrossWin: state.lastGrossWin,
    lastSpendTotal: state.lastSpendTotal,
    entries: state.ledger,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "token-tugger-ledger.json";
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  headlineEl.textContent = "Ledger exported. Finance calls it a transparency premium.";
  announce("Exported the token ledger.");
}

function getNotificationLabel() {
  if (!("Notification" in window)) {
    return "Alerts unavailable";
  }

  if (Notification.permission === "granted") {
    return "Hype alerts enabled";
  }

  if (Notification.permission === "denied") {
    return "Alerts blocked";
  }

  return "Enable hype alerts";
}

function maybeNotify(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, { body });
  } catch {
    // Ignore notification failures and keep the game moving.
  }
}

function buildNotificationBody(payout, extraction) {
  if (state.lastNet > 0) {
    return `Gross win ${payout.tokens}. Platform extraction ${extraction}. Net survivor: ${state.lastNet} tokens.`;
  }

  if (state.lastNet === 0) {
    return `Gross win ${payout.tokens}. Platform extraction ${extraction}. You somehow broke even.`;
  }

  return `Gross win ${payout.tokens}. Platform extraction ${extraction}. Net loss: ${Math.abs(state.lastNet)} tokens.`;
}

function pullLever() {
  if (!leverKnobEl) {
    return;
  }

  leverKnobEl.classList.add("pulled");
  window.setTimeout(() => {
    leverKnobEl.classList.remove("pulled");
  }, 360);
}

function playVictoryTone() {
  const ready = getAudioContext();

  if (!ready) {
    return;
  }

  const now = audioContext.currentTime;
  const gain = audioContext.createGain();

  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  [440, 554.37, 659.25].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.06);
    oscillator.connect(gain);
    oscillator.start(now + index * 0.06);
    oscillator.stop(now + 0.3 + index * 0.06);
  });
}

function playTone(frequency, duration, type) {
  const ready = getAudioContext();

  if (!ready) {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.0001;
  gain.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return false;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return true;
}

function formatSigned(value) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function handleKeydown(event) {
  if (event.code !== "Space") {
    return;
  }

  const target = event.target;
  const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tagName === "button" || tagName === "input" || tagName === "textarea") {
    return;
  }

  event.preventDefault();
  spin();
}
