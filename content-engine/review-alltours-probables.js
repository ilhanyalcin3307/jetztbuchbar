#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, '..', 'data', 'alltours-match-report.json');
const LIMIT = Math.max(1, parseInt(process.argv[2] || '30', 10) || 30);

if (!fs.existsSync(REPORT_PATH)) {
  console.error('Report fehlt: ' + REPORT_PATH);
  console.error('Zuerst ausfuehren: npm run alltours:analyze');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const queue = Array.isArray(report.probableReviewQueue) ? report.probableReviewQueue : [];

console.log('Alltours probable review queue');
console.log('  Gesamt: ' + queue.length);
console.log('  Ausgabe: ' + Math.min(LIMIT, queue.length));
console.log('');

queue.slice(0, LIMIT).forEach(function(item, index) {
  console.log(
    String(index + 1).padStart(2, ' ') + '. '
    + '[' + (item.score != null ? item.score.toFixed(4) : 'n/a') + '] '
    + (item.productName || 'Ohne Name')
    + '  ->  '
    + (item.giataName || 'Ohne GIATA-Name')
  );
  console.log('    merchantProductId: ' + (item.merchantProductId || '-'));
  console.log('    override: "' + (item.merchantProductId || '') + '": "' + (item.giataId || '') + '"');
  console.log('');
});