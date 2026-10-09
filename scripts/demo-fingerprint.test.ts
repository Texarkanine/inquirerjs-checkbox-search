import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertSafeDemoName,
  assessFingerprints,
  assessScratch,
  buildDockerRunArgs,
  formatCliStdout,
  formatShadowLine,
  frameStateFingerprint,
  listFrameTextPngs,
  normalizeTextRecord,
  parseGenerateArgs,
  readSide,
  runScratchRecording,
  withFingerprintOutputs,
  writeCliResult,
  type AssessmentInput,
  type SideFingerprint,
} from './demo-fingerprint.ts';

function side(text: string, frames: string): SideFingerprint {
  return { text, frames };
}

function both(attempts: AssessmentInput['attempts']): AssessmentInput {
  return { baseTapeExists: true, headTapeExists: true, attempts };
}

function writeFrames(contents: readonly Buffer[]): string[] {
  const dir = mkdtempSync(join(tmpdir(), 'demo-frames-'));
  return contents.map((bytes, index) => {
    const path = join(dir, `frame-text-${String(index).padStart(5, '0')}.png`);
    writeFileSync(path, bytes);
    return path;
  });
}

const SEPARATOR = `${'─'.repeat(80)}\n`;

function record(frames: readonly string[]): string {
  return frames.join(SEPARATOR);
}

describe('normalizeTextRecord', () => {
  it('drops setup frames that are only a prompt or whitespace and collapses consecutive screens', () => {
    const screen = 'Search:\n◯ React';
    const raw = record(['>', '   ', screen, screen, screen]);

    expect(normalizeTextRecord(raw)).toBe(screen);
  });

  it('treats two different validation lines as different text', () => {
    const withAngle = 'Search:\n> Please select at least 2 team members';
    const withBang = 'Search:\n! Please select at least 2 team members';

    expect(normalizeTextRecord(withAngle)).not.toBe(
      normalizeTextRecord(withBang),
    );
  });

  it('matches the same screens when one recording holds more duplicate frames', () => {
    const first = 'Search:';
    const second = 'Search:\nreact';
    const short = record([first, second]);
    const held = record([first, first, second, second, second]);

    expect(normalizeTextRecord(short)).toBe(normalizeTextRecord(held));
    expect(normalizeTextRecord(short)).toBe(`${first}${SEPARATOR}${second}`);
  });

  it('matches another empty record when normalization drops every frame', () => {
    expect(normalizeTextRecord('>')).toBe('');
    expect(normalizeTextRecord('   ')).toBe('');
    expect(normalizeTextRecord('>')).toBe(normalizeTextRecord(' \n> \n'));
  });
});

describe('frameStateFingerprint', () => {
  const frameA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01]);
  const frameB = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x02]);

  it('collapses a longer run of identical frames to the same fingerprint', () => {
    const once = writeFrames([frameA, frameB]);
    const held = writeFrames([frameA, frameA, frameA, frameB, frameB]);

    expect(frameStateFingerprint(held)).toBe(frameStateFingerprint(once));
  });

  it('changes when one PNG byte changes and when the order changes', () => {
    const first = writeFrames([frameA, frameB]);
    const flippedByte = writeFrames([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x03]),
      frameB,
    ]);
    const flippedOrder = writeFrames([frameB, frameA]);

    expect(frameStateFingerprint(first)).not.toBe(
      frameStateFingerprint(flippedByte),
    );
    expect(frameStateFingerprint(first)).not.toBe(
      frameStateFingerprint(flippedOrder),
    );
  });

  it('returns the same defined fingerprint for every empty list', () => {
    expect(frameStateFingerprint([])).toBe(frameStateFingerprint([]));
    expect(frameStateFingerprint([])).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('assessFingerprints', () => {
  it('reports NEW when only the head tape exists and REMOVED when only the base tape exists', () => {
    expect(
      assessFingerprints({
        baseTapeExists: false,
        headTapeExists: true,
        attempts: [],
      }),
    ).toBe('NEW');
    expect(
      assessFingerprints({
        baseTapeExists: true,
        headTapeExists: false,
        attempts: [],
      }),
    ).toBe('REMOVED');
  });

  it('reports CHANGED on a first-attempt text mismatch and ignores a later frame match', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('alpha', 'frame-a'), head: side('beta', 'frame-a') },
          { base: side('same', 'frame-z'), head: side('same', 'frame-z') },
        ]),
      ),
    ).toBe('CHANGED');
  });

  it('reports SAME when the first text and frames match, without consulting a retry', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('same', 'frame'), head: side('same', 'frame') },
          {
            base: side('drifted', 'other'),
            head: side('same', 'different'),
          },
        ]),
      ),
    ).toBe('SAME');
  });

  it('reports NEED_FRAME_RETRY when frames differ and no retry was recorded', () => {
    expect(
      assessFingerprints(
        both([{ base: side('same', 'left'), head: side('same', 'right') }]),
      ),
    ).toBe('NEED_FRAME_RETRY');
  });

  it('reports UNSTABLE when a retry text differs from that side first text', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('same', 'left'), head: side('same', 'right') },
          { base: side('drifted', 'agreed'), head: side('same', 'agreed') },
        ]),
      ),
    ).toBe('UNSTABLE');
  });

  it('reports SAME when the only retry frames match and the retry text matches the first text', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('same', 'left'), head: side('same', 'right') },
          { base: side('same', 'agreed'), head: side('same', 'agreed') },
        ]),
      ),
    ).toBe('SAME');
  });

  it('reports CHANGED when a retry frame pair also differs', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('same', 'left'), head: side('same', 'right') },
          {
            base: side('same', 'still-left'),
            head: side('same', 'still-right'),
          },
        ]),
      ),
    ).toBe('CHANGED');
  });

  it('reports CHANGED when an earlier retry matches and a later retry differs', () => {
    expect(
      assessFingerprints(
        both([
          { base: side('same', 'left'), head: side('same', 'right') },
          { base: side('same', 'agreed'), head: side('same', 'agreed') },
          {
            base: side('same', 'later-left'),
            head: side('same', 'later-right'),
          },
        ]),
      ),
    ).toBe('CHANGED');
  });
});

describe('formatShadowLine', () => {
  it('returns one line of demo verdicts sorted by name', () => {
    const line = formatShadowLine([
      { name: 'validation', assessment: 'NEED_FRAME_RETRY' },
      { name: 'basic', assessment: 'SAME' },
    ]);

    expect(line).toBe(
      'Shadow verdicts (not used to expand demos): basic SAME, validation NEED_FRAME_RETRY.',
    );
    expect(line).not.toContain('\n');
  });
});

describe('withFingerprintOutputs', () => {
  const source = 'Hide\nType "node examples/basic.js"\nEnter\n';
  const textPath = '/workspace/scratch/basic/record.txt';
  const framesDir = '/workspace/scratch/basic/frames';

  it('leaves the source string untouched and appends quoted container Output lines', () => {
    const result = withFingerprintOutputs(source, textPath, framesDir);

    expect(source).toBe('Hide\nType "node examples/basic.js"\nEnter\n');
    expect(result.startsWith(source)).toBe(true);
    expect(result).toContain(
      'Output "/workspace/scratch/basic/basic-demo.gif"\n',
    );
    expect(result).toContain('Output "/workspace/scratch/basic/record.txt"\n');
    expect(result).toContain('Output "/workspace/scratch/basic/frames/"\n');
  });

  it('stores a frames path that omitted the trailing slash with one', () => {
    const result = withFingerprintOutputs(source, textPath, framesDir);

    expect(result).toContain('Output "/workspace/scratch/basic/frames/"');
    expect(result).not.toContain('Output "/workspace/scratch/basic/frames"\n');
  });
});

describe('buildDockerRunArgs', () => {
  const options = {
    image: 'vhs-node-demo:base',
    hostScratch: '/tmp/scratch/attempt-0/base',
    containerTapePath: '/workspace/scratch/basic/tape.tape',
    containerName: 'vhs-scratch-basic',
  };

  it('mounts the host scratch, passes the in-container tape, and omits --output', () => {
    const args = buildDockerRunArgs(options);

    expect(args).toContain('vhs-node-demo:base');
    expect(args).toContain('/tmp/scratch/attempt-0/base:/workspace/scratch');
    expect(args).toContain('/workspace/scratch/basic/tape.tape');
    expect(args).not.toContain('--output');
  });

  it('keeps the process temp dir off the bind mount and leaves the container so frames can be copied', () => {
    const args = buildDockerRunArgs(options);

    expect(args.join('\n')).not.toContain('TMPDIR');
    expect(args).not.toContain('--rm');
    expect(args).toContain('--name');
    expect(args).toContain('vhs-scratch-basic');
    expect(args.join('\n')).not.toContain('mkdir');
    expect(args).toContain(
      'vhs "$1"; status=$?; if [ -d /tmp/vhs-frames ]; then chmod -R a+rX /tmp/vhs-frames; fi; exit $status',
    );
  });
});

describe('runScratchRecording', () => {
  const options = {
    image: 'vhs-node-demo:base',
    hostScratch: '/tmp/scratch/attempt-0/base',
    containerTapePath: '/workspace/scratch/basic/tape.tape',
    demoName: 'basic',
    hostFramesDir: '/tmp/scratch/attempt-0/base/basic/frames',
  };

  it('copies frames from the container filesystem after a recording', () => {
    const calls: string[][] = [];

    runScratchRecording(options, (args) => {
      calls.push(args);
    });

    expect(calls.map((args) => args[0])).toEqual(['run', 'cp', 'rm']);
    expect(calls[1]).toEqual([
      'cp',
      'vhs-scratch-basic:/tmp/vhs-frames/.',
      '/tmp/scratch/attempt-0/base/basic/frames',
    ]);
    expect(calls[2]).toEqual(['rm', '-f', 'vhs-scratch-basic']);
  });

  it('removes the container when the recording fails', () => {
    const calls: string[][] = [];

    expect(() =>
      runScratchRecording(options, (args) => {
        calls.push(args);
        if (args[0] === 'run') {
          throw new Error('vhs failed');
        }
      }),
    ).toThrow('vhs failed');
    expect(calls.map((args) => args[0])).toEqual(['run', 'rm']);
  });
});

describe('writeCliResult', () => {
  it('writes a structural error to stderr so a failed command substitution still shows it', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    writeCliResult(
      { lines: ['no frame-text PNGs in /frames'], exitCode: 1 },
      { write: (chunk) => stdout.push(chunk) },
      { write: (chunk) => stderr.push(chunk) },
    );

    expect(stdout).toEqual([]);
    expect(stderr).toEqual(['no frame-text PNGs in /frames\n']);
  });

  it('writes a successful verdict to stdout', () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    writeCliResult(
      { lines: ['basic: SAME'], exitCode: 0 },
      { write: (chunk) => stdout.push(chunk) },
      { write: (chunk) => stderr.push(chunk) },
    );

    expect(stdout).toEqual(['basic: SAME\n']);
    expect(stderr).toEqual([]);
  });
});

describe('parseGenerateArgs', () => {
  it('round-trips image, scratch, demos dir, and build context', () => {
    expect(
      parseGenerateArgs([
        '--image',
        'vhs-node-demo:base',
        '--scratch=/tmp/scratch',
        '--demos-dir',
        '/wt/demos',
        '--build-context=/wt',
        'basic',
      ]),
    ).toEqual({
      image: 'vhs-node-demo:base',
      scratch: '/tmp/scratch',
      demosDir: '/wt/demos',
      buildContext: '/wt',
      demos: ['basic'],
    });
  });

  it('rejects an unknown flag', () => {
    expect(() => parseGenerateArgs(['--output', 'docs/img/basic.gif'])).toThrow(
      /unknown flag/,
    );
  });
});

function writePng(dir: string, name: string, bytes: readonly number[]): void {
  writeFileSync(join(dir, name), Buffer.from(bytes));
}

describe('listFrameTextPngs', () => {
  it('returns frame-text PNGs in filename order and ignores frame-cursor PNGs', () => {
    const framesDir = mkdtempSync(join(tmpdir(), 'frame-names-'));
    writePng(framesDir, 'frame-text-00002.png', [2]);
    writePng(framesDir, 'frame-cursor-00000.png', [9]);
    writePng(framesDir, 'frame-text-00000.png', [0]);
    writePng(framesDir, 'frame-text-00001.png', [1]);

    expect(listFrameTextPngs(framesDir)).toEqual([
      join(framesDir, 'frame-text-00000.png'),
      join(framesDir, 'frame-text-00001.png'),
      join(framesDir, 'frame-text-00002.png'),
    ]);
  });
});

describe('readSide', () => {
  it('fingerprints only the frame-text PNGs', () => {
    const demoDir = mkdtempSync(join(tmpdir(), 'read-side-'));
    const framesDir = join(demoDir, 'frames');
    mkdirSync(framesDir);
    writeFileSync(join(demoDir, 'record.txt'), 'Search:\n');
    writePng(framesDir, 'frame-text-00000.png', [1, 2, 3]);
    writePng(framesDir, 'frame-cursor-00000.png', [9, 9, 9]);

    expect(readSide(demoDir).frames).toBe(
      frameStateFingerprint([join(framesDir, 'frame-text-00000.png')]),
    );
  });

  it('throws when the text record or the text frames are missing', () => {
    const missingText = mkdtempSync(join(tmpdir(), 'missing-text-'));
    mkdirSync(join(missingText, 'frames'));
    writePng(join(missingText, 'frames'), 'frame-text-00000.png', [1]);
    expect(() => readSide(missingText)).toThrow(/record\.txt/);

    const missingFrames = mkdtempSync(join(tmpdir(), 'missing-frames-'));
    writeFileSync(join(missingFrames, 'record.txt'), 'Search:\n');
    expect(() => readSide(missingFrames)).toThrow(/frames/);

    const emptyFrames = mkdtempSync(join(tmpdir(), 'empty-frames-'));
    mkdirSync(join(emptyFrames, 'frames'));
    writeFileSync(join(emptyFrames, 'record.txt'), 'Search:\n');
    expect(() => readSide(emptyFrames)).toThrow(/frame-text/);
  });
});

describe('assertSafeDemoName', () => {
  it('throws when a demo name is not letters, digits, underscore, or hyphen', () => {
    expect(() => assertSafeDemoName('has.dot')).toThrow(/demo name/);
    expect(() => assertSafeDemoName('../basic')).toThrow(/demo name/);
  });
});

function recordingTree(): {
  scratchRoot: string;
  baseTapes: string;
  headTapes: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'scratch-'));
  const baseTapes = join(root, 'base-tapes');
  const headTapes = join(root, 'head-tapes');
  mkdirSync(baseTapes);
  mkdirSync(headTapes);
  return { scratchRoot: join(root, 'scratch'), baseTapes, headTapes };
}

function writeTape(dir: string, name: string): void {
  writeFileSync(join(dir, `${name}.tape`), 'Hide\n');
}

function writeAttempt(
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
  writePng(framesDir, 'frame-text-00000.png', [frameByte]);
  writePng(framesDir, 'frame-cursor-00000.png', [255]);
}

describe('assessScratch', () => {
  it('returns NEED_FRAME_RETRY with exit 0 when the first frames differ', () => {
    const tree = recordingTree();
    writeTape(tree.baseTapes, 'basic');
    writeTape(tree.headTapes, 'basic');
    writeAttempt(tree.scratchRoot, 0, 'base', 'basic', 'Search:\n', 1);
    writeAttempt(tree.scratchRoot, 0, 'head', 'basic', 'Search:\n', 2);

    const result = assessScratch({
      scratchRoot: tree.scratchRoot,
      baseTapesDir: tree.baseTapes,
      headTapesDir: tree.headTapes,
    });

    expect(result.exitCode).toBe(0);
    expect(result.lines).toContain('basic: NEED_FRAME_RETRY');
  });

  it('returns UNSTABLE with exit 0 when the retry text disagrees with the first text', () => {
    const tree = recordingTree();
    writeTape(tree.baseTapes, 'basic');
    writeTape(tree.headTapes, 'basic');
    writeAttempt(tree.scratchRoot, 0, 'base', 'basic', 'Search:\n', 1);
    writeAttempt(tree.scratchRoot, 0, 'head', 'basic', 'Search:\n', 2);
    writeAttempt(tree.scratchRoot, 1, 'base', 'basic', 'Search:\ndrift\n', 3);
    writeAttempt(tree.scratchRoot, 1, 'head', 'basic', 'Search:\n', 3);

    const result = assessScratch({
      scratchRoot: tree.scratchRoot,
      baseTapesDir: tree.baseTapes,
      headTapesDir: tree.headTapes,
    });

    expect(result.exitCode).toBe(0);
    expect(result.lines).toContain('basic: UNSTABLE');
  });

  it('returns exit 1 for a bad demo name or a missing recording', () => {
    const badName = recordingTree();
    writeTape(badName.baseTapes, 'has.dot');
    writeTape(badName.headTapes, 'has.dot');
    expect(
      assessScratch({
        scratchRoot: badName.scratchRoot,
        baseTapesDir: badName.baseTapes,
        headTapesDir: badName.headTapes,
      }).exitCode,
    ).toBe(1);

    const missing = recordingTree();
    writeTape(missing.baseTapes, 'basic');
    writeTape(missing.headTapes, 'basic');
    mkdirSync(missing.scratchRoot);
    expect(
      assessScratch({
        scratchRoot: missing.scratchRoot,
        baseTapesDir: missing.baseTapes,
        headTapesDir: missing.headTapes,
      }).exitCode,
    ).toBe(1);
  });
});

describe('formatCliStdout', () => {
  it('sorts demo lines and ends with the shadow sentence', () => {
    const entries = [
      { name: 'validation' as const, assessment: 'NEED_FRAME_RETRY' as const },
      { name: 'added' as const, assessment: 'NEW' as const },
      { name: 'basic' as const, assessment: 'SAME' as const },
    ];

    expect(formatCliStdout(entries)).toBe(
      [
        'added: NEW',
        'basic: SAME',
        'validation: NEED_FRAME_RETRY',
        `SHADOW_VERDICTS=${formatShadowLine(entries)}`,
      ].join('\n'),
    );
  });
});
