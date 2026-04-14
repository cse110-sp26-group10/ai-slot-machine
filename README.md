# CSE 110 Tech Warm-Up: The One Arm AI Slot Machine Experiment

## Experimental Parameters
To ensure data integrity, all team members must strictly adhere to these constants:

* **Coding Assistant:** Anthropic's Claude Code
* **Model String:** `Codex (GPT-5.4)` (Latest available model)
* **Harness/Environment:** Local terminal via `Codex` CLI
* **Baseline Prompt:** (Stored in `prompts/original-prompt.txt`)
    > "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens."

## Protocol
### 1. PRE-RUN SETUP
- Model: Ensure you are using Codex (GPT-5.4).
-  Clean Session: You must start a FRESH chat for every single run.
- No Context: Delete or move any CODEX.md or local config files. If using the CLI, ensure no previous session history is being pulled.
- The Prompt: Copy it from prompts/original-prompt.txt. Do NOT change a single character (no "please," no extra instructions).

### 2. THE RUN

- Start Stopwatch: Start timing as soon as you hit Enter.
- Hands Off: Once the code is generated, DO NOT EDIT IT. 
- Capture Tokens: Remember to save the input/output token counts immediately from the tool output. 
- Stop Timer: Stop your watch once the file generation is complete. -> Save this time for notes

### 3. SAVING & SCORING 
- Move Files: Move the generated code into step1/candidate-XXX/.
- Log Metrics: Fill out any info reviewer needs (e.g. timestamp, tokens, wall-clock time, tool-reported time, etc.) in a notes.md in your candidate folder. (Make a copy of RUBRIC.md)
- Close the chat window/terminal session entirely before starting your next run.

### 4. REVIEWING QUALITY
- Review it in notes.md and check for any missing info -> Check with baseline runner assigned for that candidate if there is missing info.
- Open Browser: Open the index.html in Chrome.
- App Quality: (1-5) based on the satire and if it actually spins.
- Code Quality: (1-5) based on how clean/modular the JS is.
- Browser Test: Note if it runs: Yes / No / Partial.

## Directory Structure
* `/prompts`: Contains `original-prompt.txt` and all `refinement-prompt-stepX.txt` files.
* `/step1`: 50 folders (`candidate-001` to `candidate-050`).
* `/step2` through `/step5`: Refinement rounds.
* `RUBRIC.md`: Our evaluation criteria.
