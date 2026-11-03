import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatAmendList,
  formatTextDiff,
  loadCommentEntries,
  renderDemoComment,
  selectReleaseAmend,
  type DemoCommentEntry,
} from './demo-comment.ts';
import { MIN_SETTLED_FRAMES } from './demo-fingerprint.ts';

const stableBanner =
  '✅ **Demos are stable** - No changes detected in demo output.';
const changesBanner =
  '⚠️ **Changes detected** - Please review the generated demos to ensure they accurately represent the library.';
const pullNotice =
  'A demo commit was added to this branch. Pull before you push.';

function commentEntry(
  overrides: Partial<DemoCommentEntry> &
    Pick<DemoCommentEntry, 'name' | 'assessment'>,
): DemoCommentEntry {
  return { stylingOnly: false, textDiff: '', ...overrides };
}

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

describe('renderDemoComment', () => {
  it('collapses a SAME demo and shows the head GIF', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'SAME',
        afterUrl: 'https://example.com/basic-demo.gif',
      }),
    ]);

    expect(result.demoList).toContain(
      '<details>\n<summary>📷 demos/basic.gif (SAME)</summary>',
    );
    expect(result.demoList).not.toContain('<details open>');
    expect(result.demoList).toContain(
      '![basic-demo](https://example.com/basic-demo.gif)',
    );
  });

  it('collapses NOISY and UNSTABLE demos and names the verdict', () => {
    const noisy = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'NOISY',
        afterUrl: 'https://example.com/basic-demo.gif',
      }),
    ]);
    const unstable = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'UNSTABLE',
        afterUrl: 'https://example.com/basic-demo.gif',
      }),
    ]);

    expect(noisy.demoList).toContain(
      '<details>\n<summary>📷 demos/basic.gif (NOISY)</summary>',
    );
    expect(noisy.demoList).toContain(
      '![basic-demo](https://example.com/basic-demo.gif)',
    );
    expect(unstable.demoList).toContain(
      '<details>\n<summary>📷 demos/basic.gif (UNSTABLE)</summary>',
    );
    expect(unstable.demoList).toContain(
      '![basic-demo](https://example.com/basic-demo.gif)',
    );
  });

  it('opens a CHANGED demo with the stacked GIF and a collapsed text diff', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'validation',
        assessment: 'CHANGED',
        textDiff: '-old line\n+new line',
        stackedUrl: 'https://example.com/validation-before-after.gif',
      }),
    ]);

    expect(result.demoList).toContain(
      '<details open>\n<summary>🔥 demos/validation.gif (CHANGED)</summary>',
    );
    expect(result.demoList).toContain(
      '![validation-before-after](https://example.com/validation-before-after.gif)',
    );
    expect(result.demoList).toContain('<summary>Text diff</summary>');
    expect(result.demoList).toContain('-old line\n+new line');
    expect(result.demoList).toContain(
      '<details>\n<summary>Text diff</summary>',
    );
  });

  it('opens a styling-only CHANGED demo without a text diff', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'CHANGED',
        stylingOnly: true,
        textDiff: '-should not appear',
        stackedUrl: 'https://example.com/basic-before-after.gif',
      }),
    ]);

    expect(result.demoList).toContain(
      '<details open>\n<summary>🔥 demos/basic.gif (CHANGED, styling only)</summary>',
    );
    expect(result.demoList).not.toContain('Text diff');
    expect(result.demoList).not.toContain('-should not appear');
  });

  it('opens a NEW demo with the after GIF only', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'NEW',
        afterUrl: 'https://example.com/basic-demo.gif',
      }),
    ]);

    expect(result.demoList).toContain(
      '<details open>\n<summary>✨ demos/basic.gif (NEW)</summary>',
    );
    expect(result.demoList).toContain(
      '![basic-demo](https://example.com/basic-demo.gif)',
    );
    expect(result.demoList).not.toContain('before-after');
  });

  it('opens a REMOVED demo with the before GIF', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'REMOVED',
        beforeUrl: 'https://example.com/basic-before.gif',
      }),
    ]);

    expect(result.demoList).toContain(
      '<details open>\n<summary>🗑️ demos/basic.gif (REMOVED)</summary>',
    );
    expect(result.demoList).toContain(
      '![basic-before](https://example.com/basic-before.gif)',
    );
  });

  it('throws when a verdict is still NEED_FRAME_RETRY', () => {
    expect(() =>
      renderDemoComment([
        commentEntry({ name: 'basic', assessment: 'NEED_FRAME_RETRY' }),
      ]),
    ).toThrow(/NEED_FRAME_RETRY/);
  });

  it('throws when CHANGED has no stacked URL or REMOVED has no before URL', () => {
    expect(() =>
      renderDemoComment([
        commentEntry({ name: 'basic', assessment: 'CHANGED' }),
      ]),
    ).toThrow(/stacked/);
    expect(() =>
      renderDemoComment([
        commentEntry({ name: 'basic', assessment: 'REMOVED' }),
      ]),
    ).toThrow(/before/);
  });

  it('leaves pullNotice empty unless a GIF commit was added', () => {
    const entry = commentEntry({
      name: 'basic',
      assessment: 'SAME',
      afterUrl: 'https://example.com/basic-demo.gif',
    });

    expect(renderDemoComment([entry]).pullNotice).toBe('');
    expect(
      renderDemoComment([entry], { gifCommitAdded: false }).pullNotice,
    ).toBe('');
  });

  it('returns the pull sentence when a GIF commit was added', () => {
    expect(renderDemoComment([], { gifCommitAdded: true }).pullNotice).toBe(
      pullNotice,
    );
  });

  it('uses the stable banner when every demo is SAME', () => {
    expect(
      renderDemoComment([
        commentEntry({
          name: 'basic',
          assessment: 'SAME',
          afterUrl: 'https://example.com/basic-demo.gif',
        }),
      ]).statusMessage,
    ).toBe(stableBanner);
  });

  it('uses the changes banner when any demo is CHANGED, NEW, or REMOVED', () => {
    for (const assessment of ['CHANGED', 'NEW', 'REMOVED'] as const) {
      expect(
        renderDemoComment([
          commentEntry({
            name: 'basic',
            assessment,
            stackedUrl: 'https://example.com/basic-before-after.gif',
            afterUrl: 'https://example.com/basic-demo.gif',
            beforeUrl: 'https://example.com/basic-before.gif',
          }),
        ]).statusMessage,
      ).toBe(changesBanner);
    }
  });

  it('names NOISY when that is the only unproven verdict', () => {
    const result = renderDemoComment([
      commentEntry({
        name: 'basic',
        assessment: 'SAME',
        afterUrl: 'https://example.com/basic-demo.gif',
      }),
      commentEntry({
        name: 'validation',
        assessment: 'NOISY',
        afterUrl: 'https://example.com/validation-demo.gif',
      }),
    ]);

    expect(result.statusMessage).toBe(
      '⚠️ **No proven demo change** - These recordings are NOISY.',
    );
    expect(result.statusMessage).not.toContain(stableBanner);
    expect(result.statusMessage).not.toContain(changesBanner);
  });

  it('names UNSTABLE when that is the only unproven verdict', () => {
    expect(
      renderDemoComment([
        commentEntry({
          name: 'basic',
          assessment: 'SAME',
          afterUrl: 'https://example.com/basic-demo.gif',
        }),
        commentEntry({
          name: 'validation',
          assessment: 'UNSTABLE',
          afterUrl: 'https://example.com/validation-demo.gif',
        }),
      ]).statusMessage,
    ).toBe('⚠️ **No proven demo change** - These recordings are UNSTABLE.');
  });

  it('names NOISY and UNSTABLE when both are present and nothing changed', () => {
    expect(
      renderDemoComment([
        commentEntry({
          name: 'basic',
          assessment: 'SAME',
          afterUrl: 'https://example.com/basic-demo.gif',
        }),
        commentEntry({
          name: 'custom-theme',
          assessment: 'NOISY',
          afterUrl: 'https://example.com/custom-theme-demo.gif',
        }),
        commentEntry({
          name: 'validation',
          assessment: 'UNSTABLE',
          afterUrl: 'https://example.com/validation-demo.gif',
        }),
      ]).statusMessage,
    ).toBe(
      '⚠️ **No proven demo change** - These recordings are NOISY and UNSTABLE.',
    );
  });

  it('uses the stable banner and an empty-list sentence when there are no demos', () => {
    const result = renderDemoComment([]);

    expect(result.statusMessage).toBe(stableBanner);
    expect(result.demoList).toBe('No demo images available.');
  });
});

describe('selectReleaseAmend', () => {
  it('stages CHANGED and NEW, removes REMOVED, and ignores the other verdicts', () => {
    const selection = selectReleaseAmend([
      { name: 'quiet', assessment: 'SAME' },
      { name: 'basic', assessment: 'CHANGED' },
      { name: 'retry', assessment: 'NEED_FRAME_RETRY' },
      { name: 'gone', assessment: 'REMOVED' },
      { name: 'added', assessment: 'NEW' },
      { name: 'noisy', assessment: 'NOISY' },
      { name: 'unstable', assessment: 'UNSTABLE' },
    ]);

    expect(selection.stage).toEqual([
      'docs/img/added-demo.gif',
      'docs/img/basic-demo.gif',
    ]);
    expect(selection.remove).toEqual(['docs/img/gone-demo.gif']);
    expect([...selection.stage, ...selection.remove].join('\n')).not.toMatch(
      /before/,
    );
  });

  it('throws when a demo name is not a single safe path segment', () => {
    expect(() =>
      selectReleaseAmend([{ name: '../basic', assessment: 'CHANGED' }]),
    ).toThrow(/demo name/);
  });
});

function scratchFixture(): {
  scratchRoot: string;
  baseTapes: string;
  headTapes: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'comment-scratch-'));
  const baseTapes = join(root, 'base-tapes');
  const headTapes = join(root, 'head-tapes');
  mkdirSync(baseTapes);
  mkdirSync(headTapes);
  return { scratchRoot: join(root, 'scratch'), baseTapes, headTapes };
}

function writeTape(dir: string, name: string): void {
  writeFileSync(join(dir, `${name}.tape`), 'Hide\n');
}

function writeRecording(
  scratchRoot: string,
  attempt: number,
  sideName: 'base' | 'head',
  demo: string,
  text: string,
  frameByte: number,
): void {
  const demoDir = join(scratchRoot, `attempt-${attempt}`, sideName, demo);
  const framesDir = join(demoDir, 'frames');
  mkdirSync(framesDir, { recursive: true });
  writeFileSync(join(demoDir, 'record.txt'), text);
  for (let index = 0; index < MIN_SETTLED_FRAMES; index += 1) {
    writeFileSync(
      join(framesDir, `frame-text-${String(index).padStart(5, '0')}.png`),
      Buffer.from([frameByte]),
    );
  }
}

describe('loadCommentEntries', () => {
  it('marks a repeated frame mismatch styling-only and ignores URL keys that are not tapes', () => {
    const tree = scratchFixture();
    writeTape(tree.baseTapes, 'basic');
    writeTape(tree.headTapes, 'basic');
    writeRecording(tree.scratchRoot, 0, 'base', 'basic', 'Search:\n', 1);
    writeRecording(tree.scratchRoot, 0, 'head', 'basic', 'Search:\n', 2);
    writeRecording(tree.scratchRoot, 1, 'base', 'basic', 'Search:\n', 1);
    writeRecording(tree.scratchRoot, 1, 'head', 'basic', 'Search:\n', 2);

    const entries = loadCommentEntries({
      scratchRoot: tree.scratchRoot,
      baseTapesDir: tree.baseTapes,
      headTapesDir: tree.headTapes,
      imageUrls: {
        basic: 'https://example.com/basic-demo.gif',
        'basic-before-after': 'https://example.com/basic-before-after.gif',
        other: 'https://example.com/other-demo.gif',
      },
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: 'basic',
      assessment: 'CHANGED',
      stylingOnly: true,
      textDiff: '',
      stackedUrl: 'https://example.com/basic-before-after.gif',
    });
  });

  it('throws when a text CHANGED demo has no stacked URL', () => {
    const tree = scratchFixture();
    writeTape(tree.baseTapes, 'validation');
    writeTape(tree.headTapes, 'validation');
    writeRecording(
      tree.scratchRoot,
      0,
      'base',
      'validation',
      '> Please select at least 2 team members\n',
      1,
    );
    writeRecording(
      tree.scratchRoot,
      0,
      'head',
      'validation',
      '! Please select at least 2 team members\n',
      1,
    );

    expect(() =>
      loadCommentEntries({
        scratchRoot: tree.scratchRoot,
        baseTapesDir: tree.baseTapes,
        headTapesDir: tree.headTapes,
        imageUrls: {
          validation: 'https://example.com/validation-demo.gif',
        },
      }),
    ).toThrow(/stacked/);
  });
});

describe('formatAmendList', () => {
  it('prints one stage or remove line per path in stable order', () => {
    expect(
      formatAmendList({
        stage: ['docs/img/basic-demo.gif', 'docs/img/added-demo.gif'],
        remove: ['docs/img/gone-demo.gif'],
      }),
    ).toBe(
      [
        'stage docs/img/added-demo.gif',
        'stage docs/img/basic-demo.gif',
        'remove docs/img/gone-demo.gif',
      ].join('\n'),
    );
  });
});
