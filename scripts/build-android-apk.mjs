#!/usr/bin/env node
/**
 * build-android-apk.mjs
 * Helper script to assemble an Android APK or AAB and copy it to a top-level dist/ folder
 * with a readable timestamped filename for sharing with testers.
 *
 * Usage examples:
 *   node scripts/build-android-apk.mjs              # release APK (default)
 *   node scripts/build-android-apk.mjs --variant=debug
 *   node scripts/build-android-apk.mjs --aab        # release AAB
 *   yarn apk:release                                # via package.json
 *   yarn aab                                        # release AAB via script shortcut
 */

// Use CommonJS style requires to avoid potential ESLint/TypeScript parser issues
const { spawn } = await import('node:child_process');
const fs = await import('node:fs');
const path = await import('node:path');
const { fileURLToPath } = await import('node:url');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname); // segmentation/ root

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
  console.log(`Build Android artifact (APK or AAB) and copy to dist/\n\nOptions:\n  --variant=release|debug   Build type (default: release)\n  --aab                     Build an Android App Bundle instead of APK\n  -h, --help                Show help\n\nExamples:\n  node scripts/build-android-apk.mjs\n  node scripts/build-android-apk.mjs --variant=debug\n  node scripts/build-android-apk.mjs --aab\n  yarn apk:release\n  yarn apk:debug\n  yarn aab\n`);
}

async function run() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const variant = args.variant === 'debug' ? 'debug' : 'release';
  const producingAab = !!args.aab;

  const pkgJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const appName = pkgJson.name || 'app';
  const version = pkgJson.version || '0.0.0';

  const androidDir = path.join(projectRoot, 'android');
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
    ? path.join(androidDir, 'app', 'build', 'outputs', 'bundle', variant, `app-${variant}.aab`)
    : path.join(androidDir, 'app', 'build', 'outputs', 'apk', variant, `app-${variant}.apk`);

  if (!fs.existsSync(artifactPath)) {
    console.error(`❌ Expected artifact not found at: ${artifactPath}`);
    console.error('Check the build output above for details.');
    process.exit(1);
  }

  const distDir = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').slice(0,15);
  const outName = `${appName}-v${version}-${variant}-${timestamp}.${producingAab ? 'aab' : 'apk'}`;
  const destPath = path.join(distDir, outName);

  fs.copyFileSync(artifactPath, destPath);
  console.log(`\n✅ Artifact copied to: ${destPath}`);
  console.log('\nShare this file directly with testers (debug requires USB / dev mode; release can be installed on devices allowing unknown sources).');
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

run().catch(err => {
  console.error('\n❌ Build failed:', err.message);
  process.exit(1);
});
