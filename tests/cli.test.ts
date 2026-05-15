import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = path.join(repoRoot, 'src', 'cli.ts');

test('CLI lists harnesses and creates a named run', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-lab-cli-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const harnessDir = path.join(root, 'harnesses');
  const runsDir = path.join(root, 'runs');
  await mkdir(path.join(harnessDir, 'demo'), { recursive: true });
  await writeFile(path.join(harnessDir, 'demo', 'harness.yaml'), demoHarnessYaml(), 'utf8');

  const listResult = await runCli(['--harness-dir', harnessDir, 'list']);
  assert.match(listResult.stdout, /Available harnesses:/);
  assert.match(listResult.stdout, /- demo/);

  const validateResult = await runCli(['--harness-dir', harnessDir, 'validate']);
  assert.match(validateResult.stdout, /Validated 1 harness\./);

  const newResult = await runCli(['--harness-dir', harnessDir, 'new', 'demo', '--name', 'CLI Smoke', '--runs-dir', runsDir]);
  assert.match(newResult.stdout, /Created run:/);
  assert.match(newResult.stdout, /work through each stage manually/);

  const stage = await readFile(path.join(runsDir, 'cli-smoke', '01-intake.md'), 'utf8');
  assert.match(stage, /Harness: Demo Harness/);
  assert.match(stage, /Stage ID: intake/);
});

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const result = await execFileAsync(process.execPath, ['--import', 'tsx', cliPath, ...args], {
    cwd: repoRoot,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function demoHarnessYaml(): string {
  return `id: demo
name: Demo Harness
description: A small prompt harness for CLI tests.
version: 0.1.0
maturity: prompt
stages:
  - id: intake
    name: Intake
    agent: agents/intake.md
    description: Collect context.
    outputs:
      - 01-intake.md
    approval: none
`;
}
