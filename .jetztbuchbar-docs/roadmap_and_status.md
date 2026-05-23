# JetztBuchbar – Yol Haritası & Durum

> **Son Güncelleme:** 23 Mai 2026
> Bu dosya her büyük değişiklikte güncellenir. Yeni bir oturuma başlarken buradan bağlamı yeniden kur.

---

## ✅ Tamamlananlar

### Faz 1 – Temel Altyapı (Tamamlandı)
- [x] Proje Vercel'e bağlandı, `https://jetztbuchbar.de` canlıya alındı
- [x] GIATA API entegrasyonu (`api/giata.js`) — `top / search / detail / property` action'ları
- [x] `components/hotel-carousel.js` — tüm destinasyon sayfalarında çalışan carousel motoru
- [x] JB Experten-Score algoritması (ağırlıklı, 0–100 arası) carousel'e ve detay sayfasına eklendi
- [x] SVG Score Mühürü (JB Badge) otel kartlarına entegre edildi
- [x] Google Analytics (`G-YCDTX8ZEQ3`) ve Crisp Chat entegrasyonu

### Faz 2 – UX & Mimari Yeniden Yapılanma (Tamamlandı)
- [x] **Eski hantal karşılaştırma widget kodu (`initHotelCompare`, `FACILITIES` array, `DEMO_HOTELS` vs.)** tamamen silindi (~880 satır dead code temizlendi)
- [x] **`window.JB_COMPARE` Store** (localStorage kalıcı, `jb_cmp_v1`) kuruldu
- [x] **Sticky Compare Bar** (`#jb-cbar`) — carousel'de checkbox seçince altta belirir, "Jetzt Vergleichen" butonu
- [x] **Carousel Checkbox Overlay** — her otel kartında "Vergleichen" checkbox'ı
- [x] **`vergleich.html`** — dinamik düello sayfası (`?hotels=ID1,ID2,ID3`), winner tespiti, fazit metni, otel ekle arama
- [x] **`hotel.html`** — "⇄ Mit anderem Hotel vergleichen" butonu + picker sidebar'a eklendi
- [x] **Ana Sayfa Hero Yenilendi** — eski statik hero kaldırıldı, iki butonlu (Suchen + Vergleichen) akıllı arama çubuğu eklendi
- [x] GIATA "Powered by" satırı hero'nun altından kaldırıldı

### Faz 2 – Hotfix'ler (Tamamlandı)
- [x] **Hero Search HTML eksikliği fix** — `id="hs-input"` elementi sayfa HTML'inde yoktu (eski widget HTML yerinde kalmıştı); yeni dual-action arama HTML'i eklendi
- [x] **JS crash fix** — `sed` silme işleminden kalan orphan `clearTimeout(el._t)` satırı ReferenceError atıyordu; temizlendi
- [x] **Vergleichen akış fix** — otel seçince isim kutuda kalıyordu; artık "⇄ Vergleichen" basınca seçili otel listeye eklenir, input otomatik boşalır, dinamik slot sayacı gösterilir ("Noch X Hotels hinzufügen")

---

## 🔄 Mevcut Durum (23 Mai 2026)

Ana karşılaştırma altyapısı çalışır durumda:
- `vergleich.html` canlı ve çalışıyor
- Hero arama kutusu + autocomplete + compare flow çalışıyor
- Carousel compare checkbox'ları ve sticky bar çalışıyor

**Bilinen açık sorunlar:** Şu an kritik bir hata yoktur.

---

## 🗺️ Gelecek Planlar (Next Steps)

### Faz 3 – Score Motor & Backend (Yüksek Öncelik)
- [ ] **JB Experten-Score v2** — Gerçek GIATA `property` verisinden otomatik hesaplama (şu an bazı kategoriler statik)
- [ ] **Score API endpoint** — `action=score&id=...` → JSON olarak skor döner (B2B SaaS temeli)
- [ ] **Score Akreditasyon Badge** — "Geprüft von JetztBuchbar" SVG rozetinin otel sitelerine gömülebilir versiyonu

### Faz 4 – UX Geliştirmeleri (Orta Öncelik)
- [ ] **Sticky Top Navigation & Quick Filters** — Sayfanın üstünde blur'lu sabit navigasyon; ülke/tema filtre chip'leri
- [ ] **Mobil Optimizasyon Pass** — Carousel swipe, karşılaştırma ekranı responsive düzenlemeler
- [ ] **`vergleich.html` Paylaşım Butonu** — "Düelloyu Paylaş" → unique URL kopyala / sosyal medya
- [ ] **Otel Fotoğraf Galerisi** — `hotel.html`'de lightbox galeri (şu an tek görsel)

### Faz 5 – İçerik & SEO (Orta Öncelik)
- [ ] **Content Engine otomasyonu** — Yeni destinasyon/otel sayfaları `content-engine/` ile otomatik üretim
- [ ] **Reisezeit sayfaları** — Türkiye, Yunanistan, İspanya gibi destinasyonlar için en iyi seyahat zamanı içerikleri
- [ ] **Strukturierte Daten (JSON-LD)** — Google Rich Results için schema.org markup

### Faz 6 – Sosyal & Viral Motor (Uzun Vadeli)
- [ ] **Otomatik Sosyal Medya İçerik/Düello Motoru** — "Hotel Battle of the Week" formatında otomatik görsel/post üretimi
- [ ] **TikTok / Instagram Reels formatında otel düello videosu** — Canva API veya benzeri entegrasyon
- [ ] **B2B API Dokümantasyonu** — TUI/DERTOUR gibi operatörler için JB Score API lisans sayfası

---

## 📋 Teknik Notlar & Uyarılar

- `sed -i '' 'Xd'` komutunu kullanırken dikkat: satır numaraları değişebilir ve önceki script bloklarından orphan kod satırları kalabilir. Büyük silmeleri python scripti ile yap.
- `replace_string_in_file` Unicode karakterleri (`ü`, `ö`, `─` vs.) bazen escape farkı nedeniyle eşleşmeyebilir. Eşleşmezse `sed -i ''` ile direkt satır sil.
- `multi_replace_string_in_file` başarısız sayısı: 1 → genelde son replacement (en uzun oldStrings) başarısız olur. Ayrı çağrıya böl.
- Vercel deploy: `vercel --prod` (lokal CLI: `/opt/homebrew/bin/vercel`). Her deploy ~2 dakika sürer.
- Git branch: `main`. Force push yasak. Her özellik doğrudan main'e commit edilir.
