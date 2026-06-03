#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname);

// Keep defaults deterministic and fast for CI. Additional tasks can be set via CONTENT_ENGINE_TASKS.
const DEFAULT_TASKS = [
  'analyze-alltours-feed.js',
  'analyze-lidlreisen-feed.js'
];

function parseTaskList() {
  const raw = process.env.CONTENT_ENGINE_TASKS;
  if (!raw || !raw.trim()) return DEFAULT_TASKS;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function runTask(taskFile) {
  const fullPath = path.join(ROOT, taskFile);
  if (!fs.existsSync(fullPath)) {
    throw new Error('Task not found: ' + taskFile);
  }

  console.log('\n=== Running task:', taskFile, '===');
  const result = spawnSync(process.execPath, [fullPath], {
    cwd: path.resolve(ROOT, '..'),
    stdio: 'inherit',
    env: process.env,
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(taskFile + ' exited with code ' + result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

function main() {
  const tasks = parseTaskList();
  if (!tasks.length) {
    console.log('No tasks configured. Exiting.');
    return;
  }

  console.log('Content engine started. Tasks:', tasks.join(', '));

  for (const task of tasks) {
    runTask(task);
  }

  console.log('\nContent engine finished successfully.');
}

try {
  main();
} catch (err) {
  const message = err && err.message ? err.message : String(err);
  console.error('\nContent engine failed:', message);
  process.exit(1);
}
