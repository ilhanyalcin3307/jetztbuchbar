const pages = require('./pages.js');
const tracker = require('./generated-pages.json');
const expansion = require('./expansion-tracker.json');
const done = Object.assign({}, tracker, expansion);
const doneKeys = Object.keys(done);
const all = pages.ALL_PAGES || [];
const pending = all.filter(function(p) { return doneKeys.indexOf(p.id) === -1; });
console.log('Toplam:', all.length, '| Üretilmiş:', doneKeys.length, '| Bekleyen:', pending.length);
pending.slice(0, 20).forEach(function(p) { console.log(' -', p.id, '->', p.file); });
