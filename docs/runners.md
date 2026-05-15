# Runners

Harness Lab v0.1 has one runner: a local Markdown scaffold generator.

It creates a run folder with one file per harness stage. It does not call model APIs, execute tools, or enforce approval gates. The user works through the generated files manually.

## Current runner

### Prompt runner

Creates artifacts and prompts for manual execution.

Properties:

- local filesystem only
- no network calls
- no shell execution
- no model execution
- no database
- generated output belongs under ignored `runs/`

## Possible future runners

Future runners may include:

- LangGraph runner
- OpenAI Agents SDK runner
- Claude Code runner
- Codex runner
- GitHub issue runner
- GitHub PR audit runner

These are not implemented today.

### Local runner

Calls model APIs locally and saves outputs.

### Tool-integrated runner

Connects to tools like GitHub, Linear, Slack, Codex, Claude Code, or local test runners.

### Production runner

Adds durable state, retries, traces, evals, approval gates, and deployment controls.
