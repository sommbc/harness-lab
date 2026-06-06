# Public Review Notes

Harness Lab is public by design as a small local CLI for making AI workflow harnesses inspectable before automating them.

## What A Reviewer Can Verify

- TypeScript CLI for listing, validating, showing, and creating harness run folders.
- YAML harness definitions with strict ID, stage, maturity, approval, and duplicate-stage validation.
- Generated run folders are local-only and ignored by git.
- Tests cover harness loading, unsafe IDs, duplicate stage rejection, CLI behavior, and run-folder creation.
- CI runs lint, typecheck, harness validation, tests, build, dependency audit, package dry run, secret scan, and whitespace checks.

## Public Boundary

The repository should not contain generated `runs/` output, private prompts, secrets, customer tasks, local tool logs, or hidden autonomous execution. Intentional examples belong under `examples/`.

## Scope Boundary

v0.1 is a harness scaffold and runbook generator. It does not call model APIs, execute shell commands, run tools, store a database, or provide a web UI.

## Quality Bar

The public surface should stay:

- boring and readable
- local-first
- plain YAML and Markdown
- explicit about approval gates
- honest about what is manual versus automated
