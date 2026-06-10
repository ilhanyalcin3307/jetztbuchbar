#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'api', 'giata-search-index.json');
const JBScore = require('../components/jb-score.js').JBScore;

const TARGET_PAGES = [
  { file: 'griechenland/zakynthos/index.html', cc: 'GR', cities: ['Zakynthos', 'Zante', 'Zakinthos'], destination: 'Zakynthos' },
  { file: 'tuerkei/fethiye/index.html', cc: 'TR', cities: ['Fethiye'], destination: 'Fethiye' },
  { file: 'tuerkei/antalya/index.html', cc: 'TR', cities: ['Antalya'], destination: 'Antalya' },
  { file: 'tuerkei/marmaris/index.html', cc: 'TR', cities: ['Marmaris'], destination: 'Marmaris' },
  { file: 'tuerkei/alanya/index.html', cc: 'TR', cities: ['Alanya'], destination: 'Alanya' },
  { file: 'spanien/barcelona/index.html', cc: 'ES', cities: ['Barcelona'], destination: 'Barcelona' },
  { file: 'spanien/mallorca/index.html', cc: 'ES', cities: ['Palma', 'Mallorca', 'Palma de Mallorca', 'Alcudia'], destination: 'Mallorca' },
  { file: 'griechenland/kreta/index.html', cc: 'GR', cities: ['Heraklion', 'Chania', 'Rethymno', 'Crete', 'Kreta', 'Iraklion', 'Agios Nikolaos'], destination: 'Kreta' },
  { file: 'griechenland/index.html', cc: 'GR', cities: null, destination: 'Griechenland' },
  { file: 'tuerkei/index.html', cc: 'TR', cities: null, destination: 'Türkei' }
];

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/[^a-z0-9]/g, '');
}

function cityMatches(city, cityEn, targets) {
  if (!targets || !targets.length) return true;
  const nc = norm(city);
  const ne = norm(cityEn);
  return targets.some((target) => {
    const nt = norm(target);
    return nc === nt || ne === nt || nc.includes(nt) || nt.includes(nc) || ne.includes(nt) || nt.includes(ne);
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildStaticBlock(destination, hotels) {
  const rows = hotels.map((h, i) => {
    const score = Number(h._score || 0);
    const stars = Number(h.stars || 0);
    const starTxt = stars > 0 ? (' · ' + '★'.repeat(Math.min(stars, 5))) : '';
    const url = '/hotel.html?id=' + encodeURIComponent(h.giataId) + '&slug=' + encodeURIComponent(slugify(h.name));
    return '      <li style="display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;padding:.38rem 0;border-bottom:1px dashed rgba(255,255,255,.08)">'
      + '<a href="' + escapeHtml(url) + '" style="color:#e8e8e8;text-decoration:underline;text-underline-offset:2px;line-height:1.45">'
      + (i + 1) + '. ' + escapeHtml(h.name) + '</a>'
      + '<span style="white-space:nowrap;color:#00c896;font-weight:700">JBScore ' + score + '/100' + starTxt + '</span>'
      + '</li>';
  }).join('\n');

  return [
    '    <!-- SEO_STATIC_TOP_HOTELS_START -->',
    '    <div class="seo-static-top-hotels" style="margin:0 0 1rem;padding:.9rem 1rem;border:1px solid rgba(0,200,150,.25);border-radius:10px;background:rgba(0,200,150,.06)">',
    '      <h3 style="font-size:.95rem;margin:0 0 .55rem;color:#00c896">JBScore Top 5 Hotels in ' + escapeHtml(destination) + ' 2026</h3>',
    '      <p style="font-size:.82rem;color:#b8b8b8;margin:0 0 .35rem">Statische Vorschau für Suchmaschinen: unabhängig berechnet auf Basis von Fakten, Bewertungssignalen und Sicherheitsdaten.</p>',
    '      <ol style="list-style:none;margin:0;padding:0">',
           rows,
    '      </ol>',
    '    </div>',
    '    <!-- SEO_STATIC_TOP_HOTELS_END -->'
  ].join('\n');
}

function selectTopHotels(indexHotels, cfg) {
  const candidates = indexHotels.filter((h) => h && h.cc === cfg.cc && cityMatches(h.city, h.cityEn, cfg.cities));
  candidates.forEach((h) => {
    h._score = JBScore.calcScore(h);
  });
  candidates.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return Number(b.stars || 0) - Number(a.stars || 0);
  });
  return candidates.slice(0, 5);
}

function injectBlock(html, block) {
  const markerStart = '<!-- SEO_STATIC_TOP_HOTELS_START -->';
  const markerEnd = '<!-- SEO_STATIC_TOP_HOTELS_END -->';

  if (html.includes(markerStart) && html.includes(markerEnd)) {
    return html.replace(new RegExp(markerStart + '[\\s\\S]*?' + markerEnd, 'm'), block);
  }

  const anchor = '<div data-hotel-ranking=';
  const idx = html.indexOf(anchor);
  if (idx === -1) return html;

  return html.slice(0, idx) + block + '\n' + html.slice(idx);
}

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error('Index file missing: ' + INDEX_FILE);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const hotels = Array.isArray(raw.hotels) ? raw.hotels : (Array.isArray(raw) ? raw : []);

  let changed = 0;
  let skipped = 0;

  TARGET_PAGES.forEach((cfg) => {
    const filePath = path.join(ROOT, cfg.file);
    if (!fs.existsSync(filePath)) {
      console.log('SKIP missing file: ' + cfg.file);
      skipped++;
      return;
    }

    const top = selectTopHotels(hotels, cfg);
    if (!top.length) {
      console.log('SKIP no hotels: ' + cfg.file);
      skipped++;
      return;
    }

    const block = buildStaticBlock(cfg.destination, top);
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = injectBlock(original, block);

    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      changed++;
      console.log('UPDATED ' + cfg.file + ' | #1 ' + top[0].name + ' (' + top[0]._score + ')');
    } else {
      skipped++;
      console.log('SKIP unchanged: ' + cfg.file);
    }
  });

  console.log('Done. changed=' + changed + ' skipped=' + skipped);
}

main();
