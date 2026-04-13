# CSE 110 Tech Warm-Up: The One Arm AI Slot Machine Experiment

## Experimental Parameters
To ensure data integrity, all team members must strictly adhere to these constants:

* **Coding Assistant:** Anthropic's Claude Code
* **Model String:** `claude-4-6-sonnet` (Latest available Sonnet model)
* **Harness/Environment:** Local terminal via `claude` CLI
* **Baseline Prompt:** (Stored in `prompts/original-prompt.txt`)
    > "Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens."

## Protocol
1.  **Clean Sessions:** Before every run, ensure no `CLAUDE.md`, no project memory, and no active context exists. Use `claude chat --no-history` (or equivalent) to ensure a fresh start.
2.  **No Hand-Editing:** Do not modify a single character of generated code. If it doesn't run, mark "Runs in browser? No" in the metrics.
3.  **Data Capture:** Record all metrics (tokens, time, lines of code) immediately after generation into the specific candidate folder.

## Directory Structure
* `/prompts`: Contains `original-prompt.txt` and all `refinement-prompt-stepX.txt` files.
* `/step1`: 50 folders (`candidate-001` to `candidate-050`).
* `/step2` through `/step5`: Refinement rounds.
* `RUBRIC.md`: Our evaluation criteria.
