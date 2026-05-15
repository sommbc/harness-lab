# Harness Lab

[![CI](https://github.com/sommbc/harness-lab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/sommbc/harness-lab/actions/workflows/ci.yml)

**A local TypeScript CLI for turning agent workflows into inspectable YAML and Markdown runbooks.**

Harness Lab is for builders who already use AI coding tools, model chats, prompt chains, or review loops and want the workflow around those agents to be explicit before automating it. It creates structured local run folders from harness definitions so prompts, stages, artifacts, approval gates, and audit steps are visible in plain text.

It is intentionally not a model-calling agent framework yet. v0.1 is a clean local scaffold for designing and running prompt harnesses by hand.

## Why It Exists

Most agent workflows fail in the parts around the model: unclear stages, missing artifacts, vague approval gates, hidden manual steps, and no audit trail. Harness Lab makes those pieces concrete.

A harness defines:

- the workflow stages
- the prompt or agent role used at each stage
- inputs and outputs
- approval gates
- generated artifacts
- audit and improvement steps

The goal is simple: make agent work inspectable before making it autonomous.

## What Works Today

- List bundled harness definitions
- Validate harness YAML
- Show a parsed harness as JSON
- Generate a local Markdown run folder under `runs/`
- Prevent accidental overwrite of an existing run
- Use custom harness and run directories
- Ship a complete example run under `examples/`

## What Does Not Work Yet

- No model API calls
- No conversation engine
- No autonomous shell or tool execution
- No database or hosted service
- No web UI
- No durable run history beyond local files

## Requirements

- Node.js 20 or newer
- npm

No API keys or environment variables are required for v0.1.

## Quickstart

```bash
git clone https://github.com/sommbc/harness-lab.git
cd harness-lab
npm ci
npm run validate:harnesses
npm run dev -- list
npm run dev -- new software-delivery --name signup-validation-fix
```

That creates a local run folder:

```text
runs/signup-validation-fix/
  README.md
  01-intake-interview.md
  02-cto-planner.md
  03-prompt-redteam.md
  04-cto-rewrite.md
  05-export-prompt.md
  06-code-audit.md
  07-final-verdict.md
```

`runs/` is ignored by git. Treat it as local working output. Commit polished examples under `examples/` instead.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev -- list` | List bundled harnesses from source |
| `npm run dev -- validate` | Validate bundled harness YAML from source |
| `npm run dev -- show software-delivery` | Print one harness definition as JSON |
| `npm run dev -- new software-delivery --name signup-validation-fix` | Create a local run scaffold |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start -- list` | Run the compiled CLI |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run the test suite |
| `npm run check` | Run lint, typecheck, tests, and build |

CLI options:

```bash
npm run dev -- --harness-dir ./harnesses list
npm run dev -- --harness-dir ./harnesses new software-delivery --runs-dir ./runs --name example-run
```

When `--harness-dir` is omitted, the CLI uses `./harnesses` from the current working directory if present, then falls back to the bundled harnesses.

## Harness YAML

Harness definitions live at:

```text
harnesses/<harness-id>/harness.yaml
```

Minimal shape:

```yaml
id: software-delivery
name: Software Delivery Harness
description: Turn a rough software task into a hardened implementation prompt and audit loop.
version: 0.1.0
maturity: prompt
stages:
  - id: intake-interview
    name: Intake Interview
    agent: agents/intake-interviewer.md
    description: Gather task details, constraints, tests, and acceptance criteria.
    outputs:
      - 01-task-context.md
    approval: none
  - id: final-verdict
    name: Final Verdict
    description: Decide whether to accept, accept with risks, revise, or escalate.
    inputs:
      - 06-audit-verdict.md
    outputs:
      - 07-final-verdict.md
    approval: required
```

Required top-level fields:

- `id`
- `name`
- `description`
- `version`
- `maturity`
- `stages`

Supported `maturity` values:

- `prompt`
- `local`
- `tool-integrated`
- `production`

Supported `approval` values:

- `none`
- `recommended`
- `required`

Validation currently checks required fields, harness IDs, stage IDs, duplicate stage IDs, maturity values, approval values, and string-list fields.

## Successful Example

A completed manual run is included here:

```text
examples/software-delivery-run/
```

It shows a realistic software-delivery prompt harness moving from intake to implementation prompt, audit, and final verdict. It is intentionally committed as documentation. Generated local runs stay under ignored `runs/`.

## Architecture

```text
src/
  cli.ts              Commander CLI entrypoint
  core/
    harness.ts        YAML loading and validation
    run-store.ts      Local Markdown run folder creation
    text.ts           Slug helpers
    types.ts          Core TypeScript types

harnesses/
  harness-creator/    Prompt harness for designing new harnesses
  software-delivery/  Prompt harness for software-task planning and audit

examples/
  software-delivery-run/  Completed illustrative run output
```

The CLI is deliberately small:

1. Read harness YAML from `harnesses/<id>/harness.yaml`.
2. Validate the definition.
3. Create a run folder with one Markdown file per stage.
4. Stop. The user or their AI tool fills in each stage manually.

## Security and Privacy

Harness Lab v0.1 is local-only and does not send data over the network.

Current security properties:

- no API keys required
- no model API calls
- no shell execution
- no tool execution
- no database
- generated `runs/` output ignored by default
- harness IDs and stage IDs validated before file paths are created
- existing run folders are not overwritten

User responsibility:

- Do not paste secrets into committed examples.
- Review generated run files before sharing them.
- Treat future tool integrations as security-sensitive changes.

See [SECURITY.md](SECURITY.md) for reporting guidance.

## Licensing

Harness Lab is MIT licensed. See [LICENSE](LICENSE).

This repository contains original project code, prompts, examples, and documentation. Runtime and development dependencies are installed from npm and retain their own upstream licenses.

## Development

Install exactly from the lockfile:

```bash
npm ci
```

Run the full local quality gate:

```bash
npm run check
```

Run individual checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=moderate
```

Validate bundled harnesses:

```bash
npm run validate:harnesses
```

Check the npm package contents:

```bash
npm pack --dry-run
```

## Troubleshooting

### `No harnesses found.`

Run from the repository root, or pass `--harness-dir`:

```bash
npm run dev -- --harness-dir ./harnesses list
```

### `Run already exists`

Harness Lab will not overwrite an existing run folder. Choose a new name:

```bash
npm run dev -- new software-delivery --name signup-validation-fix-v2
```

### `id must match directory name`

The `id` in `harnesses/<id>/harness.yaml` must match the folder name. This keeps CLI names, generated runs, and package examples predictable.

## Roadmap

Near-term:

- more bundled harnesses with completed examples
- clearer validation messages with file and stage context
- export helpers for copying prompts into coding agents
- optional run summary generation

Later:

- model-backed local runners
- explicit approval-gate enforcement
- audit summary reports
- tool integrations
- persistent run history

Any move toward model calls or tool execution should be explicit, reviewed, documented, and covered by tests. The project should stay boring, inspectable, and honest.

## Contributing

Contributions are welcome if they keep the project focused.

Before opening a pull request:

```bash
npm ci
npm run check
npm audit --audit-level=moderate
```

See [CONTRIBUTING.md](CONTRIBUTING.md).
