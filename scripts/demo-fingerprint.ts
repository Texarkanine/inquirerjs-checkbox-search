import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** VHS separates screens in a `.txt` record with this line. */
const FRAME_SEPARATOR = `${'─'.repeat(80)}\n`;

/**
 * Drop bare-prompt setup frames from a VHS text record and collapse
 * consecutive duplicate screens into one canonical string.
 *
 * The record separates screens with a line of 80 U+2500 characters.
 * Frames that are only `>` or whitespace are the shell prompt drawn
 * before the demo starts. Consecutive copies of the same screen are
 * the tape holding a frame, not a new state.
 */
export function normalizeTextRecord(text: string): string {
  const frames = text
    .split(FRAME_SEPARATOR)
    .map((frame) => frame.replace(/\n+$/, ''))
    .filter((frame) => !/^[>\s]*$/.test(frame));
  const canonical = frames.filter(
    (frame, index) => index === 0 || frame !== frames[index - 1],
  );
  return canonical.join(FRAME_SEPARATOR);
}

/**
 * Hash the frame-text PNGs in the order given.
 *
 * Each file is SHA-256, truncated to 16 hex characters. Consecutive
 * identical hashes collapse to one, then that sequence is hashed.
 * An empty list hashes the empty sequence.
 */
export function frameStateFingerprint(framePaths: readonly string[]): string {
  const shortHashes = framePaths.map((path) =>
    createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16),
  );
  const collapsed = shortHashes.filter(
    (hash, index) => index === 0 || hash !== shortHashes[index - 1],
  );
  const sequence = collapsed.map((hash) => `${hash}\n`).join('');
  return createHash('sha256').update(sequence).digest('hex');
}

export type Assessment =
  'NEW' | 'REMOVED' | 'CHANGED' | 'SAME' | 'UNSTABLE' | 'NEED_FRAME_RETRY';

/** One side of one recording, already normalized. */
export interface SideFingerprint {
  text: string;
  frames: string;
}

/**
 * One recording pass. A null side means that side was not recorded
 * on this attempt.
 */
export interface AttemptFingerprints {
  base: SideFingerprint | null;
  head: SideFingerprint | null;
}

export interface AssessmentInput {
  baseTapeExists: boolean;
  headTapeExists: boolean;
  attempts: readonly AttemptFingerprints[];
}

/**
 * Decide one demo's verdict from the pinned retry rule.
 *
 * A text mismatch on the first recording is CHANGED. A frame mismatch
 * is CHANGED only when a retry still disagrees. A retry whose text
 * differs from that side's first text is UNSTABLE. One agreeing retry
 * does not erase a later retry that still disagrees.
 */
export function assessFingerprints(input: AssessmentInput): Assessment {
  if (!input.baseTapeExists && input.headTapeExists) {
    return 'NEW';
  }
  if (input.baseTapeExists && !input.headTapeExists) {
    return 'REMOVED';
  }
  if (!input.baseTapeExists && !input.headTapeExists) {
    throw new Error('demo has no tape on either side');
  }

  const first = input.attempts[0];
  if (!first?.base || !first.head) {
    throw new Error('first recording is missing a side');
  }
  if (first.base.text !== first.head.text) {
    return 'CHANGED';
  }
  if (first.base.frames === first.head.frames) {
    return 'SAME';
  }

  const retries = input.attempts.slice(1);
  if (retries.length === 0) {
    return 'NEED_FRAME_RETRY';
  }

  for (const retry of retries) {
    if (!retry.base || !retry.head) {
      throw new Error('retry recording is missing a side');
    }
    if (
      retry.base.text !== first.base.text ||
      retry.head.text !== first.head.text
    ) {
      return 'UNSTABLE';
    }
  }

  const everyRetryAgrees = retries.every(
    (retry) => retry.base?.frames === retry.head?.frames,
  );
  return everyRetryAgrees ? 'SAME' : 'CHANGED';
}

/**
 * One comment line naming every demo verdict. Shadow mode prints this
 * and does not use it to expand or collapse the demo blocks.
 */
export function formatShadowLine(
  entries: readonly { name: string; assessment: Assessment }[],
): string {
  const summary = [...entries]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((entry) => `${entry.name} ${entry.assessment}`)
    .join(', ');
  const body = summary.length === 0 ? 'none' : summary;
  return `Shadow verdicts (not used to expand demos): ${body}.`;
}

export interface GenerateArgs {
  image?: string;
  scratch?: string;
  demosDir?: string;
  buildContext?: string;
  demos: string[];
}

export interface DockerRunOptions {
  image: string;
  hostScratch: string;
  containerTapePath: string;
  containerName: string;
}

/**
 * Options for one scratch recording and the host copy that follows it.
 * `demoName` becomes the container name. `hostFramesDir` receives the
 * frame PNGs after VHS exits.
 */
export interface ScratchRecordingOptions {
  image: string;
  hostScratch: string;
  containerTapePath: string;
  demoName: string;
  hostFramesDir: string;
}

/**
 * Return a tape with quoted Output lines for the gif, the text record,
 * and the frames directory appended. The source string is not modified.
 * Paths are container paths. The frames path is stored with a trailing slash.
 */
export function withFingerprintOutputs(
  tapeSource: string,
  textPath: string,
  framesDir: string,
): string {
  const demoDir = dirname(textPath);
  const gifPath = `${demoDir}/${basename(demoDir)}-demo.gif`;
  const framesPath = framesDir.endsWith('/') ? framesDir : `${framesDir}/`;
  const prefix = tapeSource.endsWith('\n') ? tapeSource : `${tapeSource}\n`;
  return (
    `${prefix}` +
    `Output "${gifPath}"\n` +
    `Output "${textPath}"\n` +
    `Output "${framesPath}"\n`
  );
}

/**
 * Frames directory inside the container. VHS v0.10 writes frames under
 * its temp dir (`/tmp`) and `os.Rename`s that directory onto this path.
 * A bind-mounted destination is a different filesystem, so the rename
 * fails and the frames are deleted. This path stays on the container's
 * own `/tmp`. The process temp dir is left alone: Chromium's profile
 * lives there, and pointing `TMPDIR` at the scratch mount hung the
 * recording.
 */
export const containerFramesDir = '/tmp/vhs-frames';

/**
 * Docker arguments for one scratch recording. The host scratch directory
 * is mounted at `/workspace/scratch`. The gif is an Output line in the
 * tape, so these arguments do not pass `--output`.
 *
 * The container is not removed. The caller copies the frames out and
 * then removes it. VHS writes frame PNGs as mode 0600, so the command
 * makes them readable before the copy.
 */
export function buildDockerRunArgs(options: DockerRunOptions): string[] {
  return [
    'run',
    '--name',
    options.containerName,
    '-v',
    `${options.hostScratch}:/workspace/scratch`,
    '--entrypoint',
    'bash',
    options.image,
    '-c',
    `mkdir -p ${containerFramesDir} && vhs "$1" && chmod -R a+rX ${containerFramesDir}`,
    'bash',
    options.containerTapePath,
  ];
}

/**
 * `docker cp` arguments that copy the container frames directory onto
 * the host. The source path ends in `/.` so the PNGs land in
 * `hostFramesDir` rather than a nested directory.
 */
export function buildDockerCpArgs(
  containerName: string,
  hostFramesDir: string,
): string[] {
  return ['cp', `${containerName}:${containerFramesDir}/.`, hostFramesDir];
}

/**
 * `docker rm` arguments that delete the recording container. `-f`
 * succeeds when the container is already gone.
 */
export function buildDockerRmArgs(containerName: string): string[] {
  return ['rm', '-f', containerName];
}

/**
 * Run one scratch recording, copy its frames to the host, and remove
 * the container. The container is removed when the recording fails too.
 */
export function runScratchRecording(
  options: ScratchRecordingOptions,
  exec: (args: string[]) => void,
): void {
  const containerName = `vhs-scratch-${options.demoName}`;
  try {
    exec(
      buildDockerRunArgs({
        image: options.image,
        hostScratch: options.hostScratch,
        containerTapePath: options.containerTapePath,
        containerName,
      }),
    );
    exec(buildDockerCpArgs(containerName, options.hostFramesDir));
  } finally {
    exec(buildDockerRmArgs(containerName));
  }
}

/**
 * Write a CLI result. A structural error goes to stderr so a caller
 * that captures stdout still leaves the message in the job log.
 */
export function writeCliResult(
  result: { lines: string[]; exitCode: number },
  stdout: { write: (chunk: string) => void },
  stderr: { write: (chunk: string) => void },
): void {
  const text = `${result.lines.join('\n')}\n`;
  if (result.exitCode === 0) {
    stdout.write(text);
    return;
  }
  stderr.write(text);
}

/**
 * Parse the scratch-mode flags for the demo generator.
 * Unknown flags throw. Positional arguments are demo names.
 */
const GENERATE_FLAGS = {
  '--image': 'image',
  '--scratch': 'scratch',
  '--demos-dir': 'demosDir',
  '--build-context': 'buildContext',
} as const;

export function parseGenerateArgs(argv: readonly string[]): GenerateArgs {
  const parsed: GenerateArgs = { demos: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) {
      parsed.demos.push(arg);
      continue;
    }
    const equals = arg.indexOf('=');
    const name = equals === -1 ? arg : arg.slice(0, equals);
    const field = GENERATE_FLAGS[name as keyof typeof GENERATE_FLAGS];
    if (!field) {
      throw new Error(`unknown flag: ${name}`);
    }
    const value = equals === -1 ? argv[index + 1] : arg.slice(equals + 1);
    if (equals === -1) {
      index += 1;
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    parsed[field] = value;
  }
  return parsed;
}

const DEMO_NAME = /^[a-zA-Z0-9_-]+$/;

/** A frame-text PNG name, in the order VHS writes those files. */
export function listFrameTextPngs(framesDir: string): string[] {
  return readdirSync(framesDir)
    .filter((name) => /^frame-text-.*\.png$/.test(name))
    .sort()
    .map((name) => join(framesDir, name));
}

/**
 * Read one recorded side. Throws when the text record is missing,
 * the frames directory is missing, or it contains no frame-text PNGs.
 */
export function readSide(demoDir: string): { text: string; frames: string } {
  const textPath = join(demoDir, 'record.txt');
  if (!existsSync(textPath)) {
    throw new Error(`missing record.txt in ${demoDir}`);
  }
  const framesDir = join(demoDir, 'frames');
  if (!existsSync(framesDir)) {
    throw new Error(`missing frames directory in ${demoDir}`);
  }
  const framePaths = listFrameTextPngs(framesDir);
  if (framePaths.length === 0) {
    throw new Error(`no frame-text PNGs in ${framesDir}`);
  }
  return {
    text: normalizeTextRecord(readFileSync(textPath, 'utf8')),
    frames: frameStateFingerprint(framePaths),
  };
}

export interface ScratchOptions {
  scratchRoot: string;
  baseTapesDir: string;
  headTapesDir: string;
}

/**
 * Compare every demo under the scratch tree. Exit 0 carries a verdict,
 * including UNSTABLE and NEED_FRAME_RETRY. Exit 1 is a structural error:
 * a bad demo name or a missing recording.
 */
/**
 * Sorted `<demo>: <ASSESSMENT>` lines, then one `SHADOW_VERDICTS=` line.
 */
export function formatCliStdout(
  entries: readonly { name: string; assessment: Assessment }[],
): string {
  const sorted = [...entries].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const lines = sorted.map((entry) => `${entry.name}: ${entry.assessment}`);
  lines.push(`SHADOW_VERDICTS=${formatShadowLine(sorted)}`);
  return lines.join('\n');
}

/** Reject a demo name that cannot be used as a single path segment. */
export function assertSafeDemoName(name: string): void {
  if (!DEMO_NAME.test(name)) {
    throw new Error(`demo name is not safe: ${name}`);
  }
}

function tapeNames(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }
  return readdirSync(directory)
    .filter((name) => name.endsWith('.tape'))
    .map((name) => basename(name, '.tape'));
}

function attemptNames(scratchRoot: string): string[] {
  if (!existsSync(scratchRoot)) {
    return [];
  }
  return readdirSync(scratchRoot)
    .filter((name) => /^attempt-\d+$/.test(name))
    .sort(
      (left, right) =>
        Number(left.slice('attempt-'.length)) -
        Number(right.slice('attempt-'.length)),
    );
}

function attemptsForDemo(
  scratchRoot: string,
  demo: string,
  baseTape: boolean,
  headTape: boolean,
): AttemptFingerprints[] {
  const attempts = attemptNames(scratchRoot);
  const loaded: AttemptFingerprints[] = [];
  for (const [index, attempt] of attempts.entries()) {
    const baseDir = join(scratchRoot, attempt, 'base', demo);
    const headDir = join(scratchRoot, attempt, 'head', demo);
    const basePresent = existsSync(baseDir);
    const headPresent = existsSync(headDir);
    if (index === 0) {
      if ((baseTape && !basePresent) || (headTape && !headPresent)) {
        throw new Error(`missing recording for ${demo}`);
      }
      loaded.push({
        base: baseTape ? readSide(baseDir) : null,
        head: headTape ? readSide(headDir) : null,
      });
      continue;
    }
    if (!basePresent && !headPresent) {
      continue;
    }
    if ((baseTape && !basePresent) || (headTape && !headPresent)) {
      throw new Error(`missing recording for ${demo}`);
    }
    loaded.push({
      base: basePresent ? readSide(baseDir) : null,
      head: headPresent ? readSide(headDir) : null,
    });
  }
  if (baseTape && headTape && loaded.length === 0) {
    throw new Error(`missing recording for ${demo}`);
  }
  return loaded;
}

export function assessScratch(options: ScratchOptions): {
  lines: string[];
  exitCode: number;
} {
  try {
    const baseNames = tapeNames(options.baseTapesDir);
    const headNames = tapeNames(options.headTapesDir);
    for (const name of [...baseNames, ...headNames]) {
      assertSafeDemoName(name);
    }
    const names = [...new Set([...baseNames, ...headNames])].sort((a, b) =>
      a.localeCompare(b),
    );
    const entries = names.map((name) => ({
      name,
      assessment: assessFingerprints({
        baseTapeExists: baseNames.includes(name),
        headTapeExists: headNames.includes(name),
        attempts: attemptsForDemo(
          options.scratchRoot,
          name,
          baseNames.includes(name),
          headNames.includes(name),
        ),
      }),
    }));
    return { lines: formatCliStdout(entries).split('\n'), exitCode: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { lines: [message], exitCode: 1 };
  }
}

const SCRATCH_FLAGS = {
  '--scratch': 'scratchRoot',
  '--base-tapes': 'baseTapesDir',
  '--head-tapes': 'headTapesDir',
} as const;

/**
 * Parse `node scripts/demo-fingerprint.ts --scratch --base-tapes --head-tapes`.
 */
export function parseScratchArgs(argv: readonly string[]): ScratchOptions {
  const parsed: Partial<ScratchOptions> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const equals = arg.indexOf('=');
    const name = equals === -1 ? arg : arg.slice(0, equals);
    const field = SCRATCH_FLAGS[name as keyof typeof SCRATCH_FLAGS];
    if (!field) {
      throw new Error(`unknown flag: ${name}`);
    }
    const value = equals === -1 ? argv[index + 1] : arg.slice(equals + 1);
    if (equals === -1) {
      index += 1;
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`${name} requires a value`);
    }
    parsed[field] = value;
  }
  if (!parsed.scratchRoot || !parsed.baseTapesDir || !parsed.headTapesDir) {
    throw new Error('requires --scratch, --base-tapes, and --head-tapes');
  }
  return {
    scratchRoot: parsed.scratchRoot,
    baseTapesDir: parsed.baseTapesDir,
    headTapesDir: parsed.headTapesDir,
  };
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    const result = assessScratch(parseScratchArgs(process.argv.slice(2)));
    writeCliResult(result, process.stdout, process.stderr);
    process.exit(result.exitCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}
