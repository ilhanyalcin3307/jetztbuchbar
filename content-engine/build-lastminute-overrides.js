#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const MAP_PATH = path.join(__dirname, '..', 'data', 'lastminute-ibe-giata-map.json');
const OVERRIDES_PATH = path.join(__dirname, '..', 'data', 'lastminute-overrides.json');

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeOverrides(raw) {
  return {
    matchByIbeId: raw.matchByIbeId || {},
    matchByMerchantProductId: raw.matchByMerchantProductId || {},
    excludeIbeIds: Array.isArray(raw.excludeIbeIds) ? raw.excludeIbeIds : [],
    excludeMerchantProductIds: Array.isArray(raw.excludeMerchantProductIds) ? raw.excludeMerchantProductIds : []
  };
}

function canAutoApprove(row) {
  const status = String(row.status || '');
  const confidence = Number(row.confidence || 0);
  if (!row.ibeId || !row.giataId) return false;
  return status === 'exact' || (status === 'strong' && confidence >= 0.95);
}

function main() {
  if (!fs.existsSync(MAP_PATH)) {
    throw new Error('Map fehlt: ' + MAP_PATH + ' (erst npm run lastminute:analyze ausfuehren)');
  }

  const map = loadJson(MAP_PATH, { rows: [] });
  const rows = Array.isArray(map.rows) ? map.rows : [];
  const existing = normalizeOverrides(loadJson(OVERRIDES_PATH, {}));

  const next = normalizeOverrides(existing);
  let added = 0;
  let unchanged = 0;
  let conflicts = 0;

  rows.forEach(function(row) {
    if (!canAutoApprove(row)) return;

    const ibeId = String(row.ibeId);
    const giataId = String(row.giataId);
    const current = next.matchByIbeId[ibeId];
    if (!current) {
      next.matchByIbeId[ibeId] = giataId;
      added += 1;
      return;
    }
    if (String(current) === giataId) {
      unchanged += 1;
      return;
    }
    conflicts += 1;
  });

  const sortedMap = Object.keys(next.matchByIbeId)
    .sort(function(a, b) { return a.localeCompare(b, 'en'); })
    .reduce(function(acc, key) {
      acc[key] = String(next.matchByIbeId[key]);
      return acc;
    }, {});

  const output = {
    matchByIbeId: sortedMap,
    matchByMerchantProductId: next.matchByMerchantProductId,
    excludeIbeIds: next.excludeIbeIds,
    excludeMerchantProductIds: next.excludeMerchantProductIds
  };

  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

  console.log('Lastminute-Overrides aktualisiert.');
  console.log('  Quelle:', MAP_PATH);
  console.log('  Ziel:', OVERRIDES_PATH);
  console.log('  Auto-approved neu:', added);
  console.log('  Unveraendert:', unchanged);
  console.log('  Konflikte (nicht ueberschrieben):', conflicts);
  console.log('  Gesamt matchByIbeId:', Object.keys(sortedMap).length);
}

main();