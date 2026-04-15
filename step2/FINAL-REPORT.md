# FINAL-REPORT.md

## Final Candidate
Based on our team's evaluation rubric (defined in `RUBRIC.md`), we have selected the following five candidates to proceed to the Final Refinement Round. 

| Rank | Candidate ID | Total Tokens | Lines of Code | Efficiency (LOC/1k) | Selection Rationale |
|:---:|:---:|:---:|:---:|:---:|:---|
| 1 | 031 | 127,210 | 587 | 0.0046 | Extremely polished, with animations and intuitive layout |
| 2 | 034 | 151,850 | 709 | 0.0046 | App is done well, has a cheeky mood meter |
| 3 | 009 | 283,000 | 730 | 0.0026 | Fits the theme very well, has a fun "where your tokens went" section |

## 🔍 Key Observations

Overall, the user interface is very polished . 
-little buggy 
-not the cleanest code 
-not the easiest to read 
-loc are changing 
-not reliable 

### 1. Structural Drift (Architecture)

In all of the candidates, a JavaScript file, a CSS file, and an HTML file was output, with minor differences. Codex would get the names wrong sometimes linking all the files together and it would result in the app not working. All the page layouts looked mostly the same, with a title/wallet section, then the slot machine, and then some auxilary information/features at the bottom of the page.

### 2. Feature Drift (Requirement Hallucination)

Most of the time, Codex was able to get most of the core functionality correct. Sometimes Codex would also leave out a few things, such as displaying the wallet, or a reset button. Codex would also add extra buttons that didn't really do anything, which debatably adds to the theming of the AI slot machine.
