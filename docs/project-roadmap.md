# Eğitim Gurmesi Akademi - Proje Yol Haritası

## Proje Tanımı

Eğitim Gurmesi Akademi, lise öğrencilerine ve sınav hazırlık öğrencilerine yönelik:

1. Kayıtlı eğitim video paketleri satan
2. Koçluk paketleri sunan
3. Kendi kullanıcı sistemi, kendi ödeme altyapısı, kendi LMS alanı ve kendi yönetim paneli olan
4. Yalnızca koçluk ödemelerinde Unikazan'a yönlendirme yapan
5. Tamamen Türkçe çalışan

bir eğitim platformu olarak kurgulanacaktır.

## Kesin Mimari Sınırlar

1. Ana platformun sahibi bizim sistemimiz olacaktır.
2. Kullanıcı kaydı, giriş, profil, sipariş, yetki, içerik erişimi ve raporlama bizim veritabanımızda tutulacaktır.
3. Unikazan entegrasyonu sadece koçluk paketi ödeme yönlendirmesi için kullanılacaktır.
4. Admin paneli kullanıcı alanından ayrı domain veya subdomain üzerinde çalışacaktır.
5. Tüm hassas entegrasyonlar yalnızca server-side yapılacaktır.
6. Arayüz ve içerik dili yalnızca Türkçe olacaktır.

## Seçilen Marka Varlığı

Projede kullanılacak örnek logo bu konuma kopyalanmıştır:

`assets/branding/ega-logo-primary.png`

Kaynak dosya korunmuştur:

`Logos/Logo Alt 4.png`

## Önerilen Teknik Kurgu

1. Monorepo yapı
2. `apps/web` - genel kullanıcı sitesi ve öğrenci alanı
3. `apps/admin` - ayrı admin paneli
4. `apps/api` - ortak backend servisleri
5. `packages/ui` - ortak tasarım bileşenleri
6. `packages/db` - veritabanı şeması ve erişim katmanı
7. `PostgreSQL` - ana veritabanı
8. `Prisma` veya eşdeğer ORM - şema disiplini için
9. `Redis` - oturum, rate limit, kuyruk ve cache için
10. S3 uyumlu obje depolama - görseller, dökümanlar, sertifikalar ve varlıklar için
11. Video sağlayıcı - Mux, Vimeo OTT veya erişim kontrollü eşdeğer çözüm
12. Hata ve olay izleme - Sentry, log toplama ve audit kayıtları

## Faz 0 - Kapsamı Kilitleme

Amaç:
Projenin ticari ve teknik sınırlarını netleştirmek.

Çıktılar:
1. Paket tiplerinin kesin listesi
2. Video paketi, koçluk paketi ve karma paket tanımları
3. Kendi ödeme sağlayıcımızın seçimi
4. Unikazan ile sadece koçluk ödeme entegrasyonu sınırının yazılı onayı
5. Admin rol dağılımının kesin matrisi
6. Hukuki sayfalar için metin ihtiyaç listesi
7. Domain ve alt domain planı

Karar verilmesi gereken başlıklar:
1. Kayıtlı videolar nerede barındırılacak
2. Canlı ders veya birebir görüşme planlanacak mı
3. Kampanya, kupon ve referans sistemi ilk versiyonda olacak mı
4. Fatura ve muhasebe akışı içeride mi dışarıda mı yönetilecek

## Faz 1 - Marka ve Deneyim Çerçevesi

Amaç:
Unikazan referansındaki enerjiye yakın, ama Eğitim Gurmesi Akademi'ye ait özgün bir arayüz kimliği üretmek.

Çıktılar:
1. Renk sistemi
2. Tipografi sistemi
3. Buton, kart, rozet ve tablo dili
4. Ana sayfa bölüm sırası
5. Paket listeleme düzeni
6. Paket detay sayfası yapısı
7. Öğrenci paneli tasarım dili
8. Admin paneli bilgi mimarisi

Zorunlu tasarım ilkeleri:
1. Mobil öncelikli yaklaşım
2. Turkuaz ve lacivert tabanlı marka hissi
3. Güven veren ama sıradan olmayan eğitim ürünü dili
4. Satış odaklı ama bilgi yoğun olmayan açılış sayfası
5. WhatsApp erişiminin görünür olması

## Faz 2 - Teknik Temel ve Repo Kurulumu

Amaç:
Geliştirme ortamını, klasör yapısını ve dağıtım iskeletini kurmak.

Adımlar:
1. Monorepo oluştur
2. `web`, `admin` ve `api` uygulamalarını aç
3. Ortak lint, format ve TypeScript kurallarını tanımla
4. Ortak environment yönetimini kur
5. Local development docker servislerini hazırla
6. CI temelini kur
7. Staging ve production ortam ayrımını kur

Teslimler:
1. Çalışan başlangıç repo yapısı
2. Ortak config paketleri
3. Branch ve deployment stratejisi
4. Secret yönetim standardı

## Faz 3 - Veritabanı Tasarımı

Amaç:
Temiz ve büyüyebilir bir veri modeli oluşturmak.

İlk çekirdek tablolar:
1. users
2. user_profiles
3. student_profiles
4. staff_users
5. roles
6. permissions
7. role_permissions
8. staff_role_assignments
9. products
10. product_categories
11. product_variants
12. pricing_rules
13. coupons
14. orders
15. order_items
16. payments
17. payment_attempts
18. external_provider_orders
19. enrollments
20. course_modules
21. lessons
22. video_assets
23. downloads
24. whatsapp_leads
25. cms_pages
26. cms_sections
27. banners
28. testimonials
29. faq_items
30. audit_logs

Temel model kuralları:
1. Bizim sistemimiz her sipariş için tekil iç sipariş numarası üretir
2. Unikazan yönlendirmeleri `external_provider_orders` içinde tutulur
3. Koçluk ürünleri `provider = unikazan` mantığıyla işaretlenir
4. Video ürünleri ve erişimler tamamen bizim LMS yapımıza bağlı olur
5. Tüm kritik admin işlemleri audit log yazar

## Faz 4 - Kimlik Doğrulama ve Yetki Sistemi

Amaç:
Kullanıcı ve personel alanlarını güvenli biçimde ayırmak.

Adımlar:
1. Kullanıcı kayıt ve giriş akışını kur
2. Email doğrulama ve şifre sıfırlama akışını kur
3. Ayrı admin giriş ekranını kur
4. Personel oturumlarını kullanıcı oturumlarından ayır
5. Rol bazlı yetki katmanını kur
6. Rate limit, brute force koruması ve oturum güvenliğini ekle

Başlangıç rol çatısı:
1. super-admin
2. admin
3. accounting
4. technician

Not:
Bu rollerin ekran ve işlem bazlı yetki matrisi ayrıca netleştirilecektir.

## Faz 5 - Genel Kullanıcı Sitesi

Amaç:
Satış odaklı kamuya açık web sitesini tamamlamak.

Temel sayfalar:
1. Ana sayfa
2. Paketler
3. Paket detay sayfaları
4. Hakkımızda
5. Sık sorulan sorular
6. Başarı hikayeleri
7. İletişim
8. Giriş
9. Kayıt
10. Şifremi unuttum

Ana sayfa bölümleri:
1. Hero alanı
2. Güven ve sonuç odaklı kısa değer önerileri
3. Öne çıkan paketler
4. Koçluk ve video ürün ayrımı
5. Eğitim yaklaşımı
6. Başarı yorumları
7. Sık sorulan sorular
8. WhatsApp çağrısı
9. SEO metin alanları

## Faz 6 - Ürün, Sepet ve Sipariş Motoru

Amaç:
Kendi satış altyapımızı kurmak.

Adımlar:
1. Ürün modeli ve listeleme akışını bağla
2. Paket detayında satın alma senaryolarını tanımla
3. Sepet altyapısını kur
4. Kupon ve fiyat kırılımı mantığını yaz
5. Kendi ödeme sağlayıcımız için checkout akışını kur
6. Sipariş durum makinesini oluştur
7. Başarılı, başarısız ve bekleyen ödeme ekranlarını üret

Sipariş durumları için minimum yapı:
1. draft
2. pending_payment
3. redirect_pending
4. awaiting_confirmation
5. paid
6. failed
7. cancelled
8. refunded

## Faz 7 - Unikazan Koçluk Yönlendirme Entegrasyonu

Amaç:
Koçluk ürünlerinde kullanıcıyı kontrollü biçimde dış ödeme akışına yönlendirmek.

Adımlar:
1. Koçluk ürünlerini içeride `provider = unikazan` olarak işaretle
2. Paket ile Unikazan dış paket kodu veya ID eşleşmesini tut
3. Kullanıcı satın alma butonuna bastığında yerel sipariş kaydı oluştur
4. Gerekli parametrelerle server-side entegrasyon çağrısını yap
5. Dış ödeme URL veya checkout referansını kayıt altına al
6. Kullanıcıyı güvenli şekilde yönlendir
7. Dönüş URL'lerinde siparişi geçici duruma al
8. Webhook veya durum sorgusu ile son ödemeyi doğrula
9. Başarılı ise koçluk haklarını ve görünürlüğünü kullanıcı hesabına işle

Zorunlu veri alanları:
1. local_order_id
2. provider_name
3. provider_package_id
4. provider_reference
5. redirect_url
6. redirect_at
7. callback_payload
8. callback_verified
9. payment_status

Risk notu:
Webhook veya doğrulanabilir sipariş sorgusu yoksa bu entegrasyon muhasebe açısından zayıf kalır.

## Faz 8 - Öğrenci Paneli ve LMS

Amaç:
Öğrencinin satın aldığı içerikleri düzenli biçimde kullanabildiği alanı oluşturmak.

Temel modüller:
1. Panel ana ekranı
2. Profil ve hesap ayarları
3. Satın alınan paketler
4. Ders modülleri ve oynatıcı
5. İlerleme takibi
6. İndirilebilir materyaller
7. Sipariş geçmişi
8. Koçluk görünümü ve durum alanı
9. Destek ve WhatsApp yönlendirmesi

Teknik ihtiyaçlar:
1. Erişim kontrolü
2. İmzalı video URL veya korumalı oynatma
3. Modül bazlı yayın açma-kapama
4. Temel ilerleme analitiği

## Faz 9 - Admin Paneli

Amaç:
Profesyonel ama öğrenmesi kolay bir operasyon merkezi kurmak.

Temel modüller:
1. Dashboard
2. Ürün ve kart yönetimi
3. Kategori yönetimi
4. Fiyat ve kampanya yönetimi
5. Kupon yönetimi
6. Sipariş yönetimi
7. Ödeme takibi
8. Kullanıcı yönetimi
9. Koçluk yönlendirme kayıtları
10. LMS içerik yönetimi
11. Banner ve sayfa bölümü yönetimi
12. WhatsApp lead yönetimi
13. Raporlama
14. Personel ve rol yönetimi
15. Sistem ayarları
16. Audit log görüntüleme

Admin paneli ilkeleri:
1. Karmaşık veri tabloları filtrelenebilir olmalı
2. Sık kullanılan işlemler iki tıklama içinde erişilebilir olmalı
3. Finansal ekranlar accounting rolü için özel filtreler taşımalı
4. Teknik bakım ekranları kullanıcı ekranlarından ayrılmalı

## Faz 10 - WhatsApp Altyapısı

Amaç:
Satış ve destek tarafını WhatsApp'a hazır hale getirmek.

Adımlar:
1. Sabit WhatsApp CTA bileşeni ekle
2. Paket bazlı ön tanımlı mesaj yapısı kur
3. Lead kaydını veritabanına yaz
4. Admin panelinde lead görüntüleme ekranı aç
5. İkinci aşama için resmi API veya sağlayıcı entegrasyon alanını hazır tut

İlk versiyonda minimum hedef:
1. Tıklanabilir WhatsApp butonu
2. Kaynağı takip edilen lead kaydı
3. UTM ve sayfa bilgisi ile birlikte kayıt

## Faz 11 - Güvenlik, SEO ve Ölçümleme

Amaç:
Canlıya çıkmadan önce sistemin görünürlüğünü ve dayanıklılığını artırmak.

Adımlar:
1. Teknik SEO temelini kur
2. Schema markup ekle
3. Site haritası ve robots yapılandır
4. Performans optimizasyonu yap
5. Yetki ve erişim testleri yap
6. Admin alanına ek güvenlik katmanları ekle
7. Olay loglama ve hata izlemeyi aktif et
8. Analytics ve dönüşüm olaylarını kur

## Faz 12 - Test ve Kabul Süreci

Amaç:
Yayın öncesi hem teknik hem operasyonel kaliteyi doğrulamak.

Test başlıkları:
1. Kayıt ve giriş testleri
2. Sepet ve ödeme testleri
3. Unikazan yönlendirme testleri
4. LMS erişim testleri
5. Rol bazlı admin testleri
6. Mobil görünüm testleri
7. Tarayıcı uyumluluk testleri
8. Hız ve yük testleri
9. Türkçe içerik ve karakter kontrolü
10. Muhasebe ve rapor eşleşme testleri

Kabul kriterleri:
1. Kritik akışlarda blocker seviye hata kalmaması
2. Sipariş ve ödeme kayıtlarının izlenebilir olması
3. Rol yetkilerinin beklendiği gibi çalışması
4. Mobil kullanılabilirliğin kabul edilebilir seviyede olması

## Faz 13 - Canlıya Alma

Amaç:
Sistemi güvenli ve kontrollü şekilde üretim ortamına taşımak.

Adımlar:
1. Production environment değerlerini tanımla
2. Domain ve SSL kur
3. Public ve admin domainlerini ayır
4. Veritabanı migrationlarını üretime geçir
5. Dosya depolama ve CDN'i bağla
6. Monitoring, alarm ve yedekleri aktif et
7. Son smoke testleri çalıştır
8. Canlıya al

## Faz 14 - Canlı Sonrası Stabilizasyon

Amaç:
İlk yayın sonrası operasyonel sorunları hızlı çözmek ve gerçek kullanım verisi toplamak.

İlk 30 gün planı:
1. Günlük hata ve performans takibi
2. Ödeme ve sipariş kayıtlarının manuel çapraz kontrolü
3. WhatsApp lead dönüşüm takibi
4. Admin kullanıcı geri bildirim toplama
5. LMS kullanım davranışı analizi
6. Gerekli küçük UX düzeltmeleri

## Harici Bağımlılıklar

Proje başlamadan veya erken fazlarda hazır olması gerekenler:

1. Domain ve hosting kararları
2. Kendi ödeme sağlayıcımızın hesap ve API bilgileri
3. Unikazan entegrasyon test bilgileri
4. Video barındırma sağlayıcısı kararı
5. Yasal metinler
6. KVKK ve çerez metinleri
7. Destek ve satış WhatsApp numarası
8. İçerik üretimi ve kurs materyali formatı

## Tavsiye Edilen İlk Sprint Sırası

1. Repo kurulumu
2. Veritabanı iskeleti
3. Kullanıcı auth sistemi
4. Public site iskeleti
5. Ürün modeli
6. Admin iskeleti
7. Kendi ödeme akışı
8. Unikazan yönlendirme adaptörü
9. LMS modülleri
10. Test ve sertleştirme

## Başlangıç İçin Eksik Kararlar

İnşaata başlamadan netleştirilmesi gereken son başlıklar:

1. Kendi ödeme sağlayıcımız hangisi olacak
2. Videolar hangi sağlayıcıda tutulacak
3. Admin rollerinin ekran bazlı yetkileri nasıl dağılacak
4. Koçluk satın alımı sonrası kullanıcı panelinde hangi bilgiler gösterilecek
5. İlk versiyonda sertifika, deneme sınavı veya ödev modülü olacak mı
