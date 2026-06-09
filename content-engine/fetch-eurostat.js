/**
 * fetch-eurostat.js
 * Eurostat REST API'den turizm verisi çeker ve /data/eurostat_tourism.json'a kaydeder.
 * Çalıştır: node content-engine/fetch-eurostat.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Boyutlar:
//   tour_dem_ttw → freq, c_dest, purpose, duration, unit, geo, time
//   tour_occ_ninat → freq, c_resid, unit, nace_r2, geo, time
//
// Filtreler:
//   Outbound: purpose=TOTAL & duration=N_GE1 (1+ gece, tüm amaçlar)
//   Toplam rakamı için c_dest=FOR (yurt dışı), destinasyon sıralaması için ayrı istek
//   Otel gecelemeleri: c_resid=FOR (yabancı ziyaretçi), unit=NR, nace_r2=I551-I553

const ENDPOINTS = [
  {
    key: "germany_outbound",
    label: "Almanya – Yurt Dışı Seyahatler (tour_dem_ttw)",
    // c_dest=FOR: sadece yurt dışı, purpose=TOTAL, duration=N_GE1 (1+ gece)
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_dem_ttw?format=JSON&lang=EN&geo=DE&purpose=TOTAL&duration=N_GE1",
    // Destinasyon sıralaması için ayrı istek: tüm ülkeler, purpose=TOTAL, duration=N_GE1
    rankingUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_dem_ttw?format=JSON&lang=EN&geo=DE&purpose=TOTAL&duration=N_GE1",
    destDim: "c_dest",
    excludeDestCodes: ["EUR","EU27_2020","EU28","EU27_2007","EU25","EU27_2020_FOR","NEU27_2020_FOR","EUR_OTH","AFR","AFR_OTH","AME","AME_N","AME_N_OTH","AME_C_S","AME_C_S_OTH","ASI","ASI_OTH","OCE","OCE_OTH","DOM","FOR","WORLD","EFTA"],
  },
  {
    key: "austria_outbound",
    label: "Avusturya – Yurt Dışı Seyahatler (tour_dem_ttw)",
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_dem_ttw?format=JSON&lang=EN&geo=AT&purpose=TOTAL&duration=N_GE1",
    rankingUrl: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_dem_ttw?format=JSON&lang=EN&geo=AT&purpose=TOTAL&duration=N_GE1",
    destDim: "c_dest",
    excludeDestCodes: ["EUR","EU27_2020","EU28","EU27_2007","EU25","EU27_2020_FOR","NEU27_2020_FOR","EUR_OTH","AFR","AFR_OTH","AME","AME_N","AME_N_OTH","AME_C_S","AME_C_S_OTH","ASI","ASI_OTH","OCE","OCE_OTH","DOM","FOR","WORLD","EFTA"],
  },
  {
    key: "turkey_hotel_nights",
    label: "Türkiye – Yabancı Ziyaretçi Geceleme Sayıları (tour_occ_ninat)",
    // geo=TR: Türkiye'deki oteller, c_resid=FOR: yabancı misafir, unit=NR, nace_r2=I551-I553: tüm konaklama
    url: "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tour_occ_ninat?format=JSON&lang=EN&geo=TR&c_resid=FOR&unit=NR&nace_r2=I551-I553",
  },
];

// ─── Yardımcı: HTTP GET → JSON ────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`JSON parse hatası (${url}): ${e.message}`));
        }
      });
    }).on("error", reject);
  });
}

// ─── Veri Ayıklama ─────────────────────────────────────────────────────────────
/**
 * Eurostat JSON → düz {year: value} haritası.
 * Boyut adı "time" veya "TIME_PERIOD" olabilir.
 */
function extractTimeSeries(data) {
  const dims = data.dimension || {};
  // Zaman boyutunu bul
  const timeDimKey = Object.keys(dims).find((k) =>
    ["time", "TIME_PERIOD"].includes(k.toUpperCase()) || k.toLowerCase().includes("time")
  );
  if (!timeDimKey) return null;

  const timeCat = dims[timeDimKey].category;
  const indexMap = timeCat.index;   // { "2010": 0, "2011": 1, ... }
  const labelMap = timeCat.label;   // { "2010": "2010", ... }

  // Kaç tane boyut var ve toplam dilim büyüklüğü
  const dimOrder = data.id || Object.keys(dims);
  const sizes = data.size || dimOrder.map((k) => Object.keys(dims[k].category.index).length);
  const timePos = dimOrder.indexOf(timeDimKey);

  // Zaman dışındaki boyutların toplam elemanı → stride hesabı için
  // Basit yol: sadece tek geo + tek unit filtresi geldiğinde flat değerler zaman serisidir
  const values = data.value;

  // Kaç zaman dilimi var?
  const timeSize = sizes[timePos];

  // Sonraki boyutların çarpımı (sağ taraf stride)
  let rightStride = 1;
  for (let i = timePos + 1; i < sizes.length; i++) rightStride *= sizes[i];

  // Sol taraf stride (zaman solunda kaç kombinasyon var)
  let leftTotal = 1;
  for (let i = 0; i < timePos; i++) leftTotal *= sizes[i];

  const result = {};
  for (const [yearLabel, yearIdx] of Object.entries(indexMap)) {
    let sum = 0;
    let count = 0;
    for (let l = 0; l < leftTotal; l++) {
      const baseOffset = l * timeSize * rightStride + yearIdx * rightStride;
      for (let r = 0; r < rightStride; r++) {
        const v = values[baseOffset + r];
        if (v !== null && v !== undefined) {
          sum += v;
          count++;
        }
      }
    }
    if (count > 0) result[labelMap[yearLabel] || yearLabel] = sum;
  }
  return result;
}

/**
 * Zaman serisinden özet istatistikleri çıkar.
 */
function summarize(timeSeries) {
  const entries = Object.entries(timeSeries)
    .map(([y, v]) => ({ year: y, value: v }))
    .sort((a, b) => a.year.localeCompare(b.year));

  if (!entries.length) return null;

  const values = entries.map((e) => e.value);
  const total = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / values.length);
  const max = entries.reduce((a, b) => (a.value >= b.value ? a : b));
  const min = entries.reduce((a, b) => (a.value <= b.value ? a : b));

  return {
    first_year: entries[0].year,
    last_year: entries[entries.length - 1].year,
    years_count: entries.length,
    yearly_data: Object.fromEntries(entries.map((e) => [e.year, e.value])),
    average_per_year: avg,
    peak_year: { year: max.year, value: max.value },
    lowest_year: { year: min.year, value: min.value },
    total_sum: total,
  };
}

// ─── Destinasyon Boyutunu Çıkar ────────────────────────────────────────────────
function extractTopDestinations(data, destDimKey, excludeCodes = [], topN = 15) {
  const dims = data.dimension || {};
  const destKey = destDimKey || Object.keys(dims).find((k) =>
    ["geo", "partner", "c_dest", "c_resid", "dest"].some((p) =>
      k.toLowerCase().includes(p)
    )
  );
  if (!destKey || !dims[destKey]) return [];

  const cat = dims[destKey].category;
  const labels = cat.label;
  const indexMap = cat.index;

  const dimOrder = data.id || Object.keys(dims);
  const sizes = data.size || dimOrder.map((k) => Object.keys(dims[k].category.index).length);
  const destPos = dimOrder.indexOf(destKey);
  const values = data.value;

  let rightStride = 1;
  for (let i = destPos + 1; i < sizes.length; i++) rightStride *= sizes[i];
  let leftTotal = 1;
  for (let i = 0; i < destPos; i++) leftTotal *= sizes[i];
  const destSize = sizes[destPos];

  const sums = {};
  for (const [code, idx] of Object.entries(indexMap)) {
    if (excludeCodes.includes(code)) continue;
    let sum = 0;
    for (let l = 0; l < leftTotal; l++) {
      const base = l * destSize * rightStride + idx * rightStride;
      for (let r = 0; r < rightStride; r++) {
        const v = values[base + r];
        if (v !== null && v !== undefined) sum += v;
      }
    }
    if (sum > 0) sums[code] = { label: labels[code] || code, total: sum };
  }

  return Object.entries(sums)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, topN)
    .map(([code, v]) => ({ code, name: v.label, total_trips_all_years: v.total }));
}

// ─── Ana Fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  const output = {
    generated_at: new Date().toISOString(),
    source: "Eurostat REST API – https://ec.europa.eu/eurostat/api/dissemination/",
    note: "Değerler: seyahat/geceleme sayısı (NR). DE/AT: purpose=TOTAL, duration=N_GE1 (1+ gece). TR otel: c_resid=FOR (yabancı ziyaretçi).",
    datasets: {},
  };

  for (const ep of ENDPOINTS) {
    console.log(`\n⟳  Çekiliyor: ${ep.label}`);
    try {
      const raw = await fetchJSON(ep.url);

      if (raw.error) {
        throw new Error(JSON.stringify(raw.error));
      }

      const timeSeries = extractTimeSeries(raw);
      const summary = timeSeries ? summarize(timeSeries) : null;

      // Destinasyon sıralaması: aynı raw veri üzerinden (filtreli) veya ayrı istek
      const topDest = extractTopDestinations(
        raw,
        ep.destDim || null,
        ep.excludeDestCodes || [],
        15
      );

      output.datasets[ep.key] = {
        label: ep.label,
        dataset_label: raw.label || "",
        last_updated: raw.updated || "",
        filters_applied: {
          purpose: "TOTAL (tüm seyahat amaçları)",
          duration: ep.key.includes("hotel") ? "N/A" : "N_GE1 (1+ gece)",
          c_resid: ep.key === "turkey_hotel_nights" ? "FOR (yabancı ziyaretçi)" : undefined,
        },
        time_series_summary: summary,
        top_destinations: topDest.length ? topDest : undefined,
      };

      if (summary) {
        console.log(`   ✓ ${summary.first_year}–${summary.last_year} | ${summary.years_count} yıl`);
        console.log(`   ✓ Zirve yıl: ${summary.peak_year.year} → ${summary.peak_year.value.toLocaleString()} seyahat/geceleme`);
        console.log(`   ✓ Yıllık ort.: ${summary.average_per_year.toLocaleString()}`);
      }
      if (topDest.length) {
        console.log(`   ✓ Top 10 destinasyon (${summary ? summary.first_year + "–" + summary.last_year : ""} toplam):`);
        topDest.slice(0, 10).forEach((d, i) =>
          console.log(`     ${String(i + 1).padStart(2)}. ${d.name.padEnd(30)} ${d.total_trips_all_years.toLocaleString()}`)
        );
      }
    } catch (err) {
      console.error(`   ✗ HATA: ${err.message}`);
      output.datasets[ep.key] = { label: ep.label, error: err.message };
    }
  }

  const outPath = path.resolve(__dirname, "../data/eurostat_tourism.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(`\n✅ Kaydedildi: ${outPath}\n`);
}

main();
