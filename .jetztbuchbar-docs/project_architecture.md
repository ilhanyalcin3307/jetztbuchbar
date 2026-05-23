# JetztBuchbar – Proje Mimarisi

## Tech Stack

| Katman | Teknoloji |
|---|---|
| **Frontend** | Pure Static HTML / CSS / Vanilla JS |
| **Hosting** | Vercel (Serverless) |
| **API Layer** | Vercel Serverless Functions (`/api/*.js`) |
| **Otel Verisi** | GIATA® API (`api/giata.js`) |
| **Analytics** | Google Analytics `G-YCDTX8ZEQ3` |
| **Canlı Chat** | Crisp (`bd983cbc-0fb7-4b1e-9d37-4c2c02ba1f0b`) |
| **Repo** | `https://github.com/ilhanyalcin3307/jetztbuchbar.git` (branch: `main`) |
| **Live URL** | `https://jetztbuchbar.de` |

---

## Tasarım Sistemi (Design Tokens)

```css
--bg:          #0a0a0a   /* Sayfa zemini */
--bg-card:     #121212   /* Kart arka planı */
--accent:      #00c896   /* JetztBuchbar Yeşil */
--text:        #f0f0f0   /* Ana metin */
--text-muted:  #888      /* İkincil metin */
--border:      #1e1e1e   /* Kenarlık */
--radius:      12px      /* Köşe yarıçapı */
```

**Görsel Dil:** Dark Mode · Premium · Lüks SaaS · Yarı şeffaf backdrop-blur elementler · Glassmorphism panel stili

---

## Sayfa Yapısı

### `index.html` — Ana Sayfa
- **Hero Alanı:** Büyük `h1` başlık + Dual-Action arama çubuğu
  - `#hs-input` → Otel adı / şehir arama
  - `#hs-btn-search` → İlk sonuca doğrudan git (`/hotel.html?id=...`)
  - `#hs-btn-compare` → Karşılaştırma modunu aç; seçili oteli `compareList`'e ekle
  - `#hs-compare-chips` → Seçili otellerin chip etiketleri
  - `#hs-hint` → Kalan slot sayısı bilgisi ("Noch 2 Hotels hinzufügen")
- **Ülke Carouselleri:** Dikey Instagram Story tarzı ülke/şehir kartları
- **Otel Carouselleri:** `components/hotel-carousel.js` ile render edilen JB Score mühürlü kartlar, üzerinde Vergleich checkbox'ı

### `vergleich.html` — Düello (Versus) Sayfası
- URL parametresi: `?hotels=ID1,ID2,ID3`
- Her otel için `action=property` API çağrısı → paralel `Promise.all`
- **Kolon yapısı:** `grid-template-columns: repeat(auto-fit, minmax(280px,1fr))`
- **Winner tespiti:** JB Score hesabına göre; kazanan kolona yeşil glow border + 🏆 ribbon
- **COMPARE_ROWS:** 13 kriter (Strandlage, Pool, Wasserpark, Spa, All-Inclusive, Kids Club, Fitness, Restaurant, Bar, Hamam/Sauna, Golf, WLAN, Parkplatz)
- **Fazit Text:** Kazanana otomatik Almanca öneri metni üretilir
- **Otel Ekle:** Input + autocomplete → `history.replaceState` ile URL güncellenir

### `hotel.html` — Otel Detay Sayfası
- URL parametresi: `?id=GIATA_ID&slug=otel-adi`
- Sağ sidebar: Fiyat/talep kokpiti
  - `#hd-compare-btn` → "⇄ Mit anderem Hotel vergleichen"
  - `#hd-compare-picker` → Açılır arama + autocomplete
  - AC'den seçim → `/vergleich.html?hotels=currentId,selectedId`

---

## Bileşenler

### `components/hotel-carousel.js`
- Tüm şehir sayfalarında ve ana sayfada çağrılır
- Her kart üzerinde Vergleich checkbox overlay'i (`data-hotel-id`)
- **`window.JB_COMPARE` Store** (global, localStorage'da kalıcı):
  ```js
  JB_COMPARE = {
    items: [],   // [{id, name, img}]
    MAX: 3,
    KEY: 'jb_cmp_v1',
    has(id), add(id,name,img), remove(id), clear(), onChange(fn)
  }
  ```
- **Sticky Compare Bar** (`#jb-cbar`): 1+ otel seçilince altta belirir; "Jetzt Vergleichen" → `/vergleich.html?hotels=...`

### `api/giata.js` — Serverless API
| Action | Parametre | Açıklama |
|---|---|---|
| `action=top` | — | En popüler oteller |
| `action=search` | `q=...` | Otel adı / şehir araması |
| `action=detail` | `id=...` | Temel otel bilgisi |
| `action=property` | `id=...` | Tam özellik seti (JB Score için) |

---

## JB Experten-Score Algoritması

```
SCORING = {
  pool:0, spa:0, beach:15, aquapark:10, kids:8, golf:5,
  fitness:5, restaurant:5, bar:3, wifi:3, parking:2, hamam:4, allinc:15
}
CAT_CAP = { L:35, P:35, F:20, A:15 }
Stars bonus = (stars / 5) × 15

rawScore = sum(kategori puanları) + starBonus
JB Score = (rawScore / 120) × 100  → 0-100 arası
```

---

## localStorage Anahtarları

| Anahtar | İçerik |
|---|---|
| `jb_cmp_v1` | `JB_COMPARE` karşılaştırma sepeti |

---

## Dizin Yapısı (Özet)

```
/
├── index.html              Ana sayfa
├── hotel.html              Otel detay sayfası
├── vergleich.html          Düello / karşılaştırma sayfası
├── components/
│   └── hotel-carousel.js   Carousel + Compare Store
├── api/
│   └── giata.js            GIATA API proxy (Vercel Serverless)
├── content-engine/         Sayfa üretim motoru (Node.js)
├── [ülke]/[şehir]/
│   └── index.html          Her destinasyon sayfası
└── .jetztbuchbar-docs/     Bu dokümantasyon klasörü
```
