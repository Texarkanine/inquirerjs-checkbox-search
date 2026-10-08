#!/usr/bin/env node

import { exec, execFileSync, execSync } from 'child_process';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  existsSync,
  writeFileSync,
} from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DEMOS_DIR = 'demos';
const DEFAULT_OUTPUT_DIR = 'docs/img';

// Configuration constants
const DEFAULT_MAX_PARALLELISM = 4;
const DEMO_NAME = /^[a-zA-Z0-9_-]+$/;
const BUFFER_SIZE = 10 * 1024 * 1024; // 10 MB buffer for Docker output

function runCommand(command) {
  console.log(`🔨 Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

async function runCommandAsync(command, tapeName) {
  console.log(`🎬 [${tapeName}] Starting...`);
  try {
    const { stderr } = await execAsync(command, { maxBuffer: BUFFER_SIZE });
    if (stderr) {
      console.error(`⚠️ [${tapeName}] stderr: ${stderr}`);
    }
    console.log(`✅ [${tapeName}] Completed successfully!`);
    return { success: true, tapeName };
  } catch (error) {
    console.error(`❌ [${tapeName}] Failed: ${error.message}`);
    return { success: false, tapeName, error };
  }
}

function generateDemo(tapeFile) {
  const tapeName = basename(tapeFile, '.tape');
  const outputPath = `${DEFAULT_OUTPUT_DIR}/${tapeName}-demo.gif`;
  console.log(`🎬 Generating demo: ${tapeName}`);
  runCommand(`npm run demo:docker:build`);
  runCommand(
    `npm run demo:docker:run -- "${tapeFile}" --output "${outputPath}"`,
  );
}

async function generateDemoParallel(tapeFile) {
  const tapeName = basename(tapeFile, '.tape');
  const outputPath = `${DEFAULT_OUTPUT_DIR}/${tapeName}-demo.gif`;
  const command = `npm run demo:docker:run -- "${tapeFile}" --output "${outputPath}"`;
  return await runCommandAsync(command, tapeName);
}

function getAllTapeFiles() {
  if (!existsSync(DEMOS_DIR)) {
    console.error(`❌ Demos directory not found: ${DEMOS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(DEMOS_DIR)
    .filter((file) => file.endsWith('.tape'))
    .map((file) => join(DEMOS_DIR, file))
    .sort(); // Alphabetical order

  if (files.length === 0) {
    console.error(`❌ No .tape files found in ${DEMOS_DIR}/`);
    process.exit(1);
  }

  return files;
}

// Process items in chunks with controlled parallelism
async function processInChunks(items, processor, maxParallelism) {
  const results = [];

  for (let i = 0; i < items.length; i += maxParallelism) {
    const chunk = items.slice(i, i + maxParallelism);
    console.log(
      `🚀 Processing chunk ${Math.floor(i / maxParallelism) + 1}/${Math.ceil(items.length / maxParallelism)} (${chunk.length} demos)`,
    );

    const chunkResults = await Promise.all(chunk.map(processor));

    results.push(...chunkResults);
  }

  return results;
}

function showUsage() {
  console.log(
    'Usage: node scripts/generate-demo.js <demo-name(s)|all> [--max-parallelism=N]',
  );
  console.log('');
  console.log('Options:');
  console.log(
    `  --max-parallelism=N   Maximum parallel demos (default: ${DEFAULT_MAX_PARALLELISM})`,
  );
  console.log('  --help               Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/generate-demo.js basic');
  console.log('  node scripts/generate-demo.js basic validation');
  console.log('  node scripts/generate-demo.js all');
  console.log('  node scripts/generate-demo.js all --max-parallelism=2');
  console.log('');
  console.log(
    'Scratch mode records one demo at a time and writes text, frames, and a gif',
  );
  console.log(
    'under the scratch directory. It requires all four flags and does not use --output:',
  );
  console.log(
    '  node scripts/generate-demo.js all --image=vhs-node-demo:base --scratch=/tmp/attempt-0/base --demos-dir=/tmp/base/demos --build-context=/tmp/base',
  );
}

function hasScratchFlag(args) {
  return args.some((arg) =>
    /^(--image|--scratch|--demos-dir|--build-context)(=|$)/.test(arg),
  );
}

function scratchDemoNames(demosDir, requested) {
  if (requested.length === 1 && requested[0] === 'all') {
    if (!existsSync(demosDir)) {
      console.error(`❌ Demos directory not found: ${demosDir}`);
      process.exit(1);
    }
    const names = readdirSync(demosDir)
      .filter((file) => file.endsWith('.tape'))
      .map((file) => basename(file, '.tape'))
      .sort();
    if (names.length === 0) {
      console.error(`❌ No .tape files found in ${demosDir}/`);
      process.exit(1);
    }
    return names;
  }

  for (const name of requested) {
    if (!DEMO_NAME.test(name) || !existsSync(join(demosDir, `${name}.tape`))) {
      console.error(`❌ Demo not found: ${name}.tape`);
      process.exit(1);
    }
  }
  return [...requested];
}

async function runScratch(argv) {
  const { parseGenerateArgs, withFingerprintOutputs, buildDockerRunArgs } =
    await import('./demo-fingerprint.ts');
  const parsed = parseGenerateArgs(argv);
  if (
    !parsed.image ||
    !parsed.scratch ||
    !parsed.demosDir ||
    !parsed.buildContext
  ) {
    console.error(
      '❌ Scratch mode requires --image, --scratch, --demos-dir, and --build-context',
    );
    process.exit(1);
  }
  if (parsed.demos.length === 0) {
    console.error('❌ No demo names provided');
    process.exit(1);
  }

  const demos = scratchDemoNames(parsed.demosDir, parsed.demos);
  for (const name of demos) {
    if (!DEMO_NAME.test(name)) {
      console.error(`❌ Demo name is not safe: ${name}`);
      process.exit(1);
    }
  }

  console.log(`🔨 Building ${parsed.image} from ${parsed.buildContext}`);
  execFileSync(
    'docker',
    [
      'build',
      '-f',
      join(parsed.buildContext, 'demos', 'Dockerfile'),
      '-t',
      parsed.image,
      parsed.buildContext,
    ],
    { stdio: 'inherit' },
  );

  for (const demoName of demos) {
    const hostDemoDir = join(parsed.scratch, demoName);
    mkdirSync(join(hostDemoDir, 'frames'), { recursive: true });
    const tapeSource = readFileSync(
      join(parsed.demosDir, `${demoName}.tape`),
      'utf8',
    );
    const containerDemo = `/workspace/scratch/${demoName}`;
    const rewritten = withFingerprintOutputs(
      tapeSource,
      `${containerDemo}/record.txt`,
      `${containerDemo}/frames`,
    );
    writeFileSync(join(hostDemoDir, 'tape.tape'), rewritten);
    console.log(`🎬 [${demoName}] Recording into ${hostDemoDir}`);
    execFileSync(
      'docker',
      buildDockerRunArgs({
        image: parsed.image,
        hostScratch: parsed.scratch,
        containerTapePath: `${containerDemo}/tape.tape`,
      }),
      { stdio: 'inherit' },
    );
  }
}

async function main() {
  if (hasScratchFlag(process.argv.slice(2))) {
    await runScratch(process.argv.slice(2));
    return;
  }

  let args = process.argv.slice(2);
  let maxParallelism = DEFAULT_MAX_PARALLELISM;

  // Check for help flag first
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  // Parse --max-parallelism flag
  const maxParallelismIndex = args.findIndex((arg) =>
    arg.startsWith('--max-parallelism'),
  );
  if (maxParallelismIndex !== -1) {
    const flag = args[maxParallelismIndex];
    if (flag.includes('=')) {
      maxParallelism = parseInt(flag.split('=')[1], 10);
    } else if (maxParallelismIndex + 1 < args.length) {
      maxParallelism = parseInt(args[maxParallelismIndex + 1], 10);
      args.splice(maxParallelismIndex, 2); // Remove flag and value
    } else {
      console.error('❌ --max-parallelism requires a value');
      process.exit(1);
    }

    if (flag.includes('=')) {
      args.splice(maxParallelismIndex, 1); // Remove flag only
    }

    if (isNaN(maxParallelism) || maxParallelism < 1) {
      console.error('❌ --max-parallelism must be a positive integer');
      process.exit(1);
    }
  }

  if (args.length === 0) {
    console.error('❌ No demo names provided');
    console.error('');
    showUsage();
    process.exit(1);
  }

  // 1. Start with empty list of demos to generate
  let demosToGenerate = [];

  // 2. If single arg is 'all' -> detect demos and populate list
  if (args.length === 1 && args[0] === 'all') {
    console.log('🔍 Detecting all available demos...');
    const tapeFiles = getAllTapeFiles();
    demosToGenerate = tapeFiles;

    console.log(`📁 Found ${demosToGenerate.length} demo(s):`);
    demosToGenerate.forEach((file) =>
      console.log(`  - ${basename(file, '.tape')}`),
    );
  }
  // 3. Else -> ensure tape exists for each arg and populate list
  else {
    console.log(`🔍 Validating ${args.length} requested demo(s)...`);

    for (const demoName of args) {
      const tapeFile = join(DEMOS_DIR, `${demoName}.tape`);

      if (!existsSync(tapeFile)) {
        console.error(`❌ Demo not found: ${demoName}.tape`);
        console.error('');
        console.error('Available demos:');
        const available = getAllTapeFiles().map(
          (f) => `  - ${basename(f, '.tape')}`,
        );
        available.forEach((demo) => console.error(demo));
        process.exit(1);
      }

      demosToGenerate.push(tapeFile);
    }

    console.log(`✅ All requested demos found:`);
    demosToGenerate.forEach((file) =>
      console.log(`  - ${basename(file, '.tape')}`),
    );
  }

  console.log('');

  // 4. Generate those demos in parallel
  if (demosToGenerate.length === 1) {
    // Single demo - use synchronous generation for cleaner output
    console.log('🎬 Generating single demo...');
    generateDemo(demosToGenerate[0]);
    console.log(
      `✅ Demo "${basename(demosToGenerate[0], '.tape')}" generated successfully!`,
    );
  } else {
    // Multiple demos - use parallel generation with controlled parallelism
    console.log(
      `🚀 Generating ${demosToGenerate.length} demos in parallel (max ${maxParallelism} at once)...`,
    );

    // Build Docker image once
    console.log('🔨 Building Docker image (required for all demos)...');
    runCommand('npm run demo:docker:build');
    console.log('✅ Docker image built successfully!');
    console.log('');

    // Generate all demos in controlled parallel chunks
    console.log('🚀 Starting parallel demo generation...');
    const startTime = Date.now();

    const results = await processInChunks(
      demosToGenerate,
      generateDemoParallel,
      maxParallelism,
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Report results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log('');
    console.log('📊 Generation Summary:');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`🔧 Max parallelism: ${maxParallelism}`);
    console.log(`✅ Successful: ${successful.length}`);
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length}`);
      failed.forEach((f) =>
        console.log(`  - ${f.tapeName}: ${f.error.message}`),
      );
      process.exit(1);
    } else {
      console.log('🎉 All demos generated successfully!');
    }
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
