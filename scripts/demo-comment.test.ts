import { describe, expect, it } from 'vitest';
import { formatTextDiff } from './demo-comment.ts';

const validationBase = [
  ' Search:',
  '> Please select at least 2 team members',
  ' ❯ ◯ Alice Johnson',
].join('\n');

const validationHead = [
  ' Search:',
  '! Please select at least 2 team members',
  ' ❯ ◯ Alice Johnson',
].join('\n');

describe('formatTextDiff', () => {
  it('returns an empty string when the two records are equal', () => {
    expect(formatTextDiff(validationBase, validationBase)).toBe('');
    expect(formatTextDiff('', '')).toBe('');
  });

  it('prefixes the one-character validation change and does not list Search: as both an add and a remove', () => {
    const diff = formatTextDiff(validationBase, validationHead);

    expect(diff).toContain('-> Please select at least 2 team members');
    expect(diff).toContain('+! Please select at least 2 team members');
    const lines = diff.split('\n');
    expect(
      lines.some((line) => line.startsWith('-') && line.includes('Search:')),
    ).toBe(false);
    expect(
      lines.some((line) => line.startsWith('+') && line.includes('Search:')),
    ).toBe(false);
  });
});
