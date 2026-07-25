#!/usr/bin/env node
/**
 * Write line/branch coverage and mutation score into GitHub Actions step summary.
 * Advisory only — never exits non-zero based on metric values.
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function pct(n) {
  if (n == null || Number.isNaN(n)) return 'n/a';
  return `${Number(n).toFixed(2)}%`;
}

const coverage = readJson('coverage/coverage-summary.json');
const mutationPaths = [
  'reports/mutation/mutation.json',
  'reports/mutation/mutation-report.json',
  'reports/stryker-incremental.json',
];
let mutation = null;
for (const p of mutationPaths) {
  mutation = readJson(p);
  if (mutation?.files) break;
  mutation = null;
}

const lines = [];
lines.push('## Quality metrics (advisory — no thresholds)');
lines.push('');

if (coverage?.total) {
  const t = coverage.total;
  lines.push('### Line / branch coverage (Vitest)');
  lines.push('');
  lines.push('| Metric | Coverage |');
  lines.push('| --- | ---: |');
  lines.push(`| Lines | ${pct(t.lines?.pct)} |`);
  lines.push(`| Branches | ${pct(t.branches?.pct)} |`);
  lines.push(`| Statements | ${pct(t.statements?.pct)} |`);
  lines.push(`| Functions | ${pct(t.functions?.pct)} |`);
  lines.push('');
} else {
  lines.push(
    '_Coverage summary not found (`coverage/coverage-summary.json`)._',
  );
  lines.push('');
}

if (mutation) {
  // mutation-testing-report-schema / Stryker json shapes vary slightly
  const files = mutation.files || {};
  let killed = 0;
  let survived = 0;
  let noCoverage = 0;
  let timeout = 0;
  let total = 0;
  for (const file of Object.values(files)) {
    for (const m of file.mutants || []) {
      total += 1;
      switch (m.status) {
        case 'Killed':
          killed += 1;
          break;
        case 'Survived':
          survived += 1;
          break;
        case 'NoCoverage':
          noCoverage += 1;
          break;
        case 'Timeout':
          timeout += 1;
          break;
        default:
          break;
      }
    }
  }
  const score = total ? (100 * (killed + timeout)) / total : null;
  const covered = total - noCoverage;
  const coveredScore = covered ? (100 * (killed + timeout)) / covered : null;

  lines.push('### Mutation score (StrykerJS)');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | ---: |');
  lines.push(`| Score (total) | ${pct(score)} |`);
  lines.push(`| Score (covered) | ${pct(coveredScore)} |`);
  lines.push(`| Killed | ${killed} |`);
  lines.push(`| Survived | ${survived} |`);
  lines.push(`| No coverage | ${noCoverage} |`);
  lines.push(`| Timeout | ${timeout} |`);
  lines.push(`| Total mutants | ${total} |`);
  lines.push('');
} else {
  lines.push('_Mutation report not found under `reports/mutation/`._');
  lines.push('');
}

lines.push(
  '_This job reports metrics only. Existing `test` job still enforces Vitest coverage floors and quality checks._',
);

const body = `${lines.join('\n')}\n`;
process.stdout.write(body);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, body);
}
