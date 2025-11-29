#!/usr/bin/env node
/**
 * build-android-apk.js
 * Helper script to assemble an Android APK or AAB and copy it to a top-level dist/ folder
 * with a readable timestamped filename for sharing with testers.
 */

const { spawn } = require('child_process');
const { existsSync, mkdirSync, copyFileSync, readFileSync } = require('fs');
const { join, dirname } = require('path');

const projectRoot = dirname(__dirname); // segmentation/ root

function parseArgs(argv) {
  const args = { variant: 'release', aab: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--variant=')) {
      args.variant = arg.split('=')[1];
    } else if (arg === '--aab') {
      args.aab = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`Build Android artifact (APK or AAB) and copy to dist/\n\nOptions:\n  --variant=release|debug   Build type (default: release)\n  --aab                     Build an Android App Bundle instead of APK\n  -h, --help                Show help\n`);
}

async function run() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const variant = args.variant === 'debug' ? 'debug' : 'release';
  const producingAab = !!args.aab;

  const pkgJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
  const appName = (pkgJson.name || 'app').replace(/\s+/g, '-');
  const version = pkgJson.version || '0.0.0';

  const androidDir = join(projectRoot, 'android');
  const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const gradleTask = producingAab ? `bundle${capitalize(variant)}` : `assemble${capitalize(variant)}`;

  console.log(`\n➡️  Building Android ${producingAab ? 'AAB' : 'APK'} (task: ${gradleTask})...`);

  await new Promise((resolve, reject) => {
    const child = spawn(gradlew, [gradleTask], {
      cwd: androidDir,
      stdio: 'inherit'
    });
    child.on('exit', code => {
      if (code === 0) resolve(); else reject(new Error(`Gradle task failed with exit code ${code}`));
    });
  });

  const artifactPath = producingAab
    ? join(androidDir, 'app', 'build', 'outputs', 'bundle', variant, `app-${variant}.aab`)
    : join(androidDir, 'app', 'build', 'outputs', 'apk', variant, `app-${variant}.apk`);

  if (!existsSync(artifactPath)) {
    console.error(`❌ Expected artifact not found at: ${artifactPath}`);
    console.error('Check the build output above for details.');
    process.exit(1);
  }

  const distDir = join(projectRoot, 'dist');
  if (!existsSync(distDir)) mkdirSync(distDir);

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').slice(0,15);
  const outName = `${appName}-v${version}-${variant}-${timestamp}.${producingAab ? 'aab' : 'apk'}`;
  const destPath = join(distDir, outName);

  copyFileSync(artifactPath, destPath);
  console.log(`\n✅ Artifact copied to: ${destPath}`);
  console.log('\nShare this file with testers. Debug builds may require enabling developer options; release builds can be installed if "Install unknown apps" is allowed.');
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

run().catch(err => {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
});
