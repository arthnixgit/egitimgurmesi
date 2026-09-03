# Web Sitesi Yönetimi

Bu doküman Web Sitesi Yönetimi ekranını kullanan editörler ve bu altyapıyı
geliştirecek ekip üyeleri içindir. Web sitesi tek bir global yayındır; şube
bazlı ayrı kopyalar yoktur.

## Editör Kullanımı

Admin panelinde **Web Sitesi > Web Sitesi Yönetimi** menüsünü açın. Eski
`/icerik` adresi aynı alana yönlendirilir.

Şube yöneticileri şu uyarıyı kalıcı olarak görür:

> Bu alanda yapılan değişiklikler tüm genel web sitesini etkiler.

Ana alanlar:

- **Genel Ayarlar:** site adı, SEO başlığı ve açıklaması, telefon, WhatsApp,
  adres ve e-posta.
- **Logo ve Marka:** header/footer logo adresleri, alternatif logo metni ve
  sosyal paylaşım görseli.
- **Header ve Menü:** genel navigasyon bağlantıları.
- **Footer ve İletişim:** marka açıklaması, hızlı erişim linkleri, iletişim
  kartı ve sosyal linkler.
- **Sayfalar:** sabit pazarlama sayfalarının başlık, özet ve bölüm içerikleri.
- **Ücretsiz Materyaller:** kategori, kart, PDF/doküman, link, sayaç,
  hesaplayıcı ve sistem aracı kartları.
- **Akademik Kadro / Başarı Hikayeleri:** ilgili genel içerik grupları.
- **Taslaklar ve Geçmiş:** kaydedilen taslak, yayın ve geri yükleme kayıtları.

## Görsel Editör Düzeni

Yeni Web Sitesi Yönetimi ekranı üç çalışma alanından oluşur:

- **Sol panel:** Sayfalar, Bölümler ve Bileşenler modları. Sayfalar modunda global
  alanlar, public sayfalar, Ana Sayfa Sliderı kısayolu ve kilitli sistem rotaları
  görünür. Bölümler modunda seçili sayfanın bölüm sırası, görünürlük durumu,
  yukarı/aşağı taşıma ve seçme işlemleri vardır. Bileşenler modunda yalnızca
  gerçekten eklenebilen widget kartları aktiftir; kilitli dinamik modüller neden
  eklenemediğini açıklar.
- **Orta canvas:** gerçek public sunum bileşenlerini editör çerçeveleriyle gösterir.
  Bölümün üzerine gelince çerçeve görünür; tıklayınca bölüm seçilir. Başlık ve metin
  alanları güvenli inline düzenlemeyle değiştirilebilir. Görsel alanları medya
  seçimine, buton alanları sağ paneldeki bağlantı ayarlarına yönlendirir.
- **Sağ panel:** İçerik, Tasarım ve Gelişmiş sekmeleri. Editörler için başlık,
  açıklama, görsel, buton, renk tonu ve hizalama gibi alanlar öne alınır; ham payload,
  sistem anahtarı ve teknik URL bilgileri yalnızca Gelişmiş altında tutulur.

Üst toolbar sayfa seçici, durum rozeti, bölüm kırılımı, Undo/Redo, Desktop/Tablet/Mobil
önizleme, zoom, Taslağı Kaydet, Önizle, Yayınla, Geçmiş ve Canlı Sayfa işlemlerini
tek bağlamda gösterir. `Ctrl/Cmd + S` taslak kaydeder, `Ctrl/Cmd + Z` geri alır,
`Ctrl/Cmd + Shift + Z` veya `Ctrl/Cmd + Y` ileri alır, Escape inline düzenlemeyi
kapatır.

## Medya Alanları

Logo, slider görseli, sayfa görseli, doküman, video ve poster seçimleri tek ortak
`MediaField` kontrolüyle yapılır. Bu kontrol Dosya Yükle, Medya Kütüphanesinden Seç,
Değiştir, Kaldır, Önizle ve güvenli varsayılan varsa Varsayılana Dön işlemlerini
sunar.

Medya Kütüphanesi yalnızca seçim penceresi açıldığında yüklenir. Arama, tür filtresi,
son varlıklar, seçili varlık göstergesi, dosya adı, MIME etiketi, boyut ve alt metin
bilgisi aynı kontrol üzerinden yönetilir. Harici medya URL girişi yalnızca Gelişmiş
teknik bölümünde tutulur.

## Ana Sayfa Sliderı

Ana Sayfa Sliderı genel sayfa payload'ı içinde saklanmaya devam eder, ancak ayrı bir
editörle yönetilir. Sol panelde **Ana Sayfa Sliderı** kısayolu ve Sayfalar > Ana Sayfa
> Hero / Slider bölümü aynı editörü açar.

Slide listesi küçük önizleme, sıra, etiket, medya türü, ton ve aktif/pasif bilgisini
gösterir. Editör üst etiket, başlık, açıklama, Primary/Secondary CTA, aktif/pasif
durumu, desktop medya, opsiyonel mobil medya, video posteri, alt metin, ton, autoplay,
süre, geçiş tipi, hover duraklatma, oklar, noktalar, klavye ve dokunmatik gezinme
alanlarını destekler.

Yayına almadan önce en az bir aktif slide, benzersiz slide ID, başlık, güvenli CTA
hedefi, güvenli medya hedefi ve gerektiğinde alt metin doğrulanır. Admin canvas pasif
slide'ı düzenleme amacıyla gösterebilir; public homepage yalnızca aktif slide'ları
yayınlar.

Üst araç çubuğunda:

- **Taslağı Kaydet:** değişikliği canlı siteye yansıtmadan saklar.
- **Önizleme:** mevcut yerel taslak durumunu gerçek site bileşenleriyle gösterir.
- **Yayınla:** içerik doğrulamasını çalıştırır, yeni revizyon oluşturur ve ilgili
  public rotaları yeniler.
- **Geri Al / İleri Al:** düzenleme oturumundaki güvenli işlem geçmişi içindir.
- **Geçmiş:** revizyon listesini açar.
- **Canlı Sayfa:** public rotayı açar.

Bir alan veya sayfa değiştirilirken kaydedilmemiş değişiklik varsa uyarı
gösterilir. Kaydetme sırasında düğmeler tekrar gönderime kapatılır; API hatası
alınırsa form içeriği korunur.

## Telefon ve WhatsApp

Geçerli public telefon değeri:

- Görünen telefon: `+90 531 855 38 27`
- E.164 telefon: `+905318553827`
- Telefon linki: `tel:+905318553827`
- WhatsApp numarası: `905318553827`
- WhatsApp linki: `https://wa.me/905318553827?text=...`

WhatsApp mesajı sistemde encode edilir. `wa.me` numarası artı işareti, boşluk
veya noktalama içermez. Geçersiz telefon formatları Türkçe doğrulama hatasıyla
reddedilir.

## Footer

Public site tek ortak footer bileşenini kullanır. Masaüstü sıralaması:

1. Marka ve logo
2. Hızlı Erişim
3. İletişim

Zorunlu hızlı erişim linkleri korunur:

- `/paketlerimiz`
- `/ucretsiz-materyaller`
- `/hakkimizda`
- `/giris`

Mobilde sıra aynı kalır ve kolonlar alt alta iner.

## Ücretsiz Materyaller

Ücretsiz Materyaller editörü üç bölümlüdür: sol ağaç, orta önizleme, sağ ayar
paneli. Kategori ve kartlar oluşturulabilir, çoğaltılabilir, sıralanabilir,
aktif/pasif yapılabilir, taslak kaydedilebilir ve yayınlanabilir.

Desteklenen kart türleri:

- `DOWNLOAD`
- `PDF`
- `INTERNAL_PAGE`
- `EXTERNAL_LINK`
- `COUNTDOWN`
- `CALCULATOR`
- `BLOG`
- `SIMULATION`
- `SYSTEM_TOOL`

İndirilebilir içerikte ziyaretçi ham URL görmez. Public kart dosya ikonunu,
başlığı, özeti, dosya bilgisini ve erişilebilir indirme aksiyonunu gösterir:
`{Doküman başlığı} dosyasını indir`.

Cross-origin dosyalar için public indirme endpoint'i kullanılır:

```text
GET /v1/public/free-materials/:itemId/download
```

Endpoint yalnızca aktif/yayındaki indirilebilir materyalleri çözer, HTTPS URL
zorunlu tutar, `javascript:`, `data:`, `file:`, localhost, özel IP ve iç ağ
hedeflerini reddeder, dosya adını temizler ve `Content-Disposition: attachment`
başlığı döner.

Route crawler read-only doğrulama için kullanılabilir:

```bash
node scripts/free-material-route-crawler.mjs --web-base-url http://localhost:3000 --api-base-url http://localhost:4000/v1
node scripts/free-material-route-crawler.mjs --web-base-url https://egitimgurmesi.com --api-base-url https://api.egitimgurmesi.com/v1
```

Crawler public free-material API'deki her yayınlı kartı çözer, iç rotaları ve
indirme hedeflerini test eder, HTTP 500 veya dosyasız yayınlı download bulursa
non-zero çıkar.

## Geliştirici Mimarisi

Admin içerik API'si `admin-content` modülünde tutulur. Read işlemleri
`website.read`, write işlemleri `website.manage`, publish işlemleri
`website.publish` izni ister. Servis katmanı da aynı politikayı uygular.

Varsayılan rol politikası:

- `super-admin`: `website.read`, `website.manage`, `website.publish`
- `branch-admin`: `website.read`, `website.manage`, `website.publish`
- diğer sistem rolleri: website yetkisi yok

RBAC senkronizasyon komutu idempotenttir ve kullanıcıları ya da ilgisiz rol
atamalarını değiştirmez:

```bash
npm --workspace @ega/db run rbac:enable-website-editor
```

Global site ayarları `SiteSetting` modelinde tutulur. İçerik revizyonları
`WebsiteContentRevision` modelinde saklanır. Revizyon kaydı aktör, rol, şube
bağlamı, hedef içerik, aksiyon, önceki/sonraki durum ve zaman bilgisini içerir.

Yayınlama hedefli revalidation metadatası üretir:

- site ayarları ve footer: public layout kullanan sayfalar
- ana sayfa: `/`
- ücretsiz materyaller: `/ucretsiz-materyaller` ve ilgili alt rotalar
- navigasyon: menüyü kullanan public sayfalar

Preview token'ı HMAC ile imzalanır, kısa ömürlüdür ve yalnızca yetkili staff
oturumu için kullanılır. Preview checkout, sipariş veya form gönderimi
başlatmaz.

### Builder Bileşenleri

`apps/admin/app/web-sitesi/website-builder-client.tsx` yalnızca oturum, yetki,
veri yükleme, seçili alan, dirty state, Undo/Redo, kaydetme, yayınlama, preview token
ve revizyon restore orkestrasyonunu tutar.

Görsel editör şu modüllere ayrılmıştır:

- `components/website-builder-shell.tsx`: üç panelli ana kabuk.
- `components/builder-toolbar.tsx`: sticky toolbar ve klavye kısayolu hedefleri.
- `components/builder-left-panel.tsx`: Sayfalar/Bölümler/Bileşenler paneli.
- `components/builder-canvas.tsx`: gerçek public sunum bileşenleriyle canvas.
- `components/editable-section-frame.tsx`: seçme, toolbar, inline text editing.
- `components/builder-inspector.tsx`: İçerik/Tasarım/Gelişmiş denetçi sekmeleri.
- `components/media-field.tsx` ve `media-picker-dialog.tsx`: upload ve medya seçimi.
- `components/homepage-slider-editor.tsx`: siteye özel slider editörü.
- `components/free-material-editor.tsx`: yapılandırılmış ücretsiz materyal düzenleyici.
- `components/revision-panel.tsx`: revizyon yükleme ve restore işlemleri.

Destek kütüphaneleri:

- `lib/widget-registry.ts`: typed widget tanımları, yerleşim uygunluğu ve safe default
  section üretimi.
- `lib/section-registry.ts`: public bölüm davranışı, kilitli rota envanteri, slider
  payload normalizasyonu ve section çoğaltma/sıralama.
- `lib/builder-history.ts`: undo/redo snapshot geçmişi.
- `lib/builder-validation.ts`: slider ve güvenli link doğrulamaları.
- `lib/builder-media.ts`: istemci tarafı upload ön doğrulaması ve medya etiketleri.

### Public Renderer Ayrımı

Ana sayfa slider sunumu `packages/ui/src/home-showcase.tsx` içindeki saf
`HomeShowcaseHero` bileşenidir. Public homepage ve Admin canvas aynı bileşeni kullanır.
Admin canvas `disableActions` ile CTA tıklamalarını pasifleştirir ve
`includeInactiveSlides` ile pasif slide'ları yalnızca düzenleme amacıyla gösterebilir.
Public site bu bayrakları kullanmaz ve yalnızca aktif slide'ları yayınlar.

### Payload Uyumluluğu ve Performans

Yeni editör mevcut `SiteSetting`, `MarketingPage`, `MarketingPageSection`,
`MediaAsset`, ücretsiz materyal, akademik kadro, başarı hikayesi ve revizyon verilerini
kullanır. Bilinmeyen section payload alanları korunur; slider yazma işlemi mevcut
payload'ı spread ederek yalnızca `slides` ve `settings` alanlarını günceller.

Medya listesi ilk render'da çekilmez. Preview yerel draft state ile güncellenir;
klavye ile yazmak API isteği üretmez. Save/Publish butonları işlem sırasında tekrar
gönderime kapatılır. Responsive mod değiştirmek içerik refetch'i yapmaz.

## Paket Editörü Sözleşmesi

Admin commerce read modelleri response-only alanlar içerebilir. Save istekleri
asla `{ ...product }` veya `{ ...category }` ile kurulmaz. Kullanılan explicit
serializer'lar yalnızca DTO tarafından kabul edilen alanları gönderir ve şu
metadata alanlarını dışarıda bırakır:

- kategori/ürün türetilmiş adları
- root kategori bilgileri
- aktiflik türevleri
- sayaçlar
- readiness/preview/audit metadata
- response id/version alanları

Strict whitelist validation açık kalır. Legacy olarak ana kategoriye atanmış
paket taslak olarak tamir edilebilir, ancak alt kategori seçilmeden yayınlanamaz.
Sipariş veya kayıt geçmişi olan paket silinemez; arşivleme önerilir.

## Migration ve Backfill

Bu çalışma şema değişikliği içermez. İlk data-only legacy materyal uzlaştırması
dört eski PDF kartını yönetilebilir `FreeMaterialItem` kayıtlarına dönüştürür:

- `TYT Çalışma Planı PDF` -> `tyt-calisma-plani-pdf`
- `AYT Tekrar Çizelgesi PDF` -> `ayt-tekrar-cizelgesi-pdf`
- `Deneme Analiz Formu PDF` -> `deneme-analiz-formu-pdf`
- `Hedef Takip Sayfası PDF` -> `hedef-takip-sayfasi-pdf`

Ardından eklenen `20260903120000_repair_legacy_free_material_pdf_destinations`
data-only migration'ı, bu dört karttan dosya bağlantısı bulunmayan ve hâlâ
yayında olan `PDF` kayıtlarını güvenli taslağa çeker. Kayıtlar silinmez, custom
içerik değişmez, arşivlenmiş içerik yeniden aktif edilmez ve sahte PDF dosyası
üretilmez. Dosyası bulunan kayıt yayın durumunu koruyabilir; dosyası olmayan PDF
kartı Admin'de `Dosya Eksik` olarak kalır ve dosya eklenmeden yayınlanamaz.
Production'da yalnızca `migrate deploy` çalıştırılmalıdır.

## Logo Yayın Mimarisi

Public site ayarları tek yetkili snapshot olarak root layout içinde server-side
yüklenir. İlk HTML ve ilk client render aynı `PublicSiteSettingsProvider`
değerini kullanır. Header, footer, WhatsApp/kontakt kontrolleri ve sayfa içi
global marka yüzeyleri ayrı ayrı API çağrısı yapmaz. Client refresh gerekirse son
geçerli snapshot korunur; bozuk, eksik veya stale cevap geçerli logoyu boşaltmaz.

Logo alanlarının tüketicileri:

- `logoPrimaryUrl`: masaüstü public header ve normal açık header bağlamları.
- `logoCompactUrl`: mobil/dar public header logosu.
- `logoFooterUrl`: yalnızca ortak public footer marka logosu.
- `logoMarkUrl`: standalone marka işareti kullanılan başarı/koçluk gibi mark yüzeyleri.
- `logoDarkUrl`: açık yüzeylerde kullanılacak koyu logo varyantı.
- `logoLightUrl`: koyu veya gradient yüzeylerde kullanılacak açık logo varyantı.
- `faviconUrl`: favicon ve desteklenen application/apple icon metadata.
- `defaultSocialImageUrl`: Open Graph ve Twitter varsayılan paylaşım görseli.
- `logoAltText`: anlamlı logo görsellerinin erişilebilir alternatif metni.

Medya yüklemek canlı siteyi değiştirmez. Yaşam döngüsü: görsel yükle/seç, Admin
draft state güncellenir, değişiklik kirli olur, Taslağı Kaydet ile revizyon
saklanır, Önizleme taslakla yapılır, Yayınla ile public ayar versiyonu artar ve
layout/metadata revalidation metadata'sı döner. Admin'deki **Bu görseli tüm logo
alanlarında kullan** aksiyonu yalnızca açık tıklamayla uyumlu logo alanlarına
kopyalar; favicon veya sosyal paylaşım görselini sessizce değiştirmez.

Favicon değişiklikleri yayınlandıktan ve revalidation tamamlandıktan sonra bile
tarayıcı sekmesi önbelleği nedeniyle gecikmeli görünebilir. Yeni gizli pencere,
hard refresh veya doğrudan favicon URL kontrolü gerçek yayın durumunu doğrulamak
için daha güvenilirdir.

## Ücretsiz Materyal Kaynağı

Ücretsiz materyallerde veritabanı kayıtları tek yetkili kaynaktır. Public API 200
döndüyse boş kategori veya sıfır kategori bilinçli boş durum sayılır; web eski
hardcoded kartları geri koymaz. Public boş durum metinleri:

- Kategoride yayınlı kart yok: `Bu kategoride şu anda yayında materyal bulunmuyor.`
- Hiç yayınlı materyal yok: `Ücretsiz materyaller hazırlanıyor. Yeni içerikler yakında burada yayınlanacak.`
- API geçici olarak yüklenemiyor: `Ücretsiz materyaller şu anda yüklenemiyor. Lütfen kısa süre sonra tekrar deneyin.`

Admin read, yetkili editörler için yayında, taslak ve arşivlenmiş kategori/kartları
döndürür. Public endpoint yalnızca aktif/yayında kayıtları döndürür. Ana dizin,
PDF dokümanları, faydalı linkler, blog ve sayaç sayfaları aynı yönetilen kayıtları
kullanır; kart arşivlenir veya silinirse tüm public konumlardan çıkar, geri
yüklenirse kategori/sıra düzenine göre geri döner.

Kart hedefleri merkezi `apps/api/src/free-materials/material-destination.ts`
resolver'ı ile çözülür. `PDF` ve `DOWNLOAD` için geçerli bir `MediaAsset` veya
güvenli HTTPS `downloadUrl` gerekir ve public hedef her zaman aynı-origin indirme
endpoint'idir. `COUNTDOWN` için geçerli sayaç sayfası, `INTERNAL_PAGE` için kayıtlı
site içi rota, `EXTERNAL_LINK` için HTTPS URL gerekir. Public kart artık
`downloadHref ?? href` gibi gevşek seçim yapmaz; `destinationMode` ve doğrulanmış
hedef kullanılır. Geçersiz yayınlı kayıt public API'de atlanır ve server logunda
item ID, slug, tür, rota ve hata kategorisiyle izlenir.

`/ucretsiz-materyaller/[slug]` rotası önce yönetilen materyali, sonra kayıtlı
sayaç sayfasını çözer. PDF kart sayaç sayfası gibi render edilmez; bilinmeyen slug
404'e, geçici API arızası kontrollü kullanılabilirlik durumuna gider. Route-level
`error.tsx` ve `not-found.tsx` kullanıcıya Türkçe güvenli mesaj gösterir, stack
trace yalnızca server logunda kalır.

Arşivleme birincil kaldırma yöntemidir. Kalıcı silme yalnızca açık `SİL` onayıyla
ve hedef kart/kategori kimliği üzerinden yapılır. Kartı olan kategori silinemez;
önce kartlar taşınmalı, arşivlenmeli veya silinmelidir. Sistem/dinamik araç
kartları arşivlenerek gizlenebilir, ancak sayaç, puan hesaplama veya simülasyon
route/logic dosyaları generic kart silme işlemiyle yok edilmez.

Her create/update/publish/archive/restore/delete aksiyonu `WebsiteContentRevision`
kaydına önce/sonra durumuyla yazılır. Silinen kart, revizyon içeriği teknik olarak
yeterliyse revizyondan geri yüklenebilir; restore yeni bir aksiyon olarak yazılır
ama restore işlemini sonsuz revizyon döngüsüne sokmaz.

## Deployment

VPS dizini:

```bash
cd /var/www/ega-platform
git fetch origin main
git checkout main
git pull --ff-only origin main
npm ci
npm --workspace @ega/db run generate
npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
npm --workspace @ega/db run rbac:enable-website-editor
npm --workspace @ega/db run build
npm --workspace @ega/ui run build
npm --workspace @ega/api run build
npm --workspace @ega/admin run build
npm --workspace @ega/web run build
```

Ardından PM2 süreçleri proje ortamında kullanılan gerçek adlarla yeniden
başlatılmalıdır. Bu repoda beklenen süreç adları final deployment notunda
doğrulanır.

## Sorun Giderme

- Branch Admin editör görmüyorsa `rbac:enable-website-editor` komutunu yeniden
  çalıştırın ve kullanıcının sistem rolünü kontrol edin.
- Telefon/WhatsApp public sitede eski görünüyorsa site ayarlarını yayınlayın ve
  public layout revalidation durumunu kontrol edin.
- Download 403/404 dönüyorsa materyalin aktif/yayında olduğundan ve hedef URL'nin
  güvenli HTTPS public adres olduğundan emin olun.
- Stale-write 409 hatasında içerik başka kullanıcı tarafından güncellenmiştir;
  son sürüm yenilenip değişiklikler karşılaştırılmalıdır.
- Paket kaydında DTO metadata hatası görülürse Admin serializer testleri
  çalıştırılmalı ve response-only alanların write payload'a sızmadığı
  doğrulanmalıdır.

## Rollback

Kod rollback'i için ilgili commit revert edilir, uygulamalar yeniden derlenir ve
PM2 yeniden başlatılır. Migration additive olduğu için rollback sırasında veri
silmeyin; yeni kolonlar ve revizyon tablosu pasif kalabilir.
