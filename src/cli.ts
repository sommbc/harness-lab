#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { listHarnesses, loadHarness } from './core/harness.js';
import { createRun } from './core/run-store.js';

const program = new Command();

program
  .name('harness-lab')
  .description('Create local markdown run folders from inspectable harness YAML definitions.')
  .version('0.1.0')
  .option('--harness-dir <dir>', 'Directory containing harness definition folders');

program
  .command('list')
  .description('List available harnesses')
  .action(async () => {
    const harnessDir = await resolveHarnessDir();
    const harnesses = await listHarnesses({ harnessDir });
    if (harnesses.length === 0) {
      console.log('No harnesses found.');
      return;
    }

    console.log('Available harnesses:\n');
    for (const harness of harnesses) {
      console.log(`- ${harness}`);
    }
  });

program
  .command('show')
  .argument('<harness>', 'Harness id')
  .description('Show a harness definition')
  .action(async (harnessId: string) => {
    const harness = await loadHarness(harnessId, { harnessDir: await resolveHarnessDir() });
    console.log(JSON.stringify(harness, null, 2));
  });

program
  .command('validate')
  .description('Validate all harness definitions')
  .action(async () => {
    const harnessDir = await resolveHarnessDir();
    const harnesses = await listHarnesses({ harnessDir });

    for (const harnessId of harnesses) {
      await loadHarness(harnessId, { harnessDir });
    }

    console.log(`Validated ${harnesses.length} harness${harnesses.length === 1 ? '' : 'es'}.`);
  });

program
  .command('new')
  .argument('<harness>', 'Harness id')
  .option('-n, --name <name>', 'Run name')
  .option('--runs-dir <dir>', 'Directory for generated run folders', 'runs')
  .description('Create a new local run folder for a harness')
  .action(async (harnessId: string, options: { name?: string; runsDir: string }) => {
    const harness = await loadHarness(harnessId, { harnessDir: await resolveHarnessDir() });
    const run = await createRun(harness, {
      name: options.name,
      runsDir: path.resolve(options.runsDir),
    });

    console.log(`Created run: ${run.path}`);
    console.log('\nNext step: open the generated files and work through each stage manually.');
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});

async function resolveHarnessDir(): Promise<string> {
  const options = program.opts<{ harnessDir?: string }>();
  if (options.harnessDir) {
    return path.resolve(options.harnessDir);
  }

  const cwdHarnessDir = path.resolve('harnesses');
  if (await directoryExists(cwdHarnessDir)) {
    return cwdHarnessDir;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '..', 'harnesses');
}

async function directoryExists(directory: string): Promise<boolean> {
  try {
    const stat = await fs.stat(directory);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
