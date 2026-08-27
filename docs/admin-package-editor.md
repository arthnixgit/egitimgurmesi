# Admin paket katalog editoru

Bu dokuman, Egitim Gurmesi global paket katalogunu yoneten Super Admin kullanicilari ve bu alani gelistirecek ekip icin hazirlanmistir.

## Katalog hiyerarsisi

Public katalog iki seviyelidir:

1. Ana kategori
2. Ana kategoriye bagli alt kategori

Paketler normal kosulda alt kategoriye baglanir. Prisma modeli mevcut yapisi ile korunur: `ProductCategory` kok kayitlari ana kategoridir, `parentCategoryId` olan kayitlar alt kategoridir, `Product` kayitlari bir `ProductCategory` ile iliskilidir. Ucuncu kategori seviyesi, ayri kategori tablosu veya serbest metin kategori alani yoktur.

Mevcut public katalog kokleri ve alt kategorileri veritabanindan/public katalogdan turetilir. Uretim kabulunde beklenen aktif harita:

- Online Kocluk: YKS, LGS, 9. ve 10. Siniflar, 11. Sinif, KPSS
- Yuz Yuze Kocluk: YKS, LGS, 9. ve 10. Siniflar, 11. Sinif, KPSS
- Yazili Kampi (Hazirlik): Kamp Icerigi, Hazirlik Takvimi
- Ozel Ders: Online, Yuz Yuze
- Deneme Kulubu: Basili Kargo, Gercek Mekan
- Tekrar Kampi: Tekrar Plani, Basvuru Takvimi

Admin `Kategori Yonetimi` ekrani artik duz kategori listesi gostermez. Once ana kategoriler gosterilir; secilen ana kategori altinda yalniz o kokun alt kategorileri ve bagli paketleri gorunur.

## Hiyerarsi kurallari

Sunucu tarafi dogrulamalari katalog derinligini iki seviyede tutar:

- Ana kategorinin parent'i olmaz.
- Alt kategori tam olarak bir ana kategoriye baglanir.
- Alt kategori baska bir alt kategorinin altina tasinamaz.
- Kategori kendisinin parent'i olamaz.
- Dongu ve ikinci seviyeden derin agac olusturma engellenir.
- Yayindaki paket aktif ana kategori ve aktif alt kategori altinda olmalidir.
- Taslak paket gecici olarak eksik kategoriyle kaydedilebilir.
- Ana kategori, aktif cocuklari veya dogrudan paketleri varken silinemez.
- Alt kategori, paketleri varken silinemez.

API ham Prisma hatalarini dondurmez. Editor hatalari Turkce ve kontrolludur; ornekler: `Yayina almak icin ana kategori ve alt kategori secmelisiniz.`, `Bir alt kategori baska bir alt kategorinin altinda olusturulamaz.`

## Kategori duzenleme

Yeni kategori formunda once `Kategori Turu` secilir:

- `Ana Kategori`: parent secimi gizlenir. Ad, slug, aciklama, sira, aktiflik ve gelismis SEO alanlari duzenlenir.
- `Alt Kategori`: ana kategori secimi zorunludur. Secilen ana kategori ekranda acikca gosterilir. Public filtre/link degeri otomatik turetilir; ham CTA/filter URL yalniz `Gelismis Teknik Ayarlar` altindadir.

Slug ve ID degerleri mevcut kayitlarda korunur. Super Admin bunlari kontrollu form uzerinden bilincli olarak degistirmedikce sistem katalogu yeniden yazmaz.

## Paket kategorilendirme

`Paket Yonetimi` akisinda tek duz kategori secici yerine iki bagimli secici vardir:

1. Ana Kategori
2. Alt Kategori

Ana kategori degistiginde uyumsuz alt kategori temizlenir. Paket kaydi secilen alt kategori kaydina baglanir. Mevcut paket bir ana kategoriye dogrudan bagliysa saklanir ve `Alt kategori atamasi eksik` uyarisi ile onarilabilir; bu halde yayinlama engellenir.

Paket listeleri ana kategori ve alt kategori secimine gore filtrelenir. Editor hiyerarsi yolunu kullanici dostu bicimde gosterir: `Online Kocluk -> YKS -> Paket Adi`.

## Paket editoru

Editor dort is akisini takip eder:

1. `Konum ve Temel Bilgiler`: ana kategori, alt kategori, paket adi, slug, kisa aciklama, paket turu, saglayici ve durum.
2. `Fiyat ve Paket Secenekleri`: varsayilan secenek, fiyat, karsilastirma fiyati, para birimi, taksit bilgisi, SKU ve saglayici kimlikleri.
3. `Kart Icerigi`: medya, kart tonu, ozellik basliklari, aciklamalari ve sirasi.
4. `Onizleme ve Yayin`: gercek public kart onizlemesi, hazirlik listesi, taslak kaydetme, yayinlama, arsivleme ve silme.

SEO, ham medya URL'leri, provider ID'leri, dis variant ID'leri ve ham CTA/filter URL alanlari gelismis bolumlerdedir. PayTR, Unikazan, siparis veya odeme is mantigi bu editor degisikliginden etkilenmez.

## Yetki politikasi

Global paket katalogunu yalniz `auth.isSuperAdmin === true` olan kullanici yonetebilir.

Super Admin su islemleri yapabilir:

- Admin kategori ve paket editor verisini listelemek
- Kategori olusturmak, guncellemek, silmek
- Paket olusturmak, guncellemek, yayinlamak, yayindan almak, arsivlemek, silmek
- Fiyat, variant, ozellik, provider mapping, medya ve kategori hiyerarsisi degistirmek
- Legacy katalog dokumani okumak veya kaydetmek

Branch Admin, Organization Admin, Admin, Instructor, Coach, Accountant, Technician ve custom non-super roller dogrudan ID tahmin ederek de katalog endpoint'lerini kullanamaz. API `403` ile `Paket katalogunu yalnizca Super Admin yonetebilir.` mesajini dondurur ve gizli urun detaylarini aciga cikarmaz.

Siparis yetkileri ayridir. `orders.read` yetkisi olan non-super kullanici `/ticaret` sayfasinda yalniz `Siparis Yonetimi` sekmesini gorur; kategori/paket endpoint'leri fetch edilmez ve 403 staff oturumunu temizlemez.

## RBAC senkronizasyonu

Varsayilan rol tanimlarinda katalog yazma yetkileri yalniz `super-admin` rolunde kalir. Uretimde mevcut rol-permission verisini idempotent bicimde kisitlamak icin:

```bash
npm --workspace @ega/db run rbac:restrict-global-catalog
```

Bu komut:

- non-super sistem rollerinden `products.manage`, `pricing.manage`, `coupons.manage` gibi global katalog yazma izinlerini kaldirir;
- `super-admin` rolundeki katalog izinlerini korur;
- kullanici, rol atamasi veya ilgisiz izinleri silmez;
- birden fazla kez calistirilabilir.

Tam seed calistirmayin; `npm run db:seed` uretimde kullanilmaz.

## Yayin hazirligi

`Yayinla` islemi taslak kaydetmeden ayridir ve su kontrolleri gecmeden public gorunurluk vermez:

- Paket adi ve gecerli benzersiz slug
- Aktif ana kategori ve aktif alt kategori
- Alt kategorinin secilen ana kategoriye ait olmasi
- Gecerli yayin durumu ve provider
- En az bir aktif variant
- Tam olarak bir aktif varsayilan variant
- Gecerli fiyat, para birimi ve karsilastirma fiyati
- Taksit aciksa taksit sayisi
- Gerekli SKU ve provider mapping degerleri
- UNIKAZAN icin dis urun/variant baglantilari
- LOCAL icin yerel checkout variant'i
- Kart tonu: `blue`, `teal`, `amber`
- Gecerli medya URL'leri ve tutarli video kaynagi
- Sirali, normalize edilmis, yinelenmeyen ozellikler

Hazirlik listesi Turkce gorunur: `Kategori hazir`, `Alt kategori hazir`, `Fiyat hazir`, `Varsayilan secenek hazir`, `Kart metni hazir`, `Medya hazir`, `Saglayici baglantisi hazir`, `Yayina hazir`.

## Public kart ve onizleme

Public kart tasarimi sistem sozlesmesidir. `.ega-pack-card`, fiyatlar, taksit etiketi, baslik, kisa aciklama, intro video/poster, ozellik listesi, mobil `Tum ozellikleri gor`, `Incele` ve `Satin Al` aksiyonlari korunur.

Admin onizleme `@ega/ui` icindeki ortak `PackageCard` sunum bilesenini kullanir. Onizleme yayinlama yapmaz, siparis veya checkout baslatmaz; aksiyonlar gorsel olarak kalir fakat preview modda etkisizdir. Desktop ve mobil kart genisligi anahtarlari editor degisikligine aninda tepki verir.

Editor serbest HTML, CSS veya layout sablonu almaz. Kontrollu veri mevcut public kart alanlarini doldurur.

## Kart icerigi guvenligi

Public kart CSS'i mevcut tasarimi koruyarak uzun icerige karsi sertlestirildi:

- `min-width: 0`
- normal kelime kirma
- kontrollu satir davranisi
- sabit medya oranlari
- tutarli aksiyon alani
- yatay overflow engeli

Editor, kart kalitesini dusurebilecek iceriklerde uyarir:

- `Paket basligi kart gorunumu icin uzun olabilir.`
- `Kisa aciklama kart yuksekligini artirabilir.`
- `Cok sayida ozellik kartlar arasinda yukseklik farki olusturabilir.`

Detay sayfasi, kartta kontrollu gorunen uzun icerigin tam metnini gostermeye devam edebilir.

## Kaydetme, yayinlama, arsivleme ve silme

Islemler ayridir:

- `Taslagi Kaydet`: eksik paketi guvenle saklar, public yapmaz.
- `Onizle`: ortak public kart bileseniyle editor verisini gosterir.
- `Yayinla`: yayin hazirligi dogrulamasini calistirir ve paketi public yapar.
- `Arsivle`: public gorunurlugu kaldirir, gecmisi korur.
- `Sil`: siparis, kayit veya bagimli gecmis yoksa ve typed confirmation girilirse kullanilir.

Gecmisi olan paketlerde silme engellenir; arsivleme onerilir. Kategori silmede paketler otomatik tasinmaz ve cascade-delete yapilmaz. Gerektiginde editor once paketleri baska alt kategoriye bilincli olarak tasir.

## Guvenli editor proseduru

1. Once ana kategori agacini kontrol edin.
2. Alt kategori yoksa ana kategori altinda olusturun.
3. Paketi taslak olarak kaydedin.
4. Fiyat, varsayilan variant, provider mapping ve kart icerigini doldurun.
5. Onizlemeyi desktop ve mobil modda kontrol edin.
6. Hazirlik listesinde kritik maddeler tamamlanmadan yayinlamayin.
7. Paket artik satilmamaliysa silmek yerine arsivleyin.

Kaydedilmemis degisiklik varken kategori, paket veya sekme degistirme ve sayfadan cikma islemleri uyari verir. Kayit sirasinda tekrar gonderim devre disidir ve API hatasi formu temizlemez.

## Uretim dagitim proseduru

Normal dagitimde destructive seed veya migrate dev kullanilmaz. Guvenli akis:

```bash
cd /var/www/ega-platform
git fetch origin main
git checkout main
git pull --ff-only origin main
set -a
source .env.production
set +a
npm ci
npm --workspace @ega/db run generate
npm --workspace @ega/db exec prisma migrate deploy --schema packages/db/prisma/schema.prisma
npm --workspace @ega/db run rbac:restrict-global-catalog
npm --workspace @ega/db run build
npm --workspace @ega/api run build
npm --workspace @ega/admin run build
npm --workspace @ega/web run build
npm run build
pm2 reload egitim-gurmesi-api --update-env
pm2 reload egitim-gurmesi-web --update-env
pm2 reload egitim-gurmesi-admin --update-env
pm2 status
```

Bu degisiklik Prisma schema migration gerektirmez; mevcut migration deploy komutu yalniz bekleyen onayli migration'lari uygular.

## Smoke check

Dagitimdan sonra kontrol edin:

- Public: `/paketlerimiz`, ana kategori filtresi, alt kategori filtresi, paket detay sayfasi, checkout sayfasi
- Admin Super Admin: `/ticaret` icinde `Kategori Yonetimi`, `Paket Yonetimi`, `Siparis Yonetimi`
- Admin non-super `orders.read`: yalniz `Siparis Yonetimi`
- API: non-super katalog endpoint'lerine dogrudan istek `403` dondurur
- Siparis, PayTR callback, Unikazan redirect ve payment confirmation akislarinda regresyon yoktur

## Sorun giderme

- Non-super kullanici katalog sekmesi goruyorsa staff auth payload'indaki `isSuperAdmin` ve rol senkronizasyonunu kontrol edin.
- Branch/Admin rolde katalog yazma izni kaldiysa `npm --workspace @ega/db run rbac:restrict-global-catalog` komutunu tekrar calistirin.
- Paket public gorunmuyorsa status, aktif variant, aktif ana kategori, aktif alt kategori ve provider mapping degerlerini kontrol edin.
- Root kategori silinemiyorsa once alt kategorileri ve dogrudan bagli paketleri baska guvenli hedefe tasiyin.
- Alt kategori silinemiyorsa bagli paketleri baska alt kategoriye bilincli olarak atayin.
- Kart onizlemesi public karttan farkli gorunuyorsa `@ega/ui` `PackageCard` ve public `.ega-pack-card` CSS degisikliklerini birlikte inceleyin.
