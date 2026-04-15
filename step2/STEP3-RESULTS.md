# STEP3-RESULTS.md

## Top 2 Refinements
After running the Step 3 refinement round on our three refined step 1 finalists (see `step2/STEP2-RESULTS.md`), we selected the following two refined candidates to advance. Selections are based on how much the refinement pass actually improved the app — polish, satire, and code cleanliness — rather than raw rubric score.

| Rank | Candidate ID | Total Tokens (refine) | Lines of Code | Selection Rationale |
|:---:|:---:|:---:|:---:|:---|
| 1 | [031](candidate-031-refinement-1/) | 72,130 | 1,336 | Still the strongest overall candidate. The refinement added persistent state, a clean reset flow, and richer per-spin telemetry without hurting the already polished UI or readable structure. |
| 2 | [034](candidate-034-refinement-1/) | 50,871 | 1,682 | Refinement improved the compact layout, event feed, and local session persistence while keeping the app visually tight and thematically consistent. It stayed strong in both satire and code cleanliness, but felt a little less complete than 031 overall. |

---

## 🔍 Key Observations

Running the same refinement prompt across three strong candidates made it easier to see what Codex improves reliably and what it tends to leave mostly unchanged. The best results came from candidates that already had a clean structure and a polished interaction model. In this round, 031 and 034 clearly benefited the most from refinement, while the third candidate remained solid but did not improve as meaningfully.

### 1. Refinement Rewards Strong Baselines

The biggest gains came from apps that were already coherent before the refinement pass. Both 031 and 034 picked up meaningful improvements — better persistence, clearer reset behavior, stronger telemetry, and tighter UI organization. Their refinements felt additive rather than disruptive, which is what made them stand out.

### 2. Polish and Structure Matter More Than Extra Features

The winning candidates did not just add more code. They improved clarity. 031 became easier to read and use while adding richer state handling, and 034 sharpened its layout and feedback without becoming messy. The weaker finalist still had personality, but it did not make the same leap in overall quality.

### 3. Satire Held Up Well in the Best Candidates

A useful outcome from this round was that refinement did not flatten the humor. Both 031 and 034 kept their AI-satire voice intact while becoming more polished. The joke still comes through in the labels, telemetry, and status text, but the apps now feel more intentional and complete rather than just funny.

### 4. More Tokens Did Not Automatically Mean a Better App

031 used the most refinement tokens and ended up as the best result, but the gap was not just about token cost. What mattered more was how effectively the refinement improved usability, coherence, and structure. The top two were the candidates where the extra generation effort translated into visible quality gains.
