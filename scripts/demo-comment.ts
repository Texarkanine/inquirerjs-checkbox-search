import { join } from 'node:path';
import {
  assertSafeDemoName,
  attemptsForDemo,
  describeVerdict,
  tapeNames,
  type Assessment,
} from './demo-fingerprint.ts';

/**
 * One demo block in the pull-request comment.
 *
 * `afterUrl` is the head GIF. `beforeUrl` is the base GIF for a removed
 * tape. `stackedUrl` is the before/after stack for a changed tape.
 * `textDiff` is empty when the text records match.
 */
export interface DemoCommentEntry {
  name: string;
  assessment: Assessment;
  stylingOnly: boolean;
  textDiff: string;
  afterUrl?: string;
  beforeUrl?: string;
  stackedUrl?: string;
}

/**
 * Render the comment banner, the per-demo blocks, and the pull notice.
 *
 * SAME, NOISY, and UNSTABLE are collapsed and name their verdict.
 * CHANGED, NEW, and REMOVED are open. `pullNotice` is the pull sentence
 * only when `gifCommitAdded` is true.
 */
const STABLE_BANNER =
  '✅ **Demos are stable** - No changes detected in demo output.';
const CHANGES_BANNER =
  '⚠️ **Changes detected** - Please review the generated demos to ensure they accurately represent the library.';
const PULL_NOTICE =
  'A demo commit was added to this branch. Pull before you push.';

function requiredUrl(url: string | undefined, label: string): string {
  if (url === undefined || url.length === 0) {
    throw new Error(`missing ${label}`);
  }
  return url;
}

function detailsBlock(open: boolean, summary: string, body: string): string {
  const tag = open ? '<details open>' : '<details>';
  return `${tag}\n<summary>${summary}</summary>\n\n${body}\n</details>`;
}

function commentStatus(entries: readonly DemoCommentEntry[]): string {
  const proven = entries.some(
    (entry) =>
      entry.assessment === 'CHANGED' ||
      entry.assessment === 'NEW' ||
      entry.assessment === 'REMOVED',
  );
  if (proven) {
    return CHANGES_BANNER;
  }
  const noisy = entries.some((entry) => entry.assessment === 'NOISY');
  const unstable = entries.some((entry) => entry.assessment === 'UNSTABLE');
  if (noisy && unstable) {
    return '⚠️ **No proven demo change** - These recordings are NOISY and UNSTABLE.';
  }
  if (noisy) {
    return '⚠️ **No proven demo change** - These recordings are NOISY.';
  }
  if (unstable) {
    return '⚠️ **No proven demo change** - These recordings are UNSTABLE.';
  }
  return STABLE_BANNER;
}

function renderDemoBlock(entry: DemoCommentEntry): string {
  switch (entry.assessment) {
    case 'NEED_FRAME_RETRY':
      throw new Error('NEED_FRAME_RETRY is not a comment verdict');
    case 'SAME':
    case 'NOISY':
    case 'UNSTABLE':
      return detailsBlock(
        false,
        `📷 demos/${entry.name}.gif (${entry.assessment})`,
        `![${entry.name}-demo](${requiredUrl(entry.afterUrl, 'after URL')})`,
      );
    case 'NEW':
      return detailsBlock(
        true,
        `✨ demos/${entry.name}.gif (NEW)`,
        `![${entry.name}-demo](${requiredUrl(entry.afterUrl, 'after URL')})`,
      );
    case 'REMOVED':
      return detailsBlock(
        true,
        `🗑️ demos/${entry.name}.gif (REMOVED)`,
        `![${entry.name}-before](${requiredUrl(entry.beforeUrl, 'before URL')})`,
      );
    case 'CHANGED': {
      const summary = entry.stylingOnly
        ? `🔥 demos/${entry.name}.gif (CHANGED, styling only)`
        : `🔥 demos/${entry.name}.gif (CHANGED)`;
      const image = `![${entry.name}-before-after](${requiredUrl(entry.stackedUrl, 'stacked URL')})`;
      const diff =
        !entry.stylingOnly && entry.textDiff.length > 0
          ? `\n\n${detailsBlock(false, 'Text diff', entry.textDiff)}`
          : '';
      return detailsBlock(true, summary, `${image}${diff}`);
    }
    default: {
      const unexpected: never = entry.assessment;
      throw new Error(`unexpected verdict ${unexpected}`);
    }
  }
}

export function renderDemoComment(
  entries: readonly DemoCommentEntry[],
  options?: { gifCommitAdded?: boolean },
): { statusMessage: string; demoList: string; pullNotice: string } {
  if (entries.some((entry) => entry.assessment === 'NEED_FRAME_RETRY')) {
    throw new Error('NEED_FRAME_RETRY is not a comment verdict');
  }
  return {
    statusMessage: commentStatus(entries),
    demoList:
      entries.length === 0
        ? 'No demo images available.'
        : entries.map((entry) => renderDemoBlock(entry)).join('\n'),
    pullNotice: options?.gifCommitAdded === true ? PULL_NOTICE : '',
  };
}

function demoGifPath(name: string): string {
  assertSafeDemoName(name);
  return `docs/img/${name}-demo.gif`;
}

/**
 * Paths a release amend may change. Preview GIFs are never included.
 *
 * CHANGED and NEW are staged. REMOVED is removed. SAME, NOISY, UNSTABLE,
 * and NEED_FRAME_RETRY are left untouched. Names are sorted.
 */
export function selectReleaseAmend(
  entries: readonly { name: string; assessment: Assessment }[],
): { stage: string[]; remove: string[] } {
  const stage: string[] = [];
  const remove: string[] = [];
  const sorted = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  for (const entry of sorted) {
    const path = demoGifPath(entry.name);
    if (entry.assessment === 'CHANGED' || entry.assessment === 'NEW') {
      stage.push(path);
    } else if (entry.assessment === 'REMOVED') {
      remove.push(path);
    }
  }
  return { stage, remove };
}

/**
 * One `stage <path>` or `remove <path>` line per amend path.
 */
export function formatAmendList(selection: {
  stage: string[];
  remove: string[];
}): string {
  const stageLines = [...selection.stage].sort().map((path) => `stage ${path}`);
  const removeLines = [...selection.remove]
    .sort()
    .map((path) => `remove ${path}`);
  return [...stageLines, ...removeLines].join('\n');
}

/**
 * Parse the upload script's `name:url` pairs.
 *
 * Splits each pair on the first colon. An empty string is no images.
 * The upload-failure sentinel throws. A name must be one safe path
 * segment, and a URL must be `https://` and end in `.gif`.
 */
const UPLOAD_FAILURE = '❌ Failed to upload demo images';
const GIF_URL = /^https:\/\/.*\.gif$/;

export function parseDemoImageList(raw: string): Record<string, string> {
  if (raw.includes(UPLOAD_FAILURE)) {
    throw new Error(`upload failed: ${UPLOAD_FAILURE}`);
  }
  const images: Record<string, string> = {};
  for (const token of raw.split(/\s+/)) {
    if (token.length === 0) {
      continue;
    }
    const colon = token.indexOf(':');
    if (colon <= 0) {
      throw new Error(`image pair is missing a name: ${token}`);
    }
    const name = token.slice(0, colon);
    const url = token.slice(colon + 1);
    assertSafeDemoName(name);
    if (!GIF_URL.test(url)) {
      throw new Error(`URL must be https and end in .gif: ${url}`);
    }
    images[name] = url;
  }
  return images;
}

/**
 * Replace the known comment tokens.
 *
 * The replacement is a function, so `$` in a value stays literal.
 * A template that omits a known token throws. Any other `${...}` token
 * is left unchanged.
 */
const COMMENT_TOKENS = [
  'CHANGE_STATUS_MESSAGE',
  'DEMO_LIST',
  'PULL_NOTICE',
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'USER_COMMIT_SHA',
] as const;

export function fillCommentTemplate(
  template: string,
  tokens: {
    CHANGE_STATUS_MESSAGE: string;
    DEMO_LIST: string;
    PULL_NOTICE: string;
    GITHUB_REPOSITORY: string;
    GITHUB_SHA: string;
    USER_COMMIT_SHA: string;
  },
): string {
  for (const name of COMMENT_TOKENS) {
    if (!template.includes(`\${${name}}`)) {
      throw new Error(`missing token ${name}`);
    }
  }
  return template.replace(/\$\{([A-Za-z0-9_]+)\}/g, (match, name: string) => {
    if (Object.hasOwn(tokens, name)) {
      return tokens[name as keyof typeof tokens];
    }
    return match;
  });
}

/**
 * Attempt-0 GIF paths to copy into `docs/img/` for upload.
 *
 * A demo that still exists is the head recording. A removed demo is the
 * base recording, under the before name. Attempt 1 is never a source.
 * This does not copy files or read the scratch tree.
 */
export function planDocsImgCopies(options: {
  scratchRoot: string;
  entries: readonly { name: string; assessment: Assessment }[];
}): { from: string; to: string }[] {
  const copies = options.entries.map((entry) => {
    assertSafeDemoName(entry.name);
    if (entry.assessment === 'REMOVED') {
      return {
        from: join(
          options.scratchRoot,
          'attempt-0',
          'base',
          entry.name,
          `${entry.name}-demo.gif`,
        ),
        to: `docs/img/${entry.name}-before-demo.gif`,
      };
    }
    return {
      from: join(
        options.scratchRoot,
        'attempt-0',
        'head',
        entry.name,
        `${entry.name}-demo.gif`,
      ),
      to: `docs/img/${entry.name}-demo.gif`,
    };
  });
  return copies.sort((left, right) => left.to.localeCompare(right.to));
}

/**
 * Build comment entries from a scratch recording and an upload URL map.
 *
 * Demo names come from the tapes. URL keys that are not tape names do
 * not become demos. A CHANGED demo without its stacked URL throws.
 */
export function loadCommentEntries(options: {
  scratchRoot: string;
  baseTapesDir: string;
  headTapesDir: string;
  imageUrls: Readonly<Record<string, string>>;
}): DemoCommentEntry[] {
  const baseNames = tapeNames(options.baseTapesDir);
  const headNames = tapeNames(options.headTapesDir);
  for (const name of [...baseNames, ...headNames]) {
    assertSafeDemoName(name);
  }
  const names = [...new Set([...baseNames, ...headNames])].sort((left, right) =>
    left.localeCompare(right),
  );
  return names.map((name) => {
    const baseTape = baseNames.includes(name);
    const headTape = headNames.includes(name);
    const attempts = attemptsForDemo(
      options.scratchRoot,
      name,
      baseTape,
      headTape,
    );
    const verdict = describeVerdict({
      baseTapeExists: baseTape,
      headTapeExists: headTape,
      attempts,
    });
    const baseText = attempts[0]?.base?.text;
    const headText = attempts[0]?.head?.text;
    const textDiff =
      verdict.assessment === 'CHANGED' &&
      !verdict.stylingOnly &&
      baseText !== undefined &&
      headText !== undefined
        ? formatTextDiff(baseText, headText)
        : '';
    const stackedUrl = options.imageUrls[`${name}-before-after`];
    const beforeUrl = options.imageUrls[`${name}-before`];
    if (
      verdict.assessment === 'CHANGED' &&
      (stackedUrl === undefined || stackedUrl.length === 0)
    ) {
      throw new Error(`missing stacked URL for ${name}`);
    }
    if (
      verdict.assessment === 'REMOVED' &&
      (beforeUrl === undefined || beforeUrl.length === 0)
    ) {
      throw new Error(`missing before URL for ${name}`);
    }
    return {
      name,
      assessment: verdict.assessment,
      stylingOnly: verdict.stylingOnly,
      textDiff,
      afterUrl: options.imageUrls[name],
      beforeUrl,
      stackedUrl,
    };
  });
}

/**
 * Line diff of two normalized VHS text records.
 *
 * Equal records return an empty string. A changed line is prefixed with
 * `-` on the base side and `+` on the head side. An unchanged line is
 * not listed as both.
 */
export function formatTextDiff(baseText: string, headText: string): string {
  if (baseText === headText) {
    return '';
  }
  const baseLines = baseText.split('\n');
  const headLines = headText.split('\n');
  const baseCount = baseLines.length;
  const headCount = headLines.length;
  const lcs: number[][] = Array.from({ length: baseCount + 1 }, () =>
    Array<number>(headCount + 1).fill(0),
  );
  for (let baseIndex = baseCount - 1; baseIndex >= 0; baseIndex -= 1) {
    for (let headIndex = headCount - 1; headIndex >= 0; headIndex -= 1) {
      lcs[baseIndex][headIndex] =
        baseLines[baseIndex] === headLines[headIndex]
          ? lcs[baseIndex + 1][headIndex + 1] + 1
          : Math.max(
              lcs[baseIndex + 1][headIndex],
              lcs[baseIndex][headIndex + 1],
            );
    }
  }

  const lines: string[] = [];
  let baseIndex = 0;
  let headIndex = 0;
  while (baseIndex < baseCount && headIndex < headCount) {
    if (baseLines[baseIndex] === headLines[headIndex]) {
      lines.push(` ${baseLines[baseIndex]}`);
      baseIndex += 1;
      headIndex += 1;
    } else if (lcs[baseIndex + 1][headIndex] >= lcs[baseIndex][headIndex + 1]) {
      lines.push(`-${baseLines[baseIndex]}`);
      baseIndex += 1;
    } else {
      lines.push(`+${headLines[headIndex]}`);
      headIndex += 1;
    }
  }
  while (baseIndex < baseCount) {
    lines.push(`-${baseLines[baseIndex]}`);
    baseIndex += 1;
  }
  while (headIndex < headCount) {
    lines.push(`+${headLines[headIndex]}`);
    headIndex += 1;
  }
  return lines.join('\n');
}
