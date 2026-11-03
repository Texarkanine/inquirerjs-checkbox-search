import type { Assessment } from './demo-fingerprint.ts';

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
