import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  assertDemoTapeName,
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

function diffFence(text: string): string {
  const longestRun = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  return `${fence}diff\n${text}\n${fence}`;
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
          ? `\n\n${detailsBlock(false, 'Text diff', diffFence(entry.textDiff))}`
          : '';
      return detailsBlock(true, summary, `${image}${diff}`);
    }
    default: {
      const unexpected: never = entry.assessment;
      throw new Error(`unexpected verdict ${unexpected}`);
    }
  }
}

/**
 * Render the comment banner, the per-demo blocks, and the pull notice.
 *
 * SAME, NOISY, and UNSTABLE are collapsed and name their verdict.
 * CHANGED, NEW, and REMOVED are open. A text diff is a fenced `diff`
 * block. `pullNotice` is the pull sentence only when `gifCommitAdded`
 * is true.
 */
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
  assertDemoTapeName(name);
  return `docs/img/${name}-demo.gif`;
}

/**
 * Paths a release amend may change. Preview GIFs are never included.
 *
 * CHANGED, NEW, NOISY, and UNSTABLE are staged. REMOVED is removed.
 * SAME and NEED_FRAME_RETRY are left untouched. Names are sorted.
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
    if (
      entry.assessment === 'CHANGED' ||
      entry.assessment === 'NEW' ||
      entry.assessment === 'NOISY' ||
      entry.assessment === 'UNSTABLE'
    ) {
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
/**
 * Drop commit paths that would not change `HEAD`.
 *
 * A remove with no head file is dropped. A stage whose bytes match the
 * attempt-0 head GIF is dropped. Every other listed path is kept. A
 * stage whose scratch GIF is missing throws.
 */
export function commitPathsAgainstHead(options: {
  selection: { stage: string[]; remove: string[] };
  headDocsImg: string;
  scratchRoot: string;
}): { stage: string[]; remove: string[] } {
  const stage: string[] = [];
  const remove: string[] = [];
  for (const path of options.selection.remove) {
    const name = demoNameFromGifPath(path);
    if (existsSync(join(options.headDocsImg, `${name}-demo.gif`))) {
      remove.push(path);
    }
  }
  for (const path of options.selection.stage) {
    const name = demoNameFromGifPath(path);
    const scratchPath = join(
      options.scratchRoot,
      'attempt-0',
      'head',
      name,
      `${name}-demo.gif`,
    );
    if (!existsSync(scratchPath)) {
      throw new Error(`missing scratch GIF for ${name}`);
    }
    const headPath = join(options.headDocsImg, `${name}-demo.gif`);
    if (
      !existsSync(headPath) ||
      !readFileSync(headPath).equals(readFileSync(scratchPath))
    ) {
      stage.push(path);
    }
  }
  return { stage, remove };
}

function demoNameFromGifPath(path: string): string {
  const prefix = 'docs/img/';
  const suffix = '-demo.gif';
  if (!path.startsWith(prefix) || !path.endsWith(suffix)) {
    throw new Error(`amend path is not a demo GIF: ${path}`);
  }
  const name = path.slice(prefix.length, -suffix.length);
  assertDemoTapeName(name);
  return name;
}

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

const UPLOAD_FAILURE = '❌ Failed to upload demo images';
const GIF_URL = /^https:\/\/.*\.gif$/;

/**
 * Parse the upload script's `name:url` pairs.
 *
 * Splits each pair on the first colon. An empty string is no images.
 * The upload-failure sentinel throws. A name must be one safe path
 * segment, and a URL must be `https://` and end in `.gif`.
 */
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

const COMMENT_TOKENS = [
  'CHANGE_STATUS_MESSAGE',
  'DEMO_LIST',
  'PULL_NOTICE',
  'GITHUB_REPOSITORY',
  'GITHUB_SHA',
  'USER_COMMIT_SHA',
] as const;

/**
 * Replace the known comment tokens.
 *
 * The replacement is a function, so `$` in a value stays literal.
 * A template that omits a known token throws. Any other `${...}` token
 * is left unchanged.
 */
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

const COMMENT_FLAGS = {
  '--scratch': 'scratchRoot',
  '--base-tapes': 'baseTapesDir',
  '--head-tapes': 'headTapesDir',
  '--images': 'images',
  '--template': 'template',
  '--repository': 'repository',
  '--github-sha': 'githubSha',
  '--user-commit-sha': 'userCommitSha',
} as const;

const COMMENT_ONLY = new Set<string>([
  '--images',
  '--template',
  '--repository',
  '--github-sha',
  '--user-commit-sha',
]);

const COMMENT_REQUIRED = [
  { field: 'images', flag: '--images' },
  { field: 'template', flag: '--template' },
  { field: 'repository', flag: '--repository' },
  { field: 'githubSha', flag: '--github-sha' },
  { field: 'userCommitSha', flag: '--user-commit-sha' },
] as const;

export interface CommentIo {
  stdout: { write: (chunk: string) => void };
  stderr: { write: (chunk: string) => void };
}

/**
 * Flags for `comment`, `copies`, `amend`, and `commit-list`.
 *
 * `comment` needs the scratch, the image list, the template, and the
 * three commit identity values. `copies` and `amend` need the scratch
 * and the two tape directories. `commit-list` also needs `--head-docs`.
 * `--gif-commit-added` is a boolean.
 */
export function parseCommentArgs(argv: readonly string[]): {
  mode: 'comment' | 'copies' | 'amend' | 'commit-list';
  scratchRoot: string;
  baseTapesDir: string;
  headTapesDir: string;
  images?: string;
  template?: string;
  repository?: string;
  githubSha?: string;
  userCommitSha?: string;
  headDocsImg?: string;
  gifCommitAdded: boolean;
} {
  const mode = argv[0];
  if (
    mode !== 'comment' &&
    mode !== 'copies' &&
    mode !== 'amend' &&
    mode !== 'commit-list'
  ) {
    throw new Error(`unknown mode: ${String(mode)}`);
  }
  const values: Partial<
    Record<
      | 'scratchRoot'
      | 'baseTapesDir'
      | 'headTapesDir'
      | 'images'
      | 'template'
      | 'repository'
      | 'githubSha'
      | 'userCommitSha',
      string
    >
  > = {};
  let gifCommitAdded = false;
  let headDocsImg: string | undefined;
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--gif-commit-added') {
      if (mode !== 'comment') {
        throw new Error('unknown flag: --gif-commit-added');
      }
      gifCommitAdded = true;
      continue;
    }
    const equals = arg.indexOf('=');
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    if (flag === '--head-docs') {
      if (mode !== 'commit-list') {
        throw new Error(`unknown flag: ${flag}`);
      }
      const value = equals === -1 ? argv[index + 1] : arg.slice(equals + 1);
      if (equals === -1) {
        index += 1;
      }
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`${flag} requires a value`);
      }
      headDocsImg = value;
      continue;
    }
    const field = COMMENT_FLAGS[flag as keyof typeof COMMENT_FLAGS];
    if (field === undefined || (mode !== 'comment' && COMMENT_ONLY.has(flag))) {
      throw new Error(`unknown flag: ${flag}`);
    }
    const value = equals === -1 ? argv[index + 1] : arg.slice(equals + 1);
    if (equals === -1) {
      index += 1;
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    values[field] = value;
  }
  if (
    values.scratchRoot === undefined ||
    values.baseTapesDir === undefined ||
    values.headTapesDir === undefined
  ) {
    throw new Error('requires --scratch, --base-tapes, and --head-tapes');
  }
  if (mode === 'comment') {
    const missing = COMMENT_REQUIRED.find(
      (item) => values[item.field] === undefined,
    );
    if (missing !== undefined) {
      throw new Error(`requires ${missing.flag}`);
    }
  }
  if (mode === 'commit-list' && headDocsImg === undefined) {
    throw new Error('requires --head-docs');
  }
  return {
    mode,
    scratchRoot: values.scratchRoot,
    baseTapesDir: values.baseTapesDir,
    headTapesDir: values.headTapesDir,
    images: values.images,
    template: values.template,
    repository: values.repository,
    githubSha: values.githubSha,
    userCommitSha: values.userCommitSha,
    headDocsImg,
    gifCommitAdded,
  };
}

/**
 * Run one comment CLI command. Comment mode writes the filled template.
 * The upload-failure sentinel still exits 0. Copies and amend print
 * path lines. A bad flag or URL exits 1 on stderr.
 */
export function runCommentCli(argv: readonly string[], io: CommentIo): number {
  try {
    const args = parseCommentArgs(argv);
    if (
      args.mode === 'copies' ||
      args.mode === 'amend' ||
      args.mode === 'commit-list'
    ) {
      const entries = loadCommentEntries({
        scratchRoot: args.scratchRoot,
        baseTapesDir: args.baseTapesDir,
        headTapesDir: args.headTapesDir,
        imageUrls: {},
        requireImageUrls: false,
      });
      const text =
        args.mode === 'copies'
          ? planDocsImgCopies({
              scratchRoot: args.scratchRoot,
              entries,
            })
              .map((copy) => `${copy.from}\t${copy.to}`)
              .join('\n')
          : formatAmendList(
              args.mode === 'commit-list'
                ? commitPathsAgainstHead({
                    selection: selectReleaseAmend(entries),
                    headDocsImg: args.headDocsImg ?? '',
                    scratchRoot: args.scratchRoot,
                  })
                : selectReleaseAmend(entries),
            );
      io.stdout.write(text.length === 0 ? '' : `${text}\n`);
      return 0;
    }
    const images = args.images ?? '';
    const uploadFailed = images.includes(UPLOAD_FAILURE);
    const entries = loadCommentEntries({
      scratchRoot: args.scratchRoot,
      baseTapesDir: args.baseTapesDir,
      headTapesDir: args.headTapesDir,
      imageUrls: uploadFailed ? {} : parseDemoImageList(images),
      requireImageUrls: !uploadFailed,
    });
    if (entries.some((entry) => entry.assessment === 'NEED_FRAME_RETRY')) {
      throw new Error('NEED_FRAME_RETRY is not a comment verdict');
    }
    const rendered = uploadFailed
      ? {
          statusMessage: commentStatus(entries),
          demoList: '❌ Failed to upload demo images for preview.',
          pullNotice: args.gifCommitAdded ? PULL_NOTICE : '',
        }
      : renderDemoComment(entries, {
          gifCommitAdded: args.gifCommitAdded,
        });
    const body = fillCommentTemplate(
      readFileSync(args.template ?? '', 'utf8'),
      {
        CHANGE_STATUS_MESSAGE: rendered.statusMessage,
        DEMO_LIST: uploadFailed
          ? '❌ Failed to upload demo images for preview.'
          : rendered.demoList,
        PULL_NOTICE: rendered.pullNotice,
        GITHUB_REPOSITORY: args.repository ?? '',
        GITHUB_SHA: args.githubSha ?? '',
        USER_COMMIT_SHA: args.userCommitSha ?? '',
      },
    );
    io.stdout.write(body);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`${message}\n`);
    return 1;
  }
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
    assertDemoTapeName(entry.name);
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
  /** Comment mode checks stacked and before URLs. Copies and amend do not. */
  requireImageUrls?: boolean;
}): DemoCommentEntry[] {
  const requireImageUrls = options.requireImageUrls !== false;
  const baseNames = tapeNames(options.baseTapesDir);
  const headNames = tapeNames(options.headTapesDir);
  for (const name of [...baseNames, ...headNames]) {
    assertDemoTapeName(name);
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
      requireImageUrls &&
      verdict.assessment === 'CHANGED' &&
      (stackedUrl === undefined || stackedUrl.length === 0)
    ) {
      throw new Error(`missing stacked URL for ${name}`);
    }
    if (
      requireImageUrls &&
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

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const code = runCommentCli(process.argv.slice(2), {
    stdout: {
      write(chunk: string) {
        process.stdout.write(chunk);
      },
    },
    stderr: {
      write(chunk: string) {
        process.stderr.write(chunk);
      },
    },
  });
  process.exit(code);
}
