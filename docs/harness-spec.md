# Harness Spec

Harness Lab uses a simple YAML spec for v0.1.

## Example

```yaml
id: harness-creator
name: Harness Creator
description: A meta-harness that guides a manual interview and turns the answers into an inspectable harness definition.
version: 0.1.0
maturity: prompt
stages:
  - id: intake-interview
    name: Intake Interview
    agent: agents/intake-interviewer.md
    description: Interview the user about the workflow.
    outputs:
      - harness-design-brief.md
    approval: none
```

## Fields

### id

Stable machine-readable harness id.

The value must match the harness directory name and use lowercase letters, numbers, and hyphens.

### name

Human-readable harness name.

### description

One-sentence purpose.

### version

Harness version.

### maturity

One of:

- prompt
- local
- tool-integrated
- production

### stages

Ordered workflow stages.

Each stage should define:

- id
- name
- agent
- description
- inputs
- outputs
- approval

Stage IDs must be unique within the harness and use lowercase letters, numbers, and hyphens.

## Approval values

- none
- recommended
- required

## Validation

Run:

```bash
npm run validate:harnesses
```

Validation checks:

- required top-level fields
- harness ID format
- harness ID matches the directory name
- maturity value
- non-empty stage list
- stage ID format
- duplicate stage IDs
- approval value
- string-list fields such as `inputs` and `outputs`
