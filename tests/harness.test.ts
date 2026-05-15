import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { listHarnesses, loadHarness } from '../src/core/harness.js';

test('lists only directories with harness.yaml files', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-lab-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const harnessDir = path.join(root, 'harnesses');
  await mkdir(path.join(harnessDir, 'demo'), { recursive: true });
  await mkdir(path.join(harnessDir, 'notes'), { recursive: true });
  await writeFile(path.join(harnessDir, 'demo', 'harness.yaml'), demoHarnessYaml(), 'utf8');

  assert.deepEqual(await listHarnesses({ harnessDir }), ['demo']);
});

test('loads and validates a harness YAML definition', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-lab-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const harnessDir = path.join(root, 'harnesses');
  await mkdir(path.join(harnessDir, 'demo'), { recursive: true });
  await writeFile(path.join(harnessDir, 'demo', 'harness.yaml'), demoHarnessYaml(), 'utf8');

  const harness = await loadHarness('demo', { harnessDir });

  assert.equal(harness.id, 'demo');
  assert.equal(harness.name, 'Demo Harness');
  assert.equal(harness.maturity, 'prompt');
  assert.equal(harness.stages.length, 2);
  assert.deepEqual(harness.stages[0]?.outputs, ['01-intake.md']);
});

test('rejects unsafe harness ids', async () => {
  await assert.rejects(() => loadHarness('../private'), /Invalid harness id/);
});

test('rejects a harness definition whose id does not match its directory', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-lab-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const harnessDir = path.join(root, 'harnesses');
  await mkdir(path.join(harnessDir, 'demo'), { recursive: true });
  await writeFile(path.join(harnessDir, 'demo', 'harness.yaml'), demoHarnessYaml().replace('id: demo', 'id: other'), 'utf8');

  await assert.rejects(() => loadHarness('demo', { harnessDir }), /id must match directory name/);
});

test('rejects duplicate stage ids', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'harness-lab-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const harnessDir = path.join(root, 'harnesses');
  await mkdir(path.join(harnessDir, 'demo'), { recursive: true });
  await writeFile(
    path.join(harnessDir, 'demo', 'harness.yaml'),
    demoHarnessYaml().replace('id: review', 'id: intake'),
    'utf8',
  );

  await assert.rejects(() => loadHarness('demo', { harnessDir }), /duplicate stage id/);
});

function demoHarnessYaml(): string {
  return `id: demo
name: Demo Harness
description: A small prompt harness for tests.
version: 0.1.0
maturity: prompt
stages:
  - id: intake
    name: Intake
    agent: agents/intake.md
    description: Collect the task context.
    outputs:
      - 01-intake.md
    approval: none
  - id: review
    name: Review
    description: Review the drafted output.
    inputs:
      - 01-intake.md
    outputs:
      - 02-review.md
    approval: required
`;
}
