import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { HarnessDefinition } from './types.js';

type HarnessLookupOptions = {
  harnessDir?: string;
};

export async function listHarnesses(options: HarnessLookupOptions = {}): Promise<string[]> {
  const harnessDir = resolveHarnessDir(options);

  try {
    const entries = await fs.readdir(harnessDir, { withFileTypes: true });
    const harnesses: string[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const definitionPath = path.join(harnessDir, entry.name, 'harness.yaml');
      try {
        await fs.access(definitionPath);
        harnesses.push(entry.name);
      } catch {
        // Ignore directories that are not harness definitions.
      }
    }

    return harnesses.sort();
  } catch {
    return [];
  }
}

export async function loadHarness(id: string, options: HarnessLookupOptions = {}): Promise<HarnessDefinition> {
  assertSafeHarnessId(id);

  const harnessPath = path.join(resolveHarnessDir(options), id, 'harness.yaml');
  const content = await fs.readFile(harnessPath, 'utf8');
  const harness = parseHarnessDefinition(yaml.load(content), harnessPath);
  if (harness.id !== id) {
    throw new Error(`Invalid harness definition in ${harnessPath}: id must match directory name "${id}"`);
  }

  return harness;
}

function resolveHarnessDir(options: HarnessLookupOptions): string {
  return options.harnessDir ?? path.join(process.cwd(), 'harnesses');
}

function assertSafeHarnessId(id: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(id)) {
    throw new Error(`Invalid harness id: ${id}`);
  }
}

function assertSafeStageId(id: string, source: string, index: number): void {
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(id)) {
    throw new Error(`Invalid harness definition in ${source}: stage ${index} has invalid id "${id}"`);
  }
}

function parseHarnessDefinition(value: unknown, source: string): HarnessDefinition {
  const definition = asRecord(value, source);

  const harness: HarnessDefinition = {
    id: readString(definition, 'id', source),
    name: readString(definition, 'name', source),
    description: readString(definition, 'description', source),
    version: readString(definition, 'version', source),
    maturity: readMaturity(definition, source),
    stages: readStages(definition, source),
  };

  assertSafeHarnessId(harness.id);

  return harness;
}

function readStages(definition: Record<string, unknown>, source: string): HarnessDefinition['stages'] {
  const stages = definition.stages;
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error(`Invalid harness definition in ${source}: stages must be a non-empty array`);
  }

  const seenStageIds = new Set<string>();

  return stages.map((stage, index) => {
    const record = asRecord(stage, `${source} stage ${index + 1}`);
    const approval = record.approval;

    if (
      approval !== undefined &&
      approval !== 'none' &&
      approval !== 'recommended' &&
      approval !== 'required'
    ) {
      throw new Error(`Invalid harness definition in ${source}: stage ${index + 1} has invalid approval`);
    }

    const id = readString(record, 'id', source);
    assertSafeStageId(id, source, index + 1);

    if (seenStageIds.has(id)) {
      throw new Error(`Invalid harness definition in ${source}: duplicate stage id "${id}"`);
    }
    seenStageIds.add(id);

    return {
      id,
      name: readString(record, 'name', source),
      agent: readOptionalString(record, 'agent', source),
      description: readOptionalString(record, 'description', source),
      inputs: readOptionalStringList(record, 'inputs', source),
      outputs: readOptionalStringList(record, 'outputs', source),
      approval,
    };
  });
}

function readMaturity(definition: Record<string, unknown>, source: string): HarnessDefinition['maturity'] {
  const maturity = readString(definition, 'maturity', source);
  if (
    maturity !== 'prompt' &&
    maturity !== 'local' &&
    maturity !== 'tool-integrated' &&
    maturity !== 'production'
  ) {
    throw new Error(`Invalid harness definition in ${source}: maturity is invalid`);
  }

  return maturity;
}

function readString(record: Record<string, unknown>, field: string, source: string): string {
  const value = record[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid harness definition in ${source}: ${field} must be a non-empty string`);
  }

  return value;
}

function readOptionalString(record: Record<string, unknown>, field: string, source: string): string | undefined {
  const value = record[field];
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid harness definition in ${source}: ${field} must be a non-empty string`);
  }

  return value;
}

function readOptionalStringList(
  record: Record<string, unknown>,
  field: string,
  source: string,
): string[] | undefined {
  const value = record[field];
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string' && entry.trim() !== '')) {
    throw new Error(`Invalid harness definition in ${source}: ${field} must be a string array`);
  }

  return value;
}

function asRecord(value: unknown, source: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid harness definition in ${source}: expected an object`);
  }

  return value as Record<string, unknown>;
}
