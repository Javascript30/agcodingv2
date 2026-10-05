const fs = require('fs');
const { spawnSync } = require('child_process');

const TARGET_FILE = 'scheduler.js';
const TEST_FILE = 'scheduler.test.js';
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runTests() {
  console.log(`\n[watch] Running ${TEST_FILE} because ${TARGET_FILE} changed...`);
  const result = spawnSync(cmd, ['vitest', 'run', TEST_FILE], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
}

runTests();

fs.watchFile(TARGET_FILE, { interval: 250 }, (curr, prev) => {
  if (curr.mtimeMs !== prev.mtimeMs) {
    runTests();
  }
});

process.on('SIGINT', () => {
  console.log('\n[watch] Stopped watching for changes.');
  process.exit(0);
});
