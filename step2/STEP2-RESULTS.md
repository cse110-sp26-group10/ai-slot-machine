# STEP2-RESULTS.md

## Top 3 Refinements
After running the Step 2 refinement round on our five Step 1 finalists (see `step1/STEP1-RESULTS.md`), we selected the following three refined candidates to advance. Selections are based on how much the refinement pass actually improved the app — polish, satire, and code cleanliness — rather than raw rubric score.

| Rank | Candidate ID | Total Tokens (refine) | Lines of Code | Selection Rationale |
|:---:|:---:|:---:|:---:|:---|
| 1 | [031](candidate-031-refinement-1/) | 909,200 | 1,108 | Already the strongest baseline; refinement added persistent state, a clean reset flow, and richer per-spin telemetry without breaking the polished UI. |
| 2 | [044](candidate-034-refinement-1/) | 785,500 | 1,054 | Refinement tightened the layout into a compact results area and added a richer event feed plus local session persistence, while keeping the cheeky mood-meter personality intact. |
| 3 | [009](candidate-009-refinement-1/) | 465,000 | 1,198 | The sharpest satire of the bunch ("Hallucination", "Benchmark Theater", "GPU Throttle"). Refinement added auto-spin, a telemetry strip, and a ledger section, all built on a single shared state object. |

## 🔍 Key Observations

Running the same refinement prompt across five candidates made it much easier to see where Codex reliably improves a codebase and where it just shuffles things around. Candidates that started from a cleaner structure (031, 034) picked up meaningful upgrades — persistence, reset flows, better telemetry — in a single pass. Candidates with weaker baselines tended to get more code without getting proportionally better.

### 1. Refinement Helps Polished Baselines Most

The refinements that moved the needle were the ones applied to apps that were already coherent. 031 and 034 gained real features (persistent state, richer event history, tighter result panels). Weaker baselines like 028 got longer files but not a qualitatively better experience, which is why they didn't make this cut.

### 2. Satire Survives Refinement Better Than Expected

Our worry going in was that a "clean this up" pass would sand off the AI-satire personality. It mostly didn't. 009 kept (and arguably sharpened) its hallucination-themed reel symbols, and 034 kept its mood meter. Codex seems to treat the themed strings as content to preserve rather than noise to normalize.

### 3. Token Cost Is Not Predictive of Refinement Quality

031 spent the most tokens on refinement (~909K) and produced the best result, but 009 spent roughly half that (~465K) and still landed in the top three with the strongest thematic voice. Refinement token cost looks more correlated with how much Codex chose to rewrite than with how much the app actually improved.
