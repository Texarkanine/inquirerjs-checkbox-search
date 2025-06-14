#!/usr/bin/env node

import { exec, execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DEMOS_DIR = 'demos';

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
    const { stderr } = await execAsync(command);
    if (stderr) {
      console.error(`⚠️ [${tapeName}] Warning: ${stderr}`);
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
  console.log(`🎬 Generating demo: ${tapeName}`);
  runCommand(`npm run demo:docker:build`);
  runCommand(`npm run demo:docker:run -- "${tapeFile}"`);
}

async function generateDemoParallel(tapeFile) {
  const tapeName = basename(tapeFile, '.tape');
  const command = `npm run demo:docker:run -- "${tapeFile}"`;
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: node scripts/generate-demo.js <demo-name(s)|all>');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/generate-demo.js basic');
    console.error('  node scripts/generate-demo.js basic validation');
    console.error('  node scripts/generate-demo.js all');
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
    // Multiple demos - use parallel generation
    console.log(`🚀 Generating ${demosToGenerate.length} demos in parallel...`);

    // Build Docker image once
    console.log('🔨 Building Docker image (required for all demos)...');
    runCommand('npm run demo:docker:build');
    console.log('✅ Docker image built successfully!');
    console.log('');

    // Generate all demos in parallel
    console.log('🚀 Starting parallel demo generation...');
    const startTime = Date.now();

    const results = await Promise.all(
      demosToGenerate.map(generateDemoParallel),
    );

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Report results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log('');
    console.log('📊 Generation Summary:');
    console.log(`⏱️  Total time: ${duration}s`);
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
