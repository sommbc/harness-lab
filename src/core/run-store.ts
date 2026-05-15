import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { HarnessDefinition, HarnessRun } from './types.js';
import { slugify } from './text.js';

type CreateRunOptions = {
  name?: string;
  runsDir?: string;
  createdAt?: string;
};

export async function createRun(harness: HarnessDefinition, options: CreateRunOptions = {}): Promise<HarnessRun> {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const runName = resolveRunName(harness.id, createdAt, options.name);
  const runsDir = options.runsDir ?? path.join(process.cwd(), 'runs');
  const runPath = path.join(runsDir, runName);

  await fs.mkdir(runsDir, { recursive: true });
  try {
    await fs.mkdir(runPath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') {
      throw new Error(`Run already exists: ${runPath}`, { cause: error });
    }

    throw error;
  }

  const readme = buildRunReadme(harness, createdAt);
  await fs.writeFile(path.join(runPath, 'README.md'), readme, 'utf8');

  for (const [index, stage] of harness.stages.entries()) {
    const number = String(index + 1).padStart(2, '0');
    const fileName = `${number}-${slugify(stage.id) || `stage-${number}`}.md`;
    const body = buildStageFile(harness, stage);
    await fs.writeFile(path.join(runPath, fileName), body, 'utf8');
  }

  return {
    harnessId: harness.id,
    harnessName: harness.name,
    path: runPath,
    createdAt,
  };
}

function buildRunReadme(harness: HarnessDefinition, createdAt: string): string {
  return `# ${harness.name} Run\n\nCreated: ${createdAt}\n\nHarness: ${harness.id}\n\n## Purpose\n\n${harness.description}\n\n## How to use this run\n\nHarness Lab v0.1 creates local markdown scaffolds. It does not call model APIs or execute tools for you. Work through each stage manually, paste or write the output into the matching file, and stop at approval gates before continuing.\n\n## Stages\n\n${harness.stages.map((stage, index) => `${index + 1}. ${stage.name}`).join('\n')}\n`;
}

function buildStageFile(harness: HarnessDefinition, stage: HarnessDefinition['stages'][number]): string {
  return `# ${stage.name}\n\nHarness: ${harness.name}\nStage ID: ${stage.id}\nAgent prompt: ${stage.agent ?? 'None'}\nApproval gate: ${stage.approval ?? 'none'}\n\n## Goal\n\n${stage.description ?? 'Describe the stage goal here.'}\n\n## Inputs\n\n${formatList(stage.inputs, '- None')}\n\n## Output artifacts\n\n${formatList(stage.outputs, '- Add output artifacts here.')}\n\n## Stage output\n\nWrite the stage output here.\n`;
}

function formatList(values: string[] | undefined, fallback: string): string {
  return values?.length ? values.map((value) => `- ${value}`).join('\n') : fallback;
}

function resolveRunName(harnessId: string, createdAt: string, name?: string): string {
  if (name) {
    const namedRun = slugify(name);
    if (namedRun) {
      return namedRun;
    }
  }

  const timestamp = createdAt.replace(/[:.]/gu, '-').slice(0, 19);
  return slugify(`${timestamp}-${harnessId}`) || 'run';
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
