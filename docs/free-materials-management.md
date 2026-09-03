# Ücretsiz Materyaller Yönetimi

Bu doküman Web Sitesi Yönetimi içindeki Ücretsiz Materyaller alanı için editör ve
geliştirici sözleşmesini açıklar.

## Editör İş Akışı

Kategoriler ve kartlar veritabanı kayıtlarıdır. Admin ekranı yayında, taslak ve
arşivlenmiş kayıtları birlikte gösterir; public site yalnızca yayınlı ve hedefi
geçerli kartları gösterir.

Temel akış: kategori veya kart oluşturun, kart türünü seçin, hedef/dosya bilgisini
ekleyin, hazırlık rozetini kontrol edin, sonra taslak kaydedin veya yayınlayın.

Readiness rozetleri:

- `Hazır`: yayınlanabilir.
- `Dosya Eksik`: PDF/download kartında dosya veya güvenli indirme URL'si yok.
- `Hedef Eksik`: sayaç, iç rota veya dış bağlantı hedefi eksik/geçersiz.
- `Taslak`: public sitede görünmez.
- `Arşivlenmiş`: Admin'de bulunur, public sitede görünmez.

## Materyal Türleri

- `PDF` / `DOWNLOAD`: Media Library'den doküman seçilmeli veya güvenli HTTPS
  `downloadUrl` girilmelidir. Public kullanıcı aynı-origin download endpoint'ine
  gider; ham dosya URL'si kart üzerinde gösterilmez.
- `INTERNAL_PAGE`: kayıtlı site içi rota seçilir.
- `COUNTDOWN`: yayınlı sayaç sayfası seçilir.
- `EXTERNAL_LINK`: HTTPS URL gerekir.
- `CALCULATOR`, `SIMULATION`, `SYSTEM_TOOL`: yalnızca kayıtlı araç rotası seçilir;
  araç uygulamasının kendisi kart editörüyle silinmez.
- `BLOG` / `GUIDANCE` / `LINK`: güvenli iç rota veya HTTPS hedef kullanılır.

Geçersiz PDF yayın hatası:

```text
Bu materyali yayınlamak için indirilebilir bir dosya eklemelisiniz.
```

Geçersiz sayaç yayın hatası:

```text
Bu materyali yayınlamak için geçerli bir geri sayım sayfası seçmelisiniz.
```

Eksik iç rota yayın hatası:

```text
Bu materyalin site içi hedef sayfası bulunamadı.
```

## Arşiv, Silme ve Geri Yükleme

Arşivleme birincil kaldırma yöntemidir. Arşivlenen kayıt Admin filtresinde görünür
ve geri yüklenebilir. Kalıcı silme yalnızca hedef karta uygulanır, `SİL` onayı
ister, medya dosyasını otomatik silmez ve revizyon kaydı bırakır. Kartı bulunan
kategori silinemez; önce kartlar taşınmalı, arşivlenmeli veya silinmelidir.

Sistem aracı kartını arşivlemek public wrapper'ı gizler. Sayaç, hesaplayıcı veya
simülasyon route dosyaları bu işlemle silinmez.

## Public Davranış

Başarılı public API cevabı otoritatiftir. Boş kategori veya sıfır kategori eski
hardcoded kartları geri getirmez.

Public mesajlar:

- `Bu kategoride şu anda yayında materyal bulunmuyor.`
- `Ücretsiz materyaller hazırlanıyor. Yeni içerikler yakında burada yayınlanacak.`
- `Ücretsiz materyaller şu anda yüklenemiyor. Lütfen kısa süre sonra tekrar deneyin.`

`/ucretsiz-materyaller`, `/ucretsiz-materyaller/pdf-dokumanlar` ve dinamik
`/ucretsiz-materyaller/[slug]` rotası aynı yönetilen kayıtları kullanır.

## Geliştirici Notları

Merkezi resolver `apps/api/src/free-materials/material-destination.ts` içindedir.
Admin publish-readiness validation, public API normalizasyonu, public kart
hedefleri, dinamik route dispatcher, secure download endpoint ve route crawler
aynı hedef sözleşmesine göre çalışır.

Public response `destinationMode`, `href` ve gerekirse `downloadHref` içerir.
Client kartı `downloadHref ?? href` ile tahmin yapmaz; resolved mode'a göre CTA
oluşturur.

Route crawler:

```bash
node scripts/free-material-route-crawler.mjs --web-base-url http://localhost:3000 --api-base-url http://localhost:4000/v1
node scripts/free-material-route-crawler.mjs --web-base-url https://egitimgurmesi.com --api-base-url https://api.egitimgurmesi.com/v1
```

Crawler yıkıcı istek yapmaz; yayınlı iç rotaları ve indirme hedeflerini kontrol
eder. HTTP 500, dosyasız yayınlı download veya attachment başlığı eksikliği hata
sayılır.

## Legacy Uzlaştırma

`20260902120000_reconcile_legacy_free_material_cards` dört eski PDF kartını normal
kayıt haline getirir. `20260903120000_repair_legacy_free_material_pdf_destinations`
dosyası olmayan yayınlı legacy PDF kartlarını taslağa alır ve yanıltıcı sayaç
href'lerini temizler. Migration idempotenttir, custom kayıtları değiştirmez,
arşivlenmiş kayıtları yeniden yayınlamaz ve dosya üretmez.

## Deployment ve Rollback

Production:

```bash
cd /var/www/ega-platform
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm --workspace @ega/db run generate
npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
npm --workspace @ega/db run build
npm --workspace @ega/ui run build
npm --workspace @ega/api run build
npm --workspace @ega/admin run build
npm --workspace @ega/web run build
npm run build
```

Rollback için kod commit'i revert edilir, uygulamalar yeniden derlenir ve PM2
süreçleri yeniden başlatılır. Data-only migration kayıt silmediği için rollback
sırasında manuel veri silme yapılmaz.
