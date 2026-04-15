# FINAL-REPORT.md

## FINAL Refinements
After running the Step 4 refinement, we selected the winner. 

| Rank | Candidate ID | Total Tokens (refine) | Lines of Code | Selection Rationale |
|:---:|:---:|:---:|:---:|:---|
| 1 | [031](candidate-031-refinement-1/) | 72,130 | 1,336 | Still the strongest overall candidate. The refinement added persistent state, a clean reset flow, and richer per-spin telemetry without hurting the already polished UI or readable structure. |
| 2 | [034](candidate-034-refinement-1/) | 50,871 | 1,682 | Refinement improved the compact layout, event feed, and local session persistence while keeping the app visually tight and thematically consistent. It stayed strong in both satire and code cleanliness, but felt a little less complete than 031 overall. |

---

## 🔍 Key Observations

### 1. Better Code Quality
After the refinement rounds, the overall code quality improved, especially if the initial implementation is already strong. However, improvement does not mean code is the most readable or clean. 

### 2. No Predictive Factors
Codex has a lot of variability in its responses. It often produces different code and approaches to the same prompt. Metrics such as token count or lines of code do not reliably correlate to code quality, indicating some degree of unpredictability and unreliability.  

## What We Learned

We learned that AI can generate usable applications, demonstrating its practical value in software development. However, it also has limitations that developers need to recognize. The resulting code is not always clean or easy to read, and common metrics do not reliably predict quality. AI is a powerful tool, but it requires refinement by developers and programmers to improve the application. 


