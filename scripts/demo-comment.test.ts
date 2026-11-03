import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fillCommentTemplate,
  formatAmendList,
  formatTextDiff,
  loadCommentEntries,
  parseCommentArgs,
  parseDemoImageList,
  runCommentCli,
  planDocsImgCopies,
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
    expect(result.demoList).toContain(
      '<details>\n<summary>Text diff</summary>\n\n```diff\n-old line\n+new line\n```\n</details>',
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

describe('parseDemoImageList', () => {
  it('returns an empty map for an empty string and splits pairs on the first colon', () => {
    expect(parseDemoImageList('')).toEqual({});
    expect(parseDemoImageList('   ')).toEqual({});
    expect(
      parseDemoImageList(
        'basic:https://example.com/basic-demo.gif other:https://example.com/other-demo.gif',
      ),
    ).toEqual({
      basic: 'https://example.com/basic-demo.gif',
      other: 'https://example.com/other-demo.gif',
    });
  });

  it('throws on the upload-failure sentinel, a non-https URL, and an unsafe name', () => {
    expect(() => parseDemoImageList('❌ Failed to upload demo images')).toThrow(
      /upload/,
    );
    expect(() =>
      parseDemoImageList('basic:http://example.com/basic-demo.gif'),
    ).toThrow(/https/);
    expect(() =>
      parseDemoImageList('../basic:https://example.com/basic-demo.gif'),
    ).toThrow(/demo name/);
  });
});

describe('fillCommentTemplate', () => {
  const tokens = {
    CHANGE_STATUS_MESSAGE: 'status',
    DEMO_LIST: 'price $& and group $1',
    PULL_NOTICE: '',
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_SHA: 'abc',
    USER_COMMIT_SHA: 'def',
  };

  it('replaces known tokens and leaves $& and $1 literal', () => {
    const filled = fillCommentTemplate(
      [
        '${CHANGE_STATUS_MESSAGE}',
        '${DEMO_LIST}',
        '${PULL_NOTICE}',
        '${GITHUB_REPOSITORY}',
        '${GITHUB_SHA}',
        '${USER_COMMIT_SHA}',
        '${NOT_A_TOKEN}',
      ].join('\n'),
      tokens,
    );

    expect(filled).toContain('price $& and group $1');
    expect(filled).toContain('owner/repo');
    expect(filled).toContain('abc');
    expect(filled).toContain('def');
    expect(filled).toContain('status');
    expect(filled).not.toContain('${DEMO_LIST}');
    expect(filled).toContain('${NOT_A_TOKEN}');
  });

  it('throws when a known token is missing from the template', () => {
    expect(() => fillCommentTemplate('${DEMO_LIST}', tokens)).toThrow(
      /CHANGE_STATUS_MESSAGE/,
    );
  });
});

describe('planDocsImgCopies', () => {
  it('maps a live demo to the attempt-0 head GIF and a removed demo to the before GIF', () => {
    const copies = planDocsImgCopies({
      scratchRoot: '/scratch',
      entries: [
        { name: 'gone', assessment: 'REMOVED' },
        { name: 'basic', assessment: 'CHANGED' },
      ],
    });

    expect(copies).toEqual([
      {
        from: join('/scratch', 'attempt-0', 'head', 'basic', 'basic-demo.gif'),
        to: 'docs/img/basic-demo.gif',
      },
      {
        from: join('/scratch', 'attempt-0', 'base', 'gone', 'gone-demo.gif'),
        to: 'docs/img/gone-before-demo.gif',
      },
    ]);
    expect(JSON.stringify(copies)).not.toContain('attempt-1');
    expect(JSON.stringify(copies)).not.toContain('docs/img/gone-demo.gif');
  });

  it('throws when a demo name is not a single safe path segment', () => {
    expect(() =>
      planDocsImgCopies({
        scratchRoot: '/scratch',
        entries: [{ name: 'has.dot', assessment: 'NEW' }],
      }),
    ).toThrow(/demo name/);
  });
});

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

const commentTemplate = [
  '${CHANGE_STATUS_MESSAGE}',
  '${DEMO_LIST}',
  '${PULL_NOTICE}',
  '${GITHUB_REPOSITORY}',
  '${GITHUB_SHA}',
  '${USER_COMMIT_SHA}',
].join('\n');

function writeCommentTemplate(): string {
  const dir = mkdtempSync(join(tmpdir(), 'comment-template-'));
  const path = join(dir, 'comment.md');
  writeFileSync(path, commentTemplate);
  return path;
}

function capturedIo(): {
  io: {
    stdout: { write: (chunk: string) => void };
    stderr: { write: (chunk: string) => void };
  };
  out: () => string;
  err: () => string;
} {
  let stdout = '';
  let stderr = '';
  return {
    io: {
      stdout: {
        write(chunk: string) {
          stdout += chunk;
        },
      },
      stderr: {
        write(chunk: string) {
          stderr += chunk;
        },
      },
    },
    out: () => stdout,
    err: () => stderr,
  };
}

function sameScratch(): {
  scratchRoot: string;
  baseTapes: string;
  headTapes: string;
} {
  const tree = scratchFixture();
  writeTape(tree.baseTapes, 'basic');
  writeTape(tree.headTapes, 'basic');
  writeRecording(tree.scratchRoot, 0, 'base', 'basic', 'Search:\n', 1);
  writeRecording(tree.scratchRoot, 0, 'head', 'basic', 'Search:\n', 1);
  return tree;
}

describe('parseCommentArgs', () => {
  const scratch = [
    '--scratch',
    '/scratch',
    '--base-tapes',
    '/base',
    '--head-tapes',
    '/head',
  ];

  it('requires every comment flag and sets gif-commit-added', () => {
    expect(() => parseCommentArgs(['comment', ...scratch])).toThrow(/--images/);
    expect(
      parseCommentArgs([
        'comment',
        ...scratch,
        '--images',
        'basic:https://example.com/basic-demo.gif',
        '--template',
        '/template',
        '--repository',
        'owner/repo',
        '--github-sha',
        'abc',
        '--user-commit-sha',
        'def',
      ]),
    ).toMatchObject({ mode: 'comment', gifCommitAdded: false });
    expect(
      parseCommentArgs([
        'comment',
        ...scratch,
        '--images',
        'basic:https://example.com/basic-demo.gif',
        '--template',
        '/template',
        '--repository',
        'owner/repo',
        '--github-sha',
        'abc',
        '--user-commit-sha',
        'def',
        '--gif-commit-added',
      ]),
    ).toMatchObject({ mode: 'comment', gifCommitAdded: true });
  });

  it('throws on an unknown flag and accepts copies or amend with the scratch flags', () => {
    expect(() => parseCommentArgs(['copies', ...scratch, '--nope'])).toThrow(
      /unknown flag/,
    );
    expect(parseCommentArgs(['copies', ...scratch])).toMatchObject({
      mode: 'copies',
      scratchRoot: '/scratch',
    });
    expect(parseCommentArgs(['amend', ...scratch])).toMatchObject({
      mode: 'amend',
    });
  });
});

describe('runCommentCli', () => {
  it('writes the upload-failure sentence and no demo blocks when the image list is the sentinel', () => {
    const tree = sameScratch();
    const captured = capturedIo();
    const code = runCommentCli(
      [
        'comment',
        '--scratch',
        tree.scratchRoot,
        '--base-tapes',
        tree.baseTapes,
        '--head-tapes',
        tree.headTapes,
        '--images',
        '❌ Failed to upload demo images',
        '--template',
        writeCommentTemplate(),
        '--repository',
        'owner/repo',
        '--github-sha',
        'abc',
        '--user-commit-sha',
        'def',
      ],
      captured.io,
    );

    expect(code).toBe(0);
    expect(captured.out()).toContain(
      '❌ Failed to upload demo images for preview.',
    );
    expect(captured.out()).not.toContain('<details');
  });

  it('keeps a $& text diff in a CHANGED comment', () => {
    const tree = scratchFixture();
    writeTape(tree.baseTapes, 'validation');
    writeTape(tree.headTapes, 'validation');
    writeRecording(tree.scratchRoot, 0, 'base', 'validation', 'Search:\n', 1);
    writeRecording(
      tree.scratchRoot,
      0,
      'head',
      'validation',
      'Search:\nprice $&\n',
      1,
    );
    const captured = capturedIo();
    const code = runCommentCli(
      [
        'comment',
        '--scratch',
        tree.scratchRoot,
        '--base-tapes',
        tree.baseTapes,
        '--head-tapes',
        tree.headTapes,
        '--images',
        'validation:https://example.com/validation-demo.gif validation-before-after:https://example.com/validation-before-after.gif',
        '--template',
        writeCommentTemplate(),
        '--repository',
        'owner/repo',
        '--github-sha',
        'abc',
        '--user-commit-sha',
        'def',
      ],
      captured.io,
    );

    expect(code).toBe(0);
    expect(captured.out()).toContain('$&');
    expect(captured.out()).toContain('🔥 demos/validation.gif (CHANGED)');
  });

  it('prints the attempt-0 head path for copies and not attempt 1', () => {
    const tree = sameScratch();
    const captured = capturedIo();
    const code = runCommentCli(
      [
        'copies',
        '--scratch',
        tree.scratchRoot,
        '--base-tapes',
        tree.baseTapes,
        '--head-tapes',
        tree.headTapes,
      ],
      captured.io,
    );

    expect(code).toBe(0);
    expect(captured.out()).toContain(
      join('attempt-0', 'head', 'basic', 'basic-demo.gif'),
    );
    expect(captured.out()).not.toContain('attempt-1');
  });

  it('prints a stage line for a CHANGED demo in amend mode', () => {
    const tree = scratchFixture();
    writeTape(tree.baseTapes, 'basic');
    writeTape(tree.headTapes, 'basic');
    writeRecording(tree.scratchRoot, 0, 'base', 'basic', 'Search:\nold\n', 1);
    writeRecording(tree.scratchRoot, 0, 'head', 'basic', 'Search:\nnew\n', 1);
    const captured = capturedIo();
    const code = runCommentCli(
      [
        'amend',
        '--scratch',
        tree.scratchRoot,
        '--base-tapes',
        tree.baseTapes,
        '--head-tapes',
        tree.headTapes,
      ],
      captured.io,
    );

    expect(code).toBe(0);
    expect(captured.out()).toContain('stage docs/img/basic-demo.gif');
  });

  it('exits 1 and writes stderr for an unknown flag or a bad image URL', () => {
    const unknown = capturedIo();
    expect(
      runCommentCli(
        ['copies', '--scratch', '/scratch', '--nope', 'x'],
        unknown.io,
      ),
    ).toBe(1);
    expect(unknown.err()).toMatch(/unknown flag/);

    const tree = sameScratch();
    const badUrl = capturedIo();
    expect(
      runCommentCli(
        [
          'comment',
          '--scratch',
          tree.scratchRoot,
          '--base-tapes',
          tree.baseTapes,
          '--head-tapes',
          tree.headTapes,
          '--images',
          'basic:http://example.com/basic-demo.gif',
          '--template',
          writeCommentTemplate(),
          '--repository',
          'owner/repo',
          '--github-sha',
          'abc',
          '--user-commit-sha',
          'def',
        ],
        badUrl.io,
      ),
    ).toBe(1);
    expect(badUrl.err().length).toBeGreaterThan(0);
  });
});
