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

Bu çalışma additive Prisma migration içerir. Var olan public içerik silinmez;
site ayarları güvenli fallback değerleriyle ve düzeltilmiş telefon/WhatsApp
formatıyla backfill edilir. Production'da yalnızca `migrate deploy`
çalıştırılmalıdır.

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
