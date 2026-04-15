# FINAL-REPORT.md

## FINAL Refinements
After running the Step 4 refinement, we selected the winner. 

| Rank | Candidate ID | Total Tokens (refine) | Lines of Code | Selection Rationale |
|:---:|:---:|:---:|:---:|:---|
| 2 | [034](candidate-034-refinement-1/) | 50,871 | 1,682 | Refinement improved the compact layout, event feed, and local session persistence while keeping the app visually tight and thematically consistent. It stayed strong in both satire and code cleanliness, but felt a little less complete than 031 overall. |

---
## 50 Run Metrics
https://docs.google.com/spreadsheets/d/1cmxEUhfjNtM8FvXq1ETLny9ivmZ7PKYbPorf3MLcqCI/edit

## 🔍 Scientific Findings / Team Observations

### 1. Under the Surface Issues
At first glance, the code appears to work well. However, after multiple runs and testing, several issues became apparent. In Candidate 31, long words would get truncated. Additionally, refinement-prompt-4 caused formatting problems in Candidate 31. It would replace emojis with text, failling to align and size properly. 

### 2. Better Code Quality
After the refinement rounds, the overall code quality improved, especially if the initial implementation is already strong. However, improvement does not mean code is the most readable or clean. 

### 3. No Predictive Factors
Codex has a lot of variability in its responses. It often produces different code and approaches to the same prompt. Metrics such as token count or lines of code do not reliably correlate to code quality, indicating some degree of unpredictability and unreliability.  

## 🎓 What We Learned

We learned that AI can generate usable applications, demonstrating its practical value in software development. However, it also has limitations that developers need to recognize. The resulting code is not always clean or easy to read, and common metrics do not reliably predict quality. AI is a powerful tool, but it requires refinement by developers to improve the final application. 


